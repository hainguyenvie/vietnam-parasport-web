import { Module } from "@nestjs/common";
import { AffiliateService } from "./affiliate.service";
import { AffiliateController, AffiliateGoController } from "./affiliate.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AffiliateController, AffiliateGoController],
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
