import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService, CACHE_TTL } from "../../common/cache/cache.service";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  async setLogo(path: string) {
    const result = await this.prisma.systemSetting.upsert({
      where: { key: "logoPath" },
      update: { value: path },
      create: { key: "logoPath", value: path },
    });
    await this.cache.del(CacheService.keys.settings());
    return result;
  }

  async setFavicon(path: string) {
    const result = await this.prisma.systemSetting.upsert({
      where: { key: "faviconPath" },
      update: { value: path },
      create: { key: "faviconPath", value: path },
    });
    await this.cache.del(CacheService.keys.settings());
    return result;
  }

  async setSetting(key: string, value: any) {
    const result = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    await this.cache.del(CacheService.keys.settings());
    return result;
  }

  async getSettings() {
    return this.cache.wrap(
      CacheService.keys.settings(),
      async () => {
        const settings = await this.prisma.systemSetting.findMany();
        return settings.reduce(
          (acc, cur) => {
            acc[cur.key] = cur.value;
            return acc;
          },
          {} as Record<string, any>
        );
      },
      CACHE_TTL.SETTINGS
    );
  }
}
