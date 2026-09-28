import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CapcutTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.capcutTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.capcutTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`Template with id ${id} not found`);
    }
    return template;
  }

  async create(data: {
    title: string;
    description?: string;
    capcutLink: string;
    thumbnailUrl?: string;
  }) {
    return this.prisma.capcutTemplate.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      capcutLink?: string;
      thumbnailUrl?: string;
    }
  ) {
    await this.findOne(id);
    return this.prisma.capcutTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.capcutTemplate.delete({
      where: { id },
    });
  }
}
