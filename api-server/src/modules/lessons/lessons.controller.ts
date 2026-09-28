import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { CreateLessonDto, UpdateLessonDto } from "./dto/lesson.dto";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("lessons")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  findByChapter(@Query("chapterId") chapterId: string) {
    return this.lessonsService.findByChapter(chapterId);
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.lessonsService.findBySlug(slug);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.lessonsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  @Post()
  create(@Body() data: CreateLessonDto) {
    return this.lessonsService.create(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  @Put(":id")
  update(@Param("id") id: string, @Body() data: UpdateLessonDto) {
    return this.lessonsService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.lessonsService.remove(id);
  }
}
