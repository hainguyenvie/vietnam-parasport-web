import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SportsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sport.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  async findOne(id: string) {
    const sport = await this.prisma.sport.findUnique({
      where: { id },
    });
    if (!sport) {
      throw new NotFoundException(`Sport with ID ${id} not found`);
    }
    return sport;
  }

  async findBySlug(slug: string) {
    const sport = await this.prisma.sport.findUnique({
      where: { slug },
    });
    if (!sport) {
      throw new NotFoundException(`Sport with slug ${slug} not found`);
    }
    return sport;
  }

  async create(data: {
    nameVi: string;
    nameEn: string;
    slug: string;
    icon: string;
    descVi: string;
    descEn: string;
    detailDescVi: string;
    detailDescEn: string;
  }) {
    return this.prisma.sport.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      nameVi?: string;
      nameEn?: string;
      slug?: string;
      icon?: string;
      descVi?: string;
      descEn?: string;
      detailDescVi?: string;
      detailDescEn?: string;
    }
  ) {
    await this.findOne(id);
    return this.prisma.sport.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.sport.delete({
      where: { id },
    });
  }
}
