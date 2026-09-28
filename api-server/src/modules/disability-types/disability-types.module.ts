import { Module } from "@nestjs/common";
import { DisabilityTypesController } from "./disability-types.controller";
import { DisabilityTypesService } from "./disability-types.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DisabilityTypesController],
  providers: [DisabilityTypesService],
})
export class DisabilityTypesModule {}
