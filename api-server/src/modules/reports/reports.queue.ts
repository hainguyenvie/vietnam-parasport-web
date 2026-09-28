import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ReportProcessor } from "./reports.processor";
import { ReportsService } from "./reports.service";
import { PrismaModule } from "../../prisma/prisma.module";

import { REPORT_QUEUE } from "./reports.constants";

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: REPORT_QUEUE,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get("REDIS_HOST") || "localhost",
          port: parseInt(config.get("REDIS_PORT") || "6379", 10),
          password: config.get("REDIS_PASSWORD") || undefined,
        },
        defaultJobOptions: {
          attempts: 2,
          removeOnComplete: { age: 3600 }, // keep 1 hour
          removeOnFail: { age: 86400 }, // keep 1 day
        },
      }),
    }),
    PrismaModule,
  ],
  providers: [ReportsService, ReportProcessor],
  exports: [ReportsService],
})
export class ReportsQueueModule {}
