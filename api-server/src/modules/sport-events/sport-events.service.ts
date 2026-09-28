import { Injectable } from "@nestjs/common";
import { CreateSportEventDto } from "./dto/create-sport-event.dto";
import { UpdateSportEventDto } from "./dto/update-sport-event.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SportEventsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createSportEventDto: CreateSportEventDto) {
    return this.prisma.sportEvent.create({
      data: createSportEventDto,
    });
  }

  findAll(sportId?: string) {
    if (sportId) {
      return this.prisma.sportEvent.findMany({ where: { sportId } });
    }
    return this.prisma.sportEvent.findMany();
  }

  findOne(id: string) {
    return this.prisma.sportEvent.findUnique({ where: { id } });
  }

  update(id: string, updateSportEventDto: UpdateSportEventDto) {
    return this.prisma.sportEvent.update({
      where: { id },
      data: updateSportEventDto,
    });
  }

  remove(id: string) {
    return this.prisma.sportEvent.delete({ where: { id } });
  }
}
