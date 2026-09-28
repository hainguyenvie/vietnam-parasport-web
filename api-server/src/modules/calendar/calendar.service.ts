import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import ical from "ical-generator";
import { Response } from "express";

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async generateTournamentIcs(tournamentId: string, res: Response) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        matches: {
          include: { sport: true },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }

    const calendar = ical({
      name: `Tournament: ${tournament.name || "Tournament"}`,
      timezone: "Asia/Ho_Chi_Minh",
    });

    tournament.matches.forEach((match) => {
      if (match.startTime) {
        // End time is assumed to be 2 hours after start time if not provided
        const endTime = new Date(match.startTime);
        endTime.setHours(endTime.getHours() + 2);

        calendar.createEvent({
          start: match.startTime,
          end: endTime,
          summary: (match as any).name || (match as any).nameVi || "Match",
          description: `Sport: ${(match.sport as any)?.nameVi || "N/A"}\nStatus: ${match.status}`,
          location: tournament.location || "TBA",
        });
      }
    });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="tournament-${tournamentId}.ics"`);

    res.send(calendar.toString());
  }

  getGoogleCalendarLink(matchId: string, matchName: string, startTime: string, location: string) {
    const start = new Date(startTime).toISOString().replace(/-|:|\.\d+/g, "");
    const endObj = new Date(startTime);
    endObj.setHours(endObj.getHours() + 2);
    const end = endObj.toISOString().replace(/-|:|\.\d+/g, "");

    const details = encodeURIComponent(`Match: ${matchName}`);
    const loc = encodeURIComponent(location);
    const text = encodeURIComponent(matchName);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${loc}`;
  }
}
