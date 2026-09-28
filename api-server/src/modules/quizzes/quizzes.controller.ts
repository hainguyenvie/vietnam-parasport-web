import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { QuizzesService } from "./quizzes.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateQuizDto, UpdateQuizDto, CreateQuizQuestionDto } from "./dto/quiz.dto";

@Controller("quizzes")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizzesService.create(createQuizDto);
  }

  @Get()
  findAll() {
    return this.quizzesService.findAll();
  }

  @Get("lesson/:lessonId")
  findByLesson(@Param("lessonId") lessonId: string) {
    return this.quizzesService.findByLesson(lessonId);
  }

  @Get("lesson/:lessonId/student")
  findForStudent(@Param("lessonId") lessonId: string) {
    return this.quizzesService.findForStudent(lessonId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.quizzesService.findOne(id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  update(@Param("id") id: string, @Body() updateQuizDto: UpdateQuizDto) {
    return this.quizzesService.update(id, updateQuizDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  remove(@Param("id") id: string) {
    return this.quizzesService.remove(id);
  }

  @Post(":id/questions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  createQuestion(@Param("id") id: string, @Body() createQuestionDto: CreateQuizQuestionDto) {
    return this.quizzesService.createQuestion(id, createQuestionDto);
  }

  @Delete("questions/:questionId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "INSTRUCTOR")
  removeQuestion(@Param("questionId") questionId: string) {
    return this.quizzesService.removeQuestion(questionId);
  }
}
