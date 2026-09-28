import { Module } from "@nestjs/common";
import { SportClassificationsService } from "./sport-classifications.service";
import { SportClassificationsController } from "./sport-classifications.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SportClassificationsController],
  providers: [SportClassificationsService],
})
export class SportClassificationsModule {}
