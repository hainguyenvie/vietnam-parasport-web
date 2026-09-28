import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { sport?: string; location?: string }) {
    const where: any = { isApproved: true };

    if (filters.sport) {
      where.sport = { contains: filters.sport, mode: "insensitive" };
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }

    return this.prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async findBounded(minLat: number, maxLat: number, minLng: number, maxLng: number) {
    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng)) {
      return [];
    }

    return this.prisma.organization.findMany({
      where: {
        isApproved: true,
        lat: {
          gte: minLat,
          lte: maxLat,
        },
        lng: {
          gte: minLng,
          lte: maxLng,
        },
      },
    });
  }

  async findPending() {
    return this.prisma.organization.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    name: string;
    location: string;
    sport: string;
    schedule: string;
    suitableFor: string;
    contactInfo: string;
    imageUrl?: string;
    description: string;
  }) {
    return this.prisma.organization.create({
      data: {
        ...data,
        isApproved: false, // Yêu cầu admin phê duyệt
      },
    });
  }

  async createAdmin(data: {
    name: string;
    location: string;
    sport: string;
    schedule: string;
    suitableFor: string;
    contactInfo: string;
    imageUrl?: string;
    description: string;
  }) {
    return this.prisma.organization.create({
      data: {
        ...data,
        isApproved: true,
      },
    });
  }

  async approve(id: string) {
    return this.prisma.organization.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async findAllAdmin() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.organization.delete({
      where: { id },
    });
  }
}
