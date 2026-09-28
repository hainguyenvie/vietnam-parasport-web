import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DisabilityTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createDisabilityTypeDto: any) {
    return this.prisma.disabilityType.create({
      data: createDisabilityTypeDto,
    });
  }

  async findAll() {
    return this.prisma.disabilityType.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const disabilityType = await this.prisma.disabilityType.findUnique({
      where: { id },
    });
    if (!disabilityType) {
      throw new NotFoundException(`DisabilityType with ID ${id} not found`);
    }
    return disabilityType;
  }

  async update(id: string, updateDisabilityTypeDto: any) {
    await this.findOne(id);
    return this.prisma.disabilityType.update({
      where: { id },
      data: updateDisabilityTypeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.disabilityType.delete({
      where: { id },
    });
  }
}
