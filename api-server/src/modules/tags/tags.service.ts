import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.tag.create({ data });
  }

  async findAll() {
    return this.prisma.tag.findMany();
  }

  async findOne(id: string) {
    return this.prisma.tag.findUnique({ where: { id } });
  }
}
