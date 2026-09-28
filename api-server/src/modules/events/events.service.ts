import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: any) {
    const slug = createEventDto.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    return this.prisma.event.create({
      data: {
        ...createEventDto,
        slug,
      },
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      orderBy: { startDate: "asc" },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  async update(id: string, updateEventDto: any) {
    await this.findOne(id);
    return this.prisma.event.update({
      where: { id },
      data: updateEventDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.event.delete({
      where: { id },
    });
  }
}
