import { Controller, Get } from "@nestjs/common";
import { StatisticsService } from "./statistics.service";

@Controller("statistics")
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get("summary")
  async getSummary() {
    return this.statisticsService.getSummary();
  }

  @Get("dashboard-charts")
  async getDashboardCharts() {
    return this.statisticsService.getDashboardCharts();
  }
}
