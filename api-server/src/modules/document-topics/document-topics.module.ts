import { Module } from "@nestjs/common";
import { DocumentTopicsService } from "./document-topics.service";
import { DocumentTopicsController } from "./document-topics.controller";

import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DocumentTopicsController],
  providers: [DocumentTopicsService],
})
export class DocumentTopicsModule {}
