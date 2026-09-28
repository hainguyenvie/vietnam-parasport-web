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
import { SportEventsService } from "./sport-events.service";
import { CreateSportEventDto } from "./dto/create-sport-event.dto";
import { UpdateSportEventDto } from "./dto/update-sport-event.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("sport-events")
export class SportEventsController {
  constructor(private readonly sportEventsService: SportEventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() createSportEventDto: CreateSportEventDto) {
    return this.sportEventsService.create(createSportEventDto);
  }

  @Get()
  findAll(@Query("sportId") sportId?: string) {
    return this.sportEventsService.findAll(sportId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sportEventsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id") id: string, @Body() updateSportEventDto: UpdateSportEventDto) {
    return this.sportEventsService.update(id, updateSportEventDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.sportEventsService.remove(id);
  }
}
