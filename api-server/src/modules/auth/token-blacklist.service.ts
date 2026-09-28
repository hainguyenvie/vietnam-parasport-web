import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TokenBlacklistService {
  constructor(private readonly prisma: PrismaService) {}

  async blacklist(jti: string, expiresAt: Date): Promise<void> {
    await this.prisma.tokenBlacklist.create({
      data: { jti, expiresAt },
    });
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    // Clean expired entries opportunistically
    await this.prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const entry = await this.prisma.tokenBlacklist.findUnique({
      where: { jti },
    });
    return entry !== null;
  }
}
