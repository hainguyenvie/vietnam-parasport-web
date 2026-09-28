import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { title: string; description?: string; lessonId: string }) {
    return this.prisma.assignment.create({
      data,
    });
  }

  async update(id: string, data: { title?: string; description?: string }) {
    return this.prisma.assignment.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.assignment.delete({
      where: { id },
    });
  }

  async findByLesson(lessonId: string) {
    return this.prisma.assignment.findUnique({
      where: { lessonId },
    });
  }

  async submit(assignmentId: string, userId: string, data: { fileUrl?: string; text?: string }) {
    return this.prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId,
        },
      },
      update: {
        fileUrl: data.fileUrl,
        text: data.text,
        status: "PENDING",
      },
      create: {
        assignmentId,
        userId,
        fileUrl: data.fileUrl,
        text: data.text,
        status: "PENDING",
      },
    });
  }

  async grade(submissionId: string, data: { status: string; score?: number; feedback?: string }) {
    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data,
    });
  }

  async getSubmissions(assignmentId: string) {
    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
