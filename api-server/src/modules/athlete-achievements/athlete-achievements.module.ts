import { Module } from "@nestjs/common";
import { AthleteAchievementsService } from "./athlete-achievements.service";
import { AthleteAchievementsController } from "./athlete-achievements.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AthleteAchievementsController],
  providers: [AthleteAchievementsService],
})
export class AthleteAchievementsModule {}
