import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSubTournamentDto } from "./dto/create-sub-tournament.dto";
import { UpdateSubTournamentDto } from "./dto/update-sub-tournament.dto";

@Injectable()
export class SubTournamentsService {
  constructor(private prisma: PrismaService) {}

  async create(createSubTournamentDto: CreateSubTournamentDto) {
    return this.prisma.subTournament.create({
      data: createSubTournamentDto,
    });
  }

  async findAll() {
    return this.prisma.subTournament.findMany({
      include: {
        tournament: true,
        sport: true,
        classification: true,
      },
    });
  }

  async findOne(id: string) {
    const subTournament = await this.prisma.subTournament.findUnique({
      where: { id },
      include: {
        tournament: true,
        sport: true,
        classification: true,
        matches: true,
      },
    });

    if (!subTournament) {
      throw new NotFoundException(`SubTournament with ID ${id} not found`);
    }
    return subTournament;
  }

  async update(id: string, updateSubTournamentDto: UpdateSubTournamentDto) {
    const exists = await this.prisma.subTournament.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`SubTournament with ID ${id} not found`);
    }

    return this.prisma.subTournament.update({
      where: { id },
      data: updateSubTournamentDto,
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.subTournament.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`SubTournament with ID ${id} not found`);
    }

    return this.prisma.subTournament.delete({
      where: { id },
    });
  }
}
