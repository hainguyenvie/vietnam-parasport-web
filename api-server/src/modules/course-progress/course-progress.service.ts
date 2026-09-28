import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CourseProgressService {
  constructor(private prisma: PrismaService) {}

  async updateProgress(userId: string, courseId: string, progressPct: number) {
    const isCompleted = progressPct >= 100;

    return this.prisma.userCourseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { progressPct, isCompleted },
      create: {
        user: { connect: { id: userId } },
        course: { connect: { id: courseId } },
        progressPct,
        isCompleted,
      },
    });
  }

  async getProgress(userId: string, courseId: string) {
    return this.prisma.userCourseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
  }

  async getAllUserProgress(userId: string) {
    return this.prisma.userCourseProgress.findMany({
      where: { userId },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnail: true },
        },
      },
    });
  }
}
