import { Injectable } from "@nestjs/common";
import { CreateSportClassificationDto } from "./dto/create-sport-classification.dto";
import { UpdateSportClassificationDto } from "./dto/update-sport-classification.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SportClassificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createSportClassificationDto: CreateSportClassificationDto) {
    return this.prisma.sportClassification.create({
      data: createSportClassificationDto,
    });
  }

  findAll(sportId?: string) {
    const where: any = {};
    if (sportId) {
      const ids = sportId.split(",").filter(Boolean);
      where.sportId = ids.length === 1 ? ids[0] : { in: ids };
    }
    return this.prisma.sportClassification.findMany({
      where,
      include: { sport: true },
    });
  }

  findOne(id: string) {
    return this.prisma.sportClassification.findUnique({
      where: { id },
      include: { sport: true },
    });
  }

  update(id: string, updateSportClassificationDto: UpdateSportClassificationDto) {
    return this.prisma.sportClassification.update({
      where: { id },
      data: updateSportClassificationDto,
    });
  }

  remove(id: string) {
    return this.prisma.sportClassification.delete({ where: { id } });
  }
}
