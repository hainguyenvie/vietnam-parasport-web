import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAssistantProfileDto } from "./dto/create-assistant-profile.dto";
import { UpdateAssistantProfileDto } from "./dto/update-assistant-profile.dto";

@Injectable()
export class AssistantProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(createAssistantProfileDto: CreateAssistantProfileDto) {
    return this.prisma.assistantProfile.create({
      data: createAssistantProfileDto,
    });
  }

  async findAll() {
    return this.prisma.assistantProfile.findMany({
      include: {
        user: true,
        athlete: true,
      },
    });
  }

  async findOne(id: string) {
    const assistantProfile = await this.prisma.assistantProfile.findUnique({
      where: { id },
      include: {
        user: true,
        athlete: true,
      },
    });

    if (!assistantProfile) {
      throw new NotFoundException(`AssistantProfile with ID ${id} not found`);
    }
    return assistantProfile;
  }

  async update(id: string, updateAssistantProfileDto: UpdateAssistantProfileDto) {
    const exists = await this.prisma.assistantProfile.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`AssistantProfile with ID ${id} not found`);
    }

    return this.prisma.assistantProfile.update({
      where: { id },
      data: updateAssistantProfileDto,
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.assistantProfile.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`AssistantProfile with ID ${id} not found`);
    }

    return this.prisma.assistantProfile.delete({
      where: { id },
    });
  }
}
