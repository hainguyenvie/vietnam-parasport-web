import { Controller, Get, Param, Res, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { CalendarService } from "./calendar.service";
import type { Response } from "express";

@ApiTags("Calendar")
@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get("tournaments/:id/ics")
  @ApiOperation({ summary: "Generate ICS file for tournament matches" })
  async getTournamentIcs(@Param("id") id: string, @Res() res: Response) {
    return this.calendarService.generateTournamentIcs(id, res);
  }

  @Get("matches/:id/google-link")
  @ApiOperation({ summary: "Get Google Calendar link for a specific match" })
  @ApiQuery({ name: "name", required: true, type: String })
  @ApiQuery({ name: "startTime", required: true, type: String })
  @ApiQuery({ name: "location", required: false, type: String })
  getGoogleCalendarLink(
    @Param("id") id: string,
    @Query("name") name: string,
    @Query("startTime") startTime: string,
    @Query("location") location: string
  ) {
    const link = this.calendarService.getGoogleCalendarLink(id, name, startTime, location || "TBA");
    return { link };
  }
}
