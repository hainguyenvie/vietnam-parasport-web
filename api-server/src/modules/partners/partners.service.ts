import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.partner.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; logoUrl: string; website?: string }) {
    return this.prisma.partner.create({
      data,
    });
  }

  async update(id: string, data: { name?: string; logoUrl?: string; website?: string }) {
    return this.prisma.partner.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.partner.delete({
      where: { id },
    });
  }
}
