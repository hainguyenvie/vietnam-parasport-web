import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Logger,
  UseGuards,
} from "@nestjs/common";
import { TournamentsService } from "./tournaments.service";
import { TournamentGeneratorService } from "./tournaments.generator.service";
import { CreateTournamentDto } from "./dto/create-tournament.dto";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
import { AddParticipantDto, UpdateParticipantStatusDto } from "./dto/participant.dto";
import { CheckInTournamentDto } from "./dto/check-in-tournament.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("tournaments")
export class TournamentsController {
  private readonly logger = new Logger(TournamentsController.name);

  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly generatorService: TournamentGeneratorService
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post(":id/generate-bracket")
  async generateBracket(
    @Param("id") id: string,
    @Body("sportId") sportId: string,
    @Body("teamIds") teamIds: string[],
    @Body("format") format?: string
  ) {
    try {
      if (format === "ROUND_ROBIN") {
        return await this.generatorService.generateRoundRobin(id, sportId, teamIds);
      }
      return await this.generatorService.generateSingleElimination(id, sportId, teamIds);
    } catch (e) {
      this.logger.error("GENERATE BRACKET ERROR:", e);
      throw e;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTournamentDto: UpdateTournamentDto) {
    return this.tournamentsService.update(id, updateTournamentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tournamentsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post(":id/participants")
  async addParticipant(@Param("id") id: string, @Body() data: AddParticipantDto) {
    try {
      return await this.tournamentsService.addParticipant(id, data);
    } catch (e) {
      this.logger.error("ADD PARTICIPANT ERROR:", e);
      throw e;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post()
  create(@Body() createTournamentDto: CreateTournamentDto) {
    return this.tournamentsService.create(createTournamentDto);
  }

  @Get()
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("sportId") sportId?: string,
    @Query("location") location?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("weightClass") weightClass?: string,
    @Query("classificationId") classificationId?: string
  ) {
    return this.tournamentsService.findAll({
      page,
      limit,
      status,
      sportId,
      location,
      startDate,
      endDate,
      weightClass,
      classificationId,
    });
  }

  @Get("available-dates")
  getAvailableDates(@Query("sportId") sportId?: string) {
    return this.tournamentsService.getAvailableDates({ sportId });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tournamentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Patch(":id/participants/:rankingId/status")
  async updateParticipantStatus(
    @Param("id") id: string,
    @Param("rankingId") rankingId: string,
    @Body() data: UpdateParticipantStatusDto
  ) {
    return this.tournamentsService.updateParticipantStatus(id, rankingId, data.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Patch(":id/participants/:rankingId/checkin")
  async updateParticipantCheckIn(
    @Param("id") id: string,
    @Param("rankingId") rankingId: string,
    @Body() data: CheckInTournamentDto
  ) {
    return this.tournamentsService.updateParticipantCheckIn(id, rankingId, data.hasCheckedIn);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id/participants/:rankingId")
  async removeParticipant(@Param("id") id: string, @Param("rankingId") rankingId: string) {
    return this.tournamentsService.removeParticipant(id, rankingId);
  }
}
