import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
  }

  async create(createRoleDto: any) {
    const { permissionIds, ...rest } = createRoleDto;
    return this.prisma.role.create({
      data: {
        ...rest,
        permissions: permissionIds
          ? {
              connect: permissionIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: { permissions: true },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: true,
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  async update(id: string, updateRoleDto: any) {
    await this.findOne(id);
    const { permissionIds, ...rest } = updateRoleDto;
    return this.prisma.role.update({
      where: { id },
      data: {
        ...rest,
        permissions: permissionIds
          ? {
              set: permissionIds.map((pid: string) => ({ id: pid })),
            }
          : undefined,
      },
      include: { permissions: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.role.delete({
      where: { id },
    });
  }
}
