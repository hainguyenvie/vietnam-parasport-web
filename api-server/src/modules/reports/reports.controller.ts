import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Reports")
@Controller("reports")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("tournaments/:id/excel")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Queue tournament Excel export" })
  async exportExcel(@Param("id") id: string) {
    return this.reportsService.exportTournamentExcel(id);
  }

  @Get("tournaments/:id/pdf")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Queue tournament PDF export" })
  async exportPdf(@Param("id") id: string) {
    return this.reportsService.exportTournamentPdf(id);
  }

  @Get("jobs/:id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Check export job status" })
  async getJobStatus(@Param("id") id: string) {
    return this.reportsService.getJobStatus(id);
  }

  @Get("jobs/:id/download")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Download completed export file" })
  async downloadJob(@Param("id") id: string, @Res() res: Response) {
    return this.reportsService.downloadJob(id, res);
  }
}
