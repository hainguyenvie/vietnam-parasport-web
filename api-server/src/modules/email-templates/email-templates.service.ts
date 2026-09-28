import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import * as handlebars from "handlebars";

@Injectable()
export class EmailTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.emailTemplate.findMany({
      orderBy: { key: "asc" },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`Email template with ID "${id}" not found`);
    }
    return template;
  }

  async update(id: string, data: { subject?: string; content?: string }) {
    await this.findOne(id); // Throws if not found
    return this.prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }

  async preview(content: string, variables: any) {
    try {
      const template = handlebars.compile(content);
      const html = template(variables || {});
      return { html };
    } catch (error: any) {
      return {
        html: `<div style="color:red; font-family:sans-serif; padding:15px; border:1px solid red; background:#ffebeb;"><strong>Template Compilation Error:</strong><br/>${error.message}</div>`,
      };
    }
  }
}
