import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  // Admin: full question data including correct answers
  private questionInclude = { questions: true };

  async create(createQuizDto: any) {
    return this.prisma.quiz.create({ data: createQuizDto });
  }

  async findAll() {
    return this.prisma.quiz.findMany({
      include: this.questionInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async findByLesson(lessonId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { lessonId },
      include: this.questionInclude,
    });
    return quiz;
  }

  async findForStudent(lessonId: string) {
    return this.prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          select: { id: true, content: true, options: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: this.questionInclude,
    });
    if (!quiz) throw new NotFoundException(`Quiz #${id} not found`);
    return quiz;
  }

  async update(id: string, updateQuizDto: any) {
    await this.findOne(id);
    return this.prisma.quiz.update({
      where: { id },
      data: updateQuizDto,
      include: { questions: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.quiz.delete({
      where: { id },
    });
  }

  async createQuestion(quizId: string, createQuestionDto: any) {
    await this.findOne(quizId);
    return this.prisma.question.create({
      data: {
        ...createQuestionDto,
        quizId,
      },
    });
  }

  async removeQuestion(questionId: string) {
    return this.prisma.question.delete({
      where: { id: questionId },
    });
  }
}
