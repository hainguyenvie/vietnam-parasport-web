import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { RankingsService } from "./rankings.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateOrUpdateRankingDto } from "./dto/ranking.dto";

@Controller("rankings")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  createOrUpdate(@Body() rankingDto: CreateOrUpdateRankingDto) {
    return this.rankingsService.createOrUpdate(rankingDto);
  }

  @Get("sport/:sportId")
  findBySport(
    @Param("sportId") sportId: string,
    @Query("tournamentId") tournamentId?: string,
    @Query("disabilityId") disabilityId?: string,
    @Query("event") event?: string,
    @Query("classificationId") classificationId?: string,
    @Query("athleteName") athleteName?: string,
    @Query("weightClass") weightClass?: string,
    @Query("teamId") teamId?: string,
    @Query("organizationId") organizationId?: string
  ) {
    return this.rankingsService.findBySport(
      sportId,
      tournamentId,
      disabilityId,
      event,
      classificationId,
      athleteName,
      weightClass,
      teamId,
      organizationId
    );
  }

  @Get("tournament/:tournamentId")
  findByTournament(@Param("tournamentId") tournamentId: string) {
    return this.rankingsService.findByTournament(tournamentId);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.rankingsService.remove(id);
  }
}
