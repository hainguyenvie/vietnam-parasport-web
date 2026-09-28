import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

export const CACHE_TTL = {
  POSTS: 300_000, // 5 minutes
  POST_DETAIL: 600_000, // 10 minutes
  SPORTS: 3_600_000, // 1 hour
  SETTINGS: 3_600_000, // 1 hour
  STATS: 300_000, // 5 minutes
  LIVE_SCORE: 5_000, // 5 seconds
} as const;

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    const result = await this.cacheManager.get<T>(key);
    return result ?? undefined;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async wrap<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined && cached !== null) return cached;

    const result = await factory();
    await this.set(key, result, ttl);
    return result;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Redis keyv stores use namespace prefix; clear by pattern
    // For now, individual del calls are used for precise invalidation
    await this.cacheManager.del(pattern);
  }

  /** Cache key builders for consistency */
  static keys = {
    posts: (page: number, limit: number) => `posts:page:${page}:limit:${limit}`,
    postBySlug: (slug: string) => `posts:slug:${slug}`,
    sports: () => "sports:all",
    sportBySlug: (slug: string) => `sports:slug:${slug}`,
    settings: () => "settings:global",
    statsSummary: () => "stats:summary",
    liveScore: (matchId: string) => `live-score:${matchId}`,
    tournament: (id: string) => `tournament:${id}`,
  };
}
