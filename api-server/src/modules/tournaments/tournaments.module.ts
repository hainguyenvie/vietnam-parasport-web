import { Module } from "@nestjs/common";
import { TournamentsService } from "./tournaments.service";
import { TournamentsController } from "./tournaments.controller";
import { TournamentGeneratorService } from "./tournaments.generator.service";

import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentGeneratorService],
})
export class TournamentsModule {}
