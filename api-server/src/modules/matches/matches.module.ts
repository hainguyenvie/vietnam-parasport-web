import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MatchesService } from "./matches.service";
import { MatchesController } from "./matches.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { LiveScoreGateway } from "./live-score.gateway";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "1h" },
    }),
  ],
  controllers: [MatchesController],
  providers: [MatchesService, LiveScoreGateway],
  exports: [MatchesService, LiveScoreGateway],
})
export class MatchesModule {}
