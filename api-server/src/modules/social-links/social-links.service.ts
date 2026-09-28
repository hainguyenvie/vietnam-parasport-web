import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSocialLinkDto } from "./dto/create-social-link.dto";
import { UpdateSocialLinkDto } from "./dto/update-social-link.dto";

@Injectable()
export class SocialLinksService {
  constructor(private prisma: PrismaService) {}

  async create(createSocialLinkDto: CreateSocialLinkDto) {
    return this.prisma.socialLink.create({
      data: createSocialLinkDto,
    });
  }

  async findAll(onlyActive: boolean = false) {
    const where = onlyActive ? { isActive: true } : {};
    return this.prisma.socialLink.findMany({
      where,
      orderBy: { order: "asc" },
    });
  }

  async findOne(id: string) {
    const link = await this.prisma.socialLink.findUnique({
      where: { id },
    });
    if (!link) {
      throw new NotFoundException(`Social Link with ID ${id} not found`);
    }
    return link;
  }

  async update(id: string, updateSocialLinkDto: UpdateSocialLinkDto) {
    await this.findOne(id); // Check existence
    return this.prisma.socialLink.update({
      where: { id },
      data: updateSocialLinkDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    return this.prisma.socialLink.delete({
      where: { id },
    });
  }
}
