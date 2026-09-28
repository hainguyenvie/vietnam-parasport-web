import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CoursesService } from "./courses.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateCourseDto, UpdateCourseDto } from "./dto/course.dto";

@Controller("courses")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get("admin/fix-all-slugs")
  async fixAllSlugs() {
    return this.coursesService.fixAllSlugs();
  }

  @Get(":slug")
  async findOne(@Param("slug") slug: string) {
    const course = await this.coursesService.findOne(slug);
    if (!course) throw new NotFoundException("Course not found");
    return course;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  @Post()
  create(@Request() req: any, @Body() data: CreateCourseDto) {
    return this.coursesService.create({
      ...data,
      instructorId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  @Put(":id")
  update(@Param("id") id: string, @Body() data: UpdateCourseDto) {
    return this.coursesService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.coursesService.remove(id);
  }
}
