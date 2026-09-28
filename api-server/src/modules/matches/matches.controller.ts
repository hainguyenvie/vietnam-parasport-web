import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from "@nestjs/common";
import { MatchesService } from "./matches.service";
import { CreateMatchDto } from "./dto/create-match.dto";
import { UpdateMatchDto } from "./dto/update-match.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post()
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Get()
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sportId") sportId?: string,
    @Query("date") date?: string,
    @Query("tournamentId") tournamentId?: string,
    @Query("weightClass") weightClass?: string,
    @Query("classificationId") classificationId?: string,
    @Query("status") status?: string,
    @Query("location") location?: string
  ) {
    return this.matchesService.findAll({
      page,
      limit,
      sportId,
      date,
      tournamentId,
      weightClass,
      classificationId,
      status,
      location,
    });
  }

  @Get("locations")
  getLocations() {
    return this.matchesService.getDistinctLocations();
  }

  @Get("available-dates")
  getAvailableDates(
    @Query("sportId") sportId?: string,
    @Query("tournamentId") tournamentId?: string
  ) {
    return this.matchesService.getAvailableDates({ sportId, tournamentId });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.matchesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Put(":id")
  update(@Param("id") id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.matchesService.remove(id);
  }
}
