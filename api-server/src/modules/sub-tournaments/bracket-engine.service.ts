import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BracketEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates a single elimination bracket for a list of participant IDs.
   * Participants could be userIds (for individual) or teamIds.
   * We will create Match records.
   */
  async generateSingleElimination(subTournamentId: string, participantIds: string[]) {
    const subTournament = await this.prisma.subTournament.findUnique({
      where: { id: subTournamentId },
    });

    if (!subTournament) {
      throw new BadRequestException("SubTournament not found");
    }

    if (participantIds.length < 2) {
      throw new BadRequestException("Need at least 2 participants to generate a bracket");
    }

    // Shuffle participants randomly (or you can use seeding)
    const shuffled = [...participantIds].sort(() => 0.5 - Math.random());

    // Calculate nearest power of 2
    const totalParticipants = shuffled.length;
    let power = 1;
    while (power < totalParticipants) {
      power *= 2;
    }

    const byes = power - totalParticipants;
    const firstRoundMatches = power / 2;

    const matchesToCreate = [];

    let currentParticipantIndex = 0;

    // Create First Round
    for (let i = 0; i < firstRoundMatches; i++) {
      const p1 = shuffled[currentParticipantIndex++] || null;
      const p2 =
        currentParticipantIndex < totalParticipants ? shuffled[currentParticipantIndex++] : null;

      matchesToCreate.push({
        title: `${subTournament.name || "Match"} - Vòng 1`,
        sportId: subTournament.sportId,
        tournamentId: subTournament.tournamentId,
        subTournamentId,
        round: "1",
        status: "SCHEDULED",
        participants: p1 && p2 ? [{ name: p1 }, { name: p2 }] : p1 ? [{ name: p1 }] : [],
      });
    }

    if (matchesToCreate.length > 0) {
      await this.prisma.match.createMany({ data: matchesToCreate as any });
    }

    return {
      message: "Single elimination bracket generated successfully",
      matchesCreated: matchesToCreate.length,
      totalParticipants,
      byes: power - totalParticipants,
    };
  }

  /**
   * Main entry point to generate bracket based on format
   */
  async generateBracket(subTournamentId: string, participantIds: string[]) {
    const subTournament = await this.prisma.subTournament.findUnique({
      where: { id: subTournamentId },
    });

    if (!subTournament) {
      throw new BadRequestException("SubTournament not found");
    }

    switch (subTournament.format) {
      case "SINGLE_ELIMINATION":
        return this.generateSingleElimination(subTournamentId, participantIds);
      case "DOUBLE_ELIMINATION":
        throw new BadRequestException("DOUBLE_ELIMINATION not implemented yet");
      case "ROUND_ROBIN":
        throw new BadRequestException("ROUND_ROBIN not implemented yet");
      default:
        throw new BadRequestException(`Format ${subTournament.format} is not supported`);
    }
  }
}
