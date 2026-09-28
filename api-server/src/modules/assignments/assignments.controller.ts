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
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { AssignmentsService } from "./assignments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeAssignmentDto,
} from "./dto/assignment.dto";

@Controller("assignments")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "INSTRUCTOR")
  create(@Body() createDto: CreateAssignmentDto) {
    return this.assignmentsService.create(createDto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "INSTRUCTOR")
  update(@Param("id") id: string, @Body() updateDto: UpdateAssignmentDto) {
    return this.assignmentsService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "INSTRUCTOR")
  remove(@Param("id") id: string) {
    return this.assignmentsService.remove(id);
  }

  @Get("lesson/:lessonId")
  findByLesson(@Param("lessonId") lessonId: string) {
    return this.assignmentsService.findByLesson(lessonId);
  }

  @Post(":id/submit")
  @UseGuards(JwtAuthGuard)
  submit(@Param("id") id: string, @Request() req: any, @Body() body: SubmitAssignmentDto) {
    return this.assignmentsService.submit(id, req.user.id, body);
  }

  @Get(":id/submissions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "INSTRUCTOR")
  getSubmissions(@Param("id") id: string) {
    return this.assignmentsService.getSubmissions(id);
  }

  @Put("submissions/:submissionId/grade")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "INSTRUCTOR")
  grade(@Param("submissionId") submissionId: string, @Body() body: GradeAssignmentDto) {
    return this.assignmentsService.grade(submissionId, body);
  }
}
