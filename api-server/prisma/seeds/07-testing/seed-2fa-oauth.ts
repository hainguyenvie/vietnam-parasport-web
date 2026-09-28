import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as crypto from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seed2FAAndOAuth() {
  console.log("🌱 Seeding 2FA + OAuth accounts...");

  // Enable 2FA for 3 users
  const users = await prisma.user.findMany({
    take: 3,
    where: { isTwoFactorEnabled: false },
    select: { id: true, email: true, fullName: true },
  });

  if (users.length > 0) {
    for (const user of users) {
      // Generate a dummy TOTP secret (not real, just for testing)
      const dummySecret = crypto.randomBytes(20).toString("base64");
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: dummySecret,
          isTwoFactorEnabled: true,
        },
      });
    }
    console.log(`  ✅ Enabled 2FA for ${users.length} users`);
  }

  // Create OAuth accounts for Google login
  const allUsers = await prisma.user.findMany({ take: 5, select: { id: true, email: true } });
  let oauthCreated = 0;

  for (const user of allUsers) {
    const existing = await prisma.account.findFirst({
      where: { userId: user.id, provider: "google" },
    });
    if (existing) continue;

    await prisma.account.create({
      data: {
        userId: user.id,
        provider: "google",
        providerAccountId: `google-${user.id.slice(0, 8)}`,
        // type, access_token etc. are optional in this schema
      },
    });
    oauthCreated++;
  }

  console.log(`  ✅ Created ${oauthCreated} OAuth (Google) accounts`);
}

if (require.main === module) {
  seed2FAAndOAuth()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
