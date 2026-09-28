import { Module, Global } from "@nestjs/common";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { createKeyv } from "@keyv/redis";
import { CacheService } from "./cache.service";

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisHost = config.get("REDIS_HOST") || "localhost";
        const redisPort = parseInt(config.get("REDIS_PORT") || "6379", 10);
        const redisPassword = config.get("REDIS_PASSWORD");
        let redisUrl = `redis://${redisHost}:${redisPort}`;
        if (redisPassword) {
          redisUrl = `redis://default:${encodeURIComponent(redisPassword)}@${redisHost}:${redisPort}`;
        }

        return {
          stores: [createKeyv(redisUrl, { namespace: "vnp" })],
          ttl: 300_000, // default 5 minutes (in ms)
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [NestCacheModule, CacheService],
})
export class GlobalCacheModule {}
