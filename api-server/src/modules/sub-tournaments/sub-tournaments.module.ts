import { Module } from "@nestjs/common";
import { SubTournamentsService } from "./sub-tournaments.service";
import { SubTournamentsController } from "./sub-tournaments.controller";
import { BracketEngineService } from "./bracket-engine.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SubTournamentsController],
  providers: [SubTournamentsService, BracketEngineService],
  exports: [SubTournamentsService, BracketEngineService],
})
export class SubTournamentsModule {}
