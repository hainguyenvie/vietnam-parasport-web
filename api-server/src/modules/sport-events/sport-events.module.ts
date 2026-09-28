import { Module } from "@nestjs/common";
import { SportEventsService } from "./sport-events.service";
import { SportEventsController } from "./sport-events.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SportEventsController],
  providers: [SportEventsService],
})
export class SportEventsModule {}
