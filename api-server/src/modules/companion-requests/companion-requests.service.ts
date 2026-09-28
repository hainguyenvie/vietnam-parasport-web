import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CompanionRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    fullName: string;
    unit?: string;
    phone?: string;
    email: string;
    type: string;
    message: string;
  }) {
    return this.prisma.companionRequest.create({
      data: {
        ...data,
        isRead: false,
      },
    });
  }

  async findAll(query?: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.max(1, Math.min(100, query?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.search) {
      const s = query.search.toLowerCase();
      where.OR = [
        { fullName: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
        { unit: { contains: s, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.companionRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.companionRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async markRead(id: string) {
    return this.prisma.companionRequest.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async delete(id: string) {
    return this.prisma.companionRequest.delete({
      where: { id },
    });
  }
}
