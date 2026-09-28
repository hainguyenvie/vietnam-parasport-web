import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.document.findMany({
      include: {
        topic: true,
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        topic: true,
        attachments: true,
      },
    });
    if (!document) {
      throw new NotFoundException(`Document with id ${id} not found`);
    }
    return document;
  }

  async findBySlug(slug: string) {
    const document = await this.prisma.document.findUnique({
      where: { slug },
      include: {
        topic: true,
        attachments: true,
      },
    });
    if (!document) {
      throw new NotFoundException(`Document with slug ${slug} not found`);
    }
    return document;
  }

  async create(data: CreateDocumentDto) {
    const { attachments, ...rest } = data;
    return this.prisma.document.create({
      data: {
        ...rest,
        attachments: attachments
          ? {
              create: attachments,
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });
  }

  async update(id: string, data: UpdateDocumentDto) {
    await this.findOne(id); // Ensure exists

    const { attachments, ...rest } = data;

    return this.prisma.$transaction(async (tx) => {
      // If attachments are provided, we delete old ones and create new ones
      if (attachments) {
        await tx.documentAttachment.deleteMany({
          where: { documentId: id },
        });
      }

      return tx.document.update({
        where: { id },
        data: {
          ...rest,
          attachments: attachments
            ? {
                create: attachments,
              }
            : undefined,
        },
        include: {
          topic: true,
          attachments: true,
        },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
