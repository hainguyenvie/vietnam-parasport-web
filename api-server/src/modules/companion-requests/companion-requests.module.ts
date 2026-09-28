import { Module } from "@nestjs/common";
import { CompanionRequestsService } from "./companion-requests.service";
import { CompanionRequestsController } from "./companion-requests.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CompanionRequestsController],
  providers: [CompanionRequestsService],
  exports: [CompanionRequestsService],
})
export class CompanionRequestsModule {}
