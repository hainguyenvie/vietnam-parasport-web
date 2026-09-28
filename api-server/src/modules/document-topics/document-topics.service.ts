import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateDocumentTopicDto } from "./dto/create-document-topic.dto";
import { UpdateDocumentTopicDto } from "./dto/update-document-topic.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DocumentTopicsService {
  constructor(private prisma: PrismaService) {}

  create(createDocumentTopicDto: CreateDocumentTopicDto) {
    return this.prisma.documentTopic.create({
      data: createDocumentTopicDto,
    });
  }

  findAll() {
    return this.prisma.documentTopic.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const topic = await this.prisma.documentTopic.findUnique({
      where: { id },
    });
    if (!topic) {
      throw new NotFoundException(`Topic #${id} not found`);
    }
    return topic;
  }

  async update(id: string, updateDocumentTopicDto: UpdateDocumentTopicDto) {
    await this.findOne(id); // ensures it exists
    return this.prisma.documentTopic.update({
      where: { id },
      data: updateDocumentTopicDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // ensures it exists
    return this.prisma.documentTopic.delete({
      where: { id },
    });
  }
}
