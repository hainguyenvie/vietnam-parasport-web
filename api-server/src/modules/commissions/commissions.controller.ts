import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { CommissionsService } from "./commissions.service";
import { CreateCommissionDto } from "./dto/create-commission.dto";
import { ProcessPayoutDto } from "./dto/process-payout.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get("commissions")
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("search") search?: string
  ) {
    return this.commissionsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      search,
    });
  }

  @Post("commissions")
  create(@Body() data: CreateCommissionDto) {
    return this.commissionsService.create(data);
  }

  @Get("commissions/athlete/:id")
  findByAthlete(
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.commissionsService.findByAthlete(id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Put("commissions/:id/approve")
  approve(@Param("id") id: string) {
    return this.commissionsService.approve(id);
  }

  @Put("commissions/:id/reject")
  reject(@Param("id") id: string, @Body() body: { notes?: string }) {
    return this.commissionsService.reject(id, body.notes);
  }

  @Get("payouts")
  getAllPayouts(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string
  ) {
    return this.commissionsService.getAllPayouts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get("payouts/athlete/:id")
  getAthletePayouts(
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.commissionsService.getAthletePayouts(id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Put("payouts/:id/process")
  processPayout(@Param("id") id: string, @Body() data: ProcessPayoutDto) {
    return this.commissionsService.processPayout(id, data);
  }
}
