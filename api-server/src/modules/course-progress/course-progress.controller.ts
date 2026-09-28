import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CourseProgressService } from "./course-progress.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UpdateCourseProgressDto } from "./dto/course-progress.dto";

@Controller("course-progress")
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class CourseProgressController {
  constructor(private readonly courseProgressService: CourseProgressService) {}

  @Get()
  getAllUserProgress(@Request() req: any) {
    return this.courseProgressService.getAllUserProgress(req.user.id);
  }

  @Get(":courseId")
  getProgress(@Request() req: any, @Param("courseId") courseId: string) {
    return this.courseProgressService.getProgress(req.user.id, courseId);
  }

  @Post()
  updateProgress(@Request() req: any, @Body() body: UpdateCourseProgressDto) {
    return this.courseProgressService.updateProgress(req.user.id, body.courseId, body.progressPct);
  }
}
