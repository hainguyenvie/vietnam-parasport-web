import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedMatchEvents() {
  console.log("🌱 Seeding match events...");

  const matches = await prisma.match.findMany({
    take: 15,
    where: { status: { in: ["COMPLETED", "ONGOING"] } },
    select: { id: true, title: true, participants: true },
  });

  if (matches.length === 0) {
    console.log("  ⚠️ No matches found, skipping match events");
    return;
  }

  const eventTypes = ["SCORE", "SCORE", "SCORE", "HIGHLIGHT", "PENALTY", "SUBSTITUTION"];

  let created = 0;
  for (const match of matches) {
    const numEvents = 2 + Math.floor(Math.random() * 4); // 2-5 events per match
    const participants = (match.participants as any[]) || [];

    for (let i = 0; i < numEvents; i++) {
      const minute = `${5 + Math.floor(Math.random() * 85)}'`;
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const athlete =
        participants.length > 0
          ? participants[Math.floor(Math.random() * participants.length)]
          : null;

      let description = "";
      switch (type) {
        case "SCORE":
          description = athlete ? `${athlete.name || "VĐV"} ghi điểm` : "Ghi điểm";
          break;
        case "PENALTY":
          description = athlete ? `${athlete.name || "VĐV"} bị phạt` : "Phạm lỗi";
          break;
        case "SUBSTITUTION":
          description = "Thay người";
          break;
        case "HIGHLIGHT":
          description = athlete ? `${athlete.name || "VĐV"} có pha xử lý xuất sắc` : "Pha bóng đẹp";
          break;
      }

      await prisma.matchEvent.create({
        data: {
          matchId: match.id,
          minute,
          type,
          description,
          teamOrAthlete: athlete?.name || null,
        },
      });
      created++;
    }
  }

  console.log(`  ✅ Created ${created} match events across ${matches.length} matches`);
}

if (require.main === module) {
  seedMatchEvents()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
