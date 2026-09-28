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
import { ChaptersService } from "./chapters.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateChapterDto, UpdateChapterDto } from "./dto/chapter.dto";

@Controller("chapters")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  findByCourse(@Query("courseId") courseId: string) {
    return this.chaptersService.findByCourse(courseId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  @Post()
  create(@Body() data: CreateChapterDto) {
    return this.chaptersService.create(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  @Put(":id")
  update(@Param("id") id: string, @Body() data: UpdateChapterDto) {
    return this.chaptersService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.chaptersService.remove(id);
  }
}
