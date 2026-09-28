import { Module } from "@nestjs/common";
import { AssistantProfilesService } from "./assistant-profiles.service";
import { AssistantProfilesController } from "./assistant-profiles.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AssistantProfilesController],
  providers: [AssistantProfilesService],
})
export class AssistantProfilesModule {}
