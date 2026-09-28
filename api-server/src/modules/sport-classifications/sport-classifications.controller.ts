import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SportClassificationsService } from "./sport-classifications.service";
import { CreateSportClassificationDto } from "./dto/create-sport-classification.dto";
import { UpdateSportClassificationDto } from "./dto/update-sport-classification.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("sport-classifications")
export class SportClassificationsController {
  constructor(private readonly sportClassificationsService: SportClassificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() createSportClassificationDto: CreateSportClassificationDto) {
    return this.sportClassificationsService.create(createSportClassificationDto);
  }

  @Get()
  findAll(@Query("sportId") sportId?: string) {
    return this.sportClassificationsService.findAll(sportId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sportClassificationsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(
    @Param("id") id: string,
    @Body() updateSportClassificationDto: UpdateSportClassificationDto
  ) {
    return this.sportClassificationsService.update(id, updateSportClassificationDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.sportClassificationsService.remove(id);
  }
}
