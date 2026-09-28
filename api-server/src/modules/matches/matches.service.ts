import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateMatchDto } from "./dto/create-match.dto";
import { UpdateMatchDto } from "./dto/update-match.dto";
import { LiveScoreGateway } from "./live-score.gateway";

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private liveScoreGateway: LiveScoreGateway
  ) {}

  async create(createMatchDto: CreateMatchDto) {
    const match = await this.prisma.match.create({
      data: createMatchDto as any,
    });
    this.liveScoreGateway.emitScoreUpdate(match.id, match);
    return match;
  }

  async findAll(params?: {
    page?: string;
    limit?: string;
    sportId?: string;
    date?: string;
    tournamentId?: string;
    weightClass?: string;
    classificationId?: string;
    status?: string;
    location?: string;
  }) {
    const where: any = {};
    if (params?.tournamentId) {
      const ids = params.tournamentId.split(",").filter(Boolean);
      if (ids.length > 1) where.tournamentId = { in: ids };
      else if (ids.length === 1) where.tournamentId = ids[0];
    }
    if (params?.sportId) {
      const sportIds = params.sportId.split(",").filter(Boolean);
      if (sportIds.length > 0) {
        where.sportId = { in: sportIds };
      }
    }
    if (params?.weightClass) {
      where.event = {
        name: {
          contains: params.weightClass,
          mode: "insensitive",
        },
      };
    }
    if (params?.classificationId) {
      const classIds = params.classificationId.split(",").filter(Boolean);
      if (classIds.length > 0) {
        where.classificationId = { in: classIds };
      }
    }
    if (params?.date) {
      const startOfDay = new Date(`${params.date}T00:00:00.000Z`);
      const endOfDay = new Date(`${params.date}T23:59:59.999Z`);
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
    if (params?.status && params.status !== "all") {
      where.status = params.status;
    }
    if (params?.location) {
      where.tournament = {
        location: { contains: params.location, mode: "insensitive" },
      };
    }

    const query: any = {
      where,
      include: {
        sport: true,
        tournament: true,
        event: true,
        classification: true,
      },
      orderBy: { startTime: "desc" },
    };

    if (params?.page && params?.limit) {
      const page = parseInt(params.page, 10);
      const limit = parseInt(params.limit, 10);
      query.skip = (page - 1) * limit;
      query.take = limit;

      const [data, total] = await Promise.all([
        this.prisma.match.findMany(query),
        this.prisma.match.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return this.prisma.match.findMany(query);
  }

  async findOne(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        sport: true,
        tournament: {
          include: { matches: true },
        },
        events: { orderBy: { createdAt: "asc" } },
        comments: {
          include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!match) {
      throw new NotFoundException(`Match #${id} not found`);
    }
    return match;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto) {
    const existingMatch = await this.findOne(id);

    if (
      (existingMatch.status as string) === "COMPLETED" &&
      updateMatchDto.result !== existingMatch.result
    ) {
      throw new BadRequestException("Không thể sửa kết quả trận đấu đã kết thúc");
    }

    const updated = await this.prisma.match.update({
      where: { id },
      data: updateMatchDto as any,
      include: { nextMatch: true },
    });

    this.liveScoreGateway.emitScoreUpdate(id, updated);

    if ((updated.status as string) === "COMPLETED") {
      await this.progressWinnerToNextMatch(id, updated.participants as any[], existingMatch);
    }

    return updated;
  }

  private async progressWinnerToNextMatch(
    matchId: string,
    participants: any[],
    existingMatch?: any
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { nextMatch: true },
    });

    if (!match || !participants) return;

    let winner = participants.find((p: any) => p.isWinner);
    if (!winner && participants.length === 1) {
      winner = participants[0];
    }

    const loser = participants.find((p: any) => p.isWinner === false);

    // If there was an old winner, we might need to replace them
    let oldWinner = null;
    if (existingMatch && existingMatch.participants) {
      const oldPts =
        typeof existingMatch.participants === "string"
          ? JSON.parse(existingMatch.participants)
          : existingMatch.participants;
      oldWinner = Array.isArray(oldPts) ? oldPts.find((p: any) => p.isWinner) : null;
    }

    // Progress winner to next match
    if (winner && match.nextMatchId && match.nextMatch) {
      const nextMatch = match.nextMatch;
      let nextParticipants = nextMatch.participants
        ? typeof nextMatch.participants === "string"
          ? JSON.parse(nextMatch.participants)
          : nextMatch.participants
        : [];
      if (!Array.isArray(nextParticipants)) nextParticipants = [];

      let updatedNextPts = false;

      // If we have an old winner, replace them in the next match
      if (oldWinner && oldWinner.id !== winner.id) {
        const oldWinnerIndex = nextParticipants.findIndex((p: any) => p.id === oldWinner.id);
        if (oldWinnerIndex !== -1) {
          nextParticipants[oldWinnerIndex] = {
            id: winner.id,
            name: winner.name,
            score: 0,
            isWinner: null,
          };
          updatedNextPts = true;
        }
      }

      const exists = nextParticipants.find((p: any) => p.id === winner.id);
      if (!exists && !updatedNextPts && nextParticipants.length < 2) {
        nextParticipants.push({
          id: winner.id,
          name: winner.name,
          score: 0,
          isWinner: null,
        });
        updatedNextPts = true;
      }

      if (updatedNextPts) {
        await this.prisma.match.update({
          where: { id: match.nextMatchId },
          data: { participants: nextParticipants },
        });
      }
    }

    // Progress loser to third-place match if this is a Semi-final
    if (loser && match.round === "Bán kết") {
      let oldLoser = null;
      if (existingMatch && existingMatch.participants) {
        const oldPts =
          typeof existingMatch.participants === "string"
            ? JSON.parse(existingMatch.participants)
            : existingMatch.participants;
        oldLoser = Array.isArray(oldPts) ? oldPts.find((p: any) => p.isWinner === false) : null;
      }

      const thirdPlaceMatch = await this.prisma.match.findFirst({
        where: {
          tournamentId: match.tournamentId,
          sportId: match.sportId,
          round: "Tranh hạng 3",
        },
      });

      if (thirdPlaceMatch) {
        let tpParticipants = thirdPlaceMatch.participants
          ? typeof thirdPlaceMatch.participants === "string"
            ? JSON.parse(thirdPlaceMatch.participants)
            : thirdPlaceMatch.participants
          : [];
        if (!Array.isArray(tpParticipants)) tpParticipants = [];

        let updatedTpPts = false;

        // Replace old loser
        if (oldLoser && oldLoser.id !== loser.id) {
          const oldLoserIndex = tpParticipants.findIndex((p: any) => p.id === oldLoser.id);
          if (oldLoserIndex !== -1) {
            tpParticipants[oldLoserIndex] = {
              id: loser.id,
              name: loser.name,
              score: 0,
              isWinner: null,
            };
            updatedTpPts = true;
          }
        }

        const exists = tpParticipants.find((p: any) => p.id === loser.id);
        if (!exists && !updatedTpPts && tpParticipants.length < 2) {
          tpParticipants.push({
            id: loser.id,
            name: loser.name,
            score: 0,
            isWinner: null,
          });
          updatedTpPts = true;
        }

        if (updatedTpPts) {
          await this.prisma.match.update({
            where: { id: thirdPlaceMatch.id },
            data: { participants: tpParticipants },
          });
        }
      }
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.match.delete({
      where: { id },
    });
  }

  async getAvailableDates(params?: { sportId?: string; tournamentId?: string }) {
    const where: any = {};
    if (params?.sportId) {
      const sportIds = params.sportId.split(",").filter(Boolean);
      if (sportIds.length > 0) where.sportId = { in: sportIds };
    }
    if (params?.tournamentId) {
      const ids = params.tournamentId.split(",").filter(Boolean);
      if (ids.length > 1) where.tournamentId = { in: ids };
      else if (ids.length === 1) where.tournamentId = ids[0];
    }
    const matches = await this.prisma.match.findMany({
      where,
      select: { startTime: true },
    });
    const dates = new Set<string>();
    matches.forEach((m) => {
      if (m.startTime) dates.add(m.startTime.toISOString().slice(0, 10));
    });
    return Array.from(dates).sort();
  }

  async getDistinctLocations() {
    const matches = await this.prisma.match.findMany({
      select: { location: true },
      distinct: ["location"],
      where: { location: { not: "" } },
      orderBy: { location: "asc" },
    });
    return matches.map((m) => m.location).filter(Boolean);
  }
}
