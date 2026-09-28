import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TournamentGeneratorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Sinh sơ đồ thi đấu loại trực tiếp (Single Elimination)
   */
  async generateSingleElimination(tournamentId: string, sportId: string, teamIds: string[]) {
    if (teamIds.length < 2) {
      throw new BadRequestException("Cần ít nhất 2 đội để sinh sơ đồ thi đấu");
    }

    const n = teamIds.length;
    // Tìm lũy thừa của 2 gần nhất (VD: 11 đội -> 16)
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(n)));
    const byesCount = nextPowerOf2 - n;

    const rankings = await this.prisma.ranking.findMany({
      where: { tournamentId, sportId, id: { in: teamIds } },
    });

    // Sắp xếp đội theo Seed (Hạt giống). Nếu không có seed thì ưu tiên điểm hoặc xếp sau.
    const sortedTeams = [...teamIds].sort((a, b) => {
      const seedA = rankings.find((r) => r.id === a)?.seed ?? 9999;
      const seedB = rankings.find((r) => r.id === b)?.seed ?? 9999;
      return seedA - seedB;
    });

    // Thuật toán sinh mảng hạt giống chuẩn (Standard Bracket Seeding)
    let seeds = [1, 2];
    const totalRounds = Math.log2(nextPowerOf2);
    if (totalRounds > 1) {
      for (let i = 1; i < totalRounds; i++) {
        const nextSeeds = [];
        const length = Math.pow(2, i + 1);
        for (let j = 0; j < seeds.length; j++) {
          nextSeeds.push(seeds[j]);
          nextSeeds.push(length + 1 - seeds[j]);
        }
        seeds = nextSeeds;
      }
    } else if (totalRounds === 0) {
      seeds = [1];
    }

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new BadRequestException("Không tìm thấy giải đấu");

    // Xóa các trận đấu cũ của môn này trong giải đấu này để tạo lại sơ đồ mới
    // (deferred to end — only delete old matches after new ones are created successfully)

    // Mảng 2 chiều chứa danh sách ID trận đấu theo từng vòng. (Index 0 = Chung kết, Index 1 = Bán kết...)
    const roundsMatches: string[][] = [];

    // Tạo Chung kết
    let globalMatchIndex = 0;
    const finalMatch = await this.createMatchNode(
      tournamentId,
      sportId,
      "Chung kết",
      null,
      globalMatchIndex++
    );
    roundsMatches.push([finalMatch.id]);

    // Sinh các vòng trước đó (Bán kết, Tứ kết...)
    for (let r = 1; r < totalRounds; r++) {
      const currentRoundMatches = roundsMatches[r - 1]; // Trận đấu ở vòng cao hơn (VD: Chung kết)
      const prevRoundMatches: string[] = []; // Các trận đấu sẽ chỉa vào vòng hiện tại

      const roundName = this.getRoundName(r + 1);

      for (const parentId of currentRoundMatches) {
        // Sinh 2 trận con chỉa vào parentId
        const match1 = await this.createMatchNode(
          tournamentId,
          sportId,
          roundName,
          parentId,
          globalMatchIndex++
        );
        const match2 = await this.createMatchNode(
          tournamentId,
          sportId,
          roundName,
          parentId,
          globalMatchIndex++
        );
        prevRoundMatches.push(match1.id, match2.id);
      }
      roundsMatches.push(prevRoundMatches);
    }

    // Vòng ngoài cùng
    const outerMatches = roundsMatches[totalRounds - 1];

    for (let i = 0; i < outerMatches.length; i++) {
      const matchId = outerMatches[i];
      const participants = [];

      const seed1 = seeds[2 * i];
      const seed2 = seeds[2 * i + 1];

      const t1Id = seed1 <= n ? sortedTeams[seed1 - 1] : null;
      const t2Id = seed2 <= n ? sortedTeams[seed2 - 1] : null;

      if (t1Id) {
        const r1 = await this.prisma.ranking.findUnique({
          where: { id: t1Id },
          include: {
            athlete: {
              include: {
                user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
              },
            },
            team: { include: { members: true } },
          },
        });
        if (r1) {
          if (r1.team) {
            participants.push({
              id: t1Id,
              name: r1.team.name,
              score: 0,
              members: r1.team.members,
            });
          } else if (r1.athlete) {
            participants.push({
              id: t1Id,
              name: r1.athlete.user.fullName,
              score: 0,
            });
          }
        }
      }
      if (t2Id) {
        const r2 = await this.prisma.ranking.findUnique({
          where: { id: t2Id },
          include: {
            athlete: {
              include: {
                user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
              },
            },
            team: { include: { members: true } },
          },
        });
        if (r2) {
          if (r2.team) {
            participants.push({
              id: t2Id,
              name: r2.team.name,
              score: 0,
              members: r2.team.members,
            });
          } else if (r2.athlete) {
            participants.push({
              id: t2Id,
              name: r2.athlete.user.fullName,
              score: 0,
            });
          }
        }
      }

      if (participants.length === 1) {
        // Trận này có người được BYE
        await this.prisma.match.update({
          where: { id: matchId },
          data: {
            status: "COMPLETED",
            participants: participants,
            result: "BYE",
          },
        });
        await this.progressWinnerToNextMatch(matchId, participants);
      } else if (participants.length === 2) {
        // Trận đấu bình thường
        await this.prisma.match.update({
          where: { id: matchId },
          data: { participants: participants },
        });
      }
    }

    if (tournament.holdThirdPlaceMatch && roundsMatches.length > 1) {
      const semiFinals = roundsMatches[1];
      if (semiFinals.length === 2) {
        await this.createMatchNode(tournamentId, sportId, "Tranh hạng 3", null, globalMatchIndex++);
      }
    }

    // Delete old matches only after new match tree is successfully created
    await this.prisma.match.deleteMany({
      where: { tournamentId, sportId },
    });

    return {
      message: "Sơ đồ loại trực tiếp đã được tạo",
      totalMatches: Math.pow(2, totalRounds) - 1 + (tournament.holdThirdPlaceMatch ? 1 : 0),
    };
  }

  async generateRoundRobin(tournamentId: string, sportId: string, teamIds: string[]) {
    if (teamIds.length < 2) {
      throw new BadRequestException("Cần ít nhất 2 đội để sinh lịch thi đấu");
    }

    const n = teamIds.length;
    const isOdd = n % 2 !== 0;
    const players: (string | null)[] = [...teamIds];
    if (isOdd) {
      players.push(null); // 'null' acts as BYE
    }

    const totalRounds = players.length - 1;
    const matchesPerRound = players.length / 2;

    await this.prisma.match.deleteMany({
      where: { tournamentId, sportId },
    });

    for (let r = 0; r < totalRounds; r++) {
      const roundName = `Vòng bảng ${r + 1}`;

      for (let m = 0; m < matchesPerRound; m++) {
        const p1Id = players[m];
        const p2Id = players[players.length - 1 - m];

        if (p1Id === null || p2Id === null) {
          // It's a BYE round for the non-null player
          continue;
        }

        const participants = [];
        const r1 = await this.prisma.ranking.findUnique({
          where: { id: p1Id },
          include: {
            athlete: {
              include: {
                user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
              },
            },
            team: { include: { members: true } },
          },
        });
        const r2 = await this.prisma.ranking.findUnique({
          where: { id: p2Id },
          include: {
            athlete: {
              include: {
                user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
              },
            },
            team: { include: { members: true } },
          },
        });

        if (r1) {
          if (r1.team)
            participants.push({
              id: p1Id,
              name: r1.team.name,
              score: 0,
              members: r1.team.members,
            });
          else if (r1.athlete)
            participants.push({
              id: p1Id,
              name: r1.athlete.user.fullName,
              score: 0,
            });
        }
        if (r2) {
          if (r2.team)
            participants.push({
              id: p2Id,
              name: r2.team.name,
              score: 0,
              members: r2.team.members,
            });
          else if (r2.athlete)
            participants.push({
              id: p2Id,
              name: r2.athlete.user.fullName,
              score: 0,
            });
        }

        await this.prisma.match.create({
          data: {
            title: `Trận ${m + 1}`,
            tournamentId,
            sportId,
            round: roundName,
            location: "Chưa xác định",
            status: "SCHEDULED",
            participants: participants,
            matchFormat: "ROUND_ROBIN",
          },
        });
      }

      // Rotate players: keep index 0 fixed, shift others right
      const lastPlayer = players.pop();
      if (lastPlayer !== undefined) {
        players.splice(1, 0, lastPlayer);
      }
    }

    return { message: "Tạo lịch thi đấu vòng tròn thành công" };
  }

  private async createMatchNode(
    tournamentId: string,
    sportId: string,
    roundName: string,
    nextMatchId: string | null,
    timeOffset: number = 0
  ) {
    return this.prisma.match.create({
      data: {
        title: `Trận ${roundName}`,
        tournamentId,
        sportId,
        round: roundName,
        location: "Chưa xác định",
        status: "SCHEDULED",
        participants: [],
        nextMatchId: nextMatchId,
      },
    });
  }

  private getRoundName(level: number) {
    if (level === 1) return "Chung kết";
    if (level === 2) return "Bán kết";
    if (level === 3) return "Tứ kết";
    if (level === 4) return "Vòng 16";
    if (level === 5) return "Vòng 32";
    return `Vòng ${Math.pow(2, level)}`;
  }

  public async progressWinnerToNextMatch(matchId: string, participants: any[]) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        nextMatch: {
          include: {
            previousMatches: {
              orderBy: { startTime: "asc" },
            },
          },
        },
      },
    });

    if (!match || !match.nextMatchId || !match.nextMatch) return;

    // Xác định người thắng
    let winner = participants.find((p) => p.isWinner);
    if (!winner && participants.length === 1) {
      // Bye team
      winner = participants[0];
    }

    if (winner) {
      const nextMatch = match.nextMatch;
      let nextParticipants = nextMatch.participants
        ? typeof nextMatch.participants === "string"
          ? JSON.parse(nextMatch.participants)
          : nextMatch.participants
        : [];
      if (!Array.isArray(nextParticipants)) nextParticipants = [];

      // Ensure length is 2 so we can assign to specific slots safely
      if (nextParticipants.length < 2) {
        // Find existing non-null items and expand to length 2
        const p0 = nextParticipants[0] || null;
        const p1 = nextParticipants[1] || null;
        nextParticipants = [p0, p1];
      }

      // Determine if this match is the top (0) or bottom (1) child
      const childIndex = nextMatch.previousMatches.findIndex((m) => m.id === matchId);
      const slotIndex = childIndex >= 0 ? childIndex : 0; // fallback to 0

      // Only add if not already in the match
      const exists = nextParticipants.some((p: any) => p && p.id === winner.id);

      if (!exists) {
        nextParticipants[slotIndex] = {
          id: winner.id,
          name: winner.name,
          score: 0,
          isWinner: null,
        };

        // Filter out nulls if we want it to be clean, but Prisma Json can handle null.
        // The UI maps through [0, 1] so having null is totally fine.
        await this.prisma.match.update({
          where: { id: match.nextMatchId },
          data: { participants: nextParticipants },
        });
      }
    }
  }
}
