import { Module } from "@nestjs/common";
import { CapcutTemplatesService } from "./capcut-templates.service";
import { CapcutTemplatesController } from "./capcut-templates.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CapcutTemplatesController],
  providers: [CapcutTemplatesService],
})
export class CapcutTemplatesModule {}
