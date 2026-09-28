import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdate(rankingDto: any) {
    const { sportId, athleteId, rank, points, tournamentId, eventId, classificationId } =
      rankingDto;

    return this.prisma.$transaction(async (tx) => {
      // Since we removed unique constraint on sportId + athleteId, we find the first matching record
      const existing = await tx.ranking.findFirst({
        where: {
          sportId,
          athleteId,
          tournamentId: tournamentId || null,
          eventId: eventId || null,
          classificationId: classificationId || null,
        },
      });

      let ranking;
      if (existing) {
        ranking = await tx.ranking.update({
          where: { id: existing.id },
          data: { rank, points },
        });
      } else {
        ranking = await tx.ranking.create({
          data: {
            sportId,
            athleteId,
            rank,
            points,
            tournamentId,
            eventId,
            classificationId,
          },
        });
      }

      // Auto-sync achievements
      if (athleteId && rank <= 3 && tournamentId) {
        const medal = rank === 1 ? "GOLD" : rank === 2 ? "SILVER" : "BRONZE";

        const existingAchievement = await tx.athleteAchievement.findFirst({
          where: {
            athleteId,
            tournamentId,
            eventId: eventId || null,
            classificationId: classificationId || null,
          },
        });

        if (existingAchievement) {
          await tx.athleteAchievement.update({
            where: { id: existingAchievement.id },
            data: { medal, isVerified: true },
          });
        } else {
          await tx.athleteAchievement.create({
            data: {
              athleteId,
              tournamentId,
              eventId: eventId || null,
              classificationId: classificationId || null,
              medal,
              isVerified: true,
            },
          });
        }
      }

      return ranking;
    });
  }

  async findBySport(
    sportId: string,
    tournamentId?: string,
    disabilityId?: string,
    eventId?: string,
    classificationId?: string,
    athleteName?: string,
    weightClass?: string,
    teamId?: string,
    organizationId?: string
  ) {
    const where: any = { sportId };

    if (tournamentId) {
      where.tournamentId = tournamentId;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (classificationId) {
      where.classificationId = classificationId;
    }

    if (disabilityId) {
      where.athlete = {
        ...(where.athlete || {}),
        disabilityId,
      };
    }

    if (teamId) {
      where.teamId = teamId;
    }

    if (organizationId) {
      where.athlete = {
        ...(where.athlete || {}),
        organizationId,
      };
    }

    if (athleteName) {
      where.athlete = {
        ...(where.athlete || {}),
        user: {
          fullName: { contains: athleteName, mode: "insensitive" },
        },
      };
    }

    if (weightClass) {
      where.event = {
        name: { contains: weightClass, mode: "insensitive" },
      };
    }

    return this.prisma.ranking.findMany({
      where,
      include: {
        athlete: {
          include: {
            user: true,
            disability: true,
          },
        },
        team: true,
        tournament: true,
        event: true,
        classification: true,
      },
      orderBy: { rank: "asc" },
    });
  }

  async findByTournament(tournamentId: string) {
    return this.prisma.ranking.findMany({
      where: { tournamentId },
      include: {
        athlete: {
          include: {
            user: true,
            disability: true,
          },
        },
        team: true,
        tournament: true,
        sport: true,
        event: true,
        classification: true,
      },
      orderBy: [{ sportId: "asc" }, { rank: "asc" }],
    });
  }

  async remove(id: string) {
    return this.prisma.ranking.delete({
      where: { id },
    });
  }
}
