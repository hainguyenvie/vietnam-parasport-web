import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const { members, ...teamData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: teamData,
      });

      if (members && Array.isArray(members) && members.length > 0) {
        const teamMembers = members.map((athleteId: string) => ({
          teamId: team.id,
          athleteId,
        }));
        await tx.teamMember.createMany({
          data: teamMembers,
          skipDuplicates: true,
        });
      }

      return tx.team.findUnique({
        where: { id: team.id },
        include: {
          members: {
            include: {
              athlete: {
                include: {
                  user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
                },
              },
            },
          },
          sport: true,
          organization: true,
        },
      });
    });

    return result;
  }

  async findAll(filters: { sportId?: string; tournamentId?: string; organizationId?: string }) {
    const where: any = {};
    if (filters.sportId) where.sportId = filters.sportId;
    if (filters.tournamentId) where.tournamentId = filters.tournamentId;
    if (filters.organizationId) where.organizationId = filters.organizationId;

    return this.prisma.team.findMany({
      where,
      include: {
        members: {
          include: {
            athlete: {
              include: {
                user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
              },
            },
          },
        },
        sport: true,
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            athlete: {
              include: {
                user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
              },
            },
          },
        },
        sport: true,
        organization: true,
      },
    });
    if (!team) throw new NotFoundException("Team not found");
    return team;
  }

  async update(id: string, data: any) {
    const { members, ...teamData } = data;

    await this.prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id },
        data: teamData,
      });

      if (members && Array.isArray(members)) {
        // Xoá member cũ và tạo lại
        await tx.teamMember.deleteMany({ where: { teamId: id } });
        const teamMembers = members.map((athleteId: string) => ({
          teamId: id,
          athleteId,
        }));
        await tx.teamMember.createMany({
          data: teamMembers,
          skipDuplicates: true,
        });
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    return this.prisma.team.delete({
      where: { id },
    });
  }
}
