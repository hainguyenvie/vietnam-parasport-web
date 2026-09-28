import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ChaptersService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.chapter.create({ data });
  }

  async findByCourse(courseId: string) {
    return this.prisma.chapter.findMany({
      where: { courseId },
      include: { lessons: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.chapter.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.chapter.delete({ where: { id } });
  }
}
