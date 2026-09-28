import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AthleteAchievementsService } from "./athlete-achievements.service";
import { CreateAthleteAchievementDto } from "./dto/create-athlete-achievement.dto";
import { UpdateAthleteAchievementDto } from "./dto/update-athlete-achievement.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("athlete-achievements")
export class AthleteAchievementsController {
  constructor(private readonly athleteAchievementsService: AthleteAchievementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() createAthleteAchievementDto: CreateAthleteAchievementDto) {
    return this.athleteAchievementsService.create(createAthleteAchievementDto);
  }

  @Post("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("USER")
  createByUser(
    @Request() req: any,
    @Body() createAthleteAchievementDto: CreateAthleteAchievementDto
  ) {
    return this.athleteAchievementsService.createByUser(req.user.id, createAthleteAchievementDto);
  }

  @Get()
  findAll(@Query("athleteId") athleteId?: string) {
    return this.athleteAchievementsService.findAll(athleteId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.athleteAchievementsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(
    @Param("id") id: string,
    @Body() updateAthleteAchievementDto: UpdateAthleteAchievementDto
  ) {
    return this.athleteAchievementsService.update(id, updateAthleteAchievementDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.athleteAchievementsService.remove(id);
  }

  @Put(":id/feature")
  @UseGuards(JwtAuthGuard)
  async toggleFeature(@Request() req: any, @Param("id") id: string) {
    return this.athleteAchievementsService.toggleFeature(id, req.user.id);
  }
}
