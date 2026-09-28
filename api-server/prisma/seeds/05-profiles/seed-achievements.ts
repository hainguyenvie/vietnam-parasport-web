import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log(
    '=== Seed Enhanced Athlete Profiles: Achievements, Medals & Tournament Links ===\n',
  );

  const athletes = await prisma.athleteProfile.findMany();
  const sports = await prisma.sport.findMany();
  const tournaments = await prisma.tournament.findMany();
  const sportEvents = await prisma.sportEvent.findMany();

  if (athletes.length === 0 || sports.length === 0) {
    console.error('Missing base data. Run main seed.ts first.');
    process.exit(1);
  }

  const completedTournament = tournaments.find((t) => t.status === 'COMPLETED');
  const upcomingTournament = tournaments.find((t) => t.status === 'UPCOMING');

  // ─── Build result descriptions per sport ─────────────────────────────
  const achievementResults: Record<string, string[]> = {};
  for (const sport of sports) {
    const events = sportEvents.filter((e) => e.sportId === sport.id);
    achievementResults[sport.id] =
      events.length > 0
        ? events.map((e) => `${sport.nameVi} - ${e.name}`)
        : [`${sport.nameVi} - Đơn`, `${sport.nameVi} - Đồng đội`];
  }

  // ─── Athlete Achievements ────────────────────────────────────────────
  console.log('1. Seeding expanded Athlete Achievements...');
  const medalTypes = ['GOLD', 'SILVER', 'BRONZE'] as const;

  let achievementCount = 0;
  let medalCount = 0;

  for (const athlete of athletes) {
    if (!athlete.sportId) continue;
    const results = achievementResults[athlete.sportId] || [];
    if (results.length === 0) continue;

    const numAchievements = randomInt(1, 2);
    for (let j = 0; j < numAchievements; j++) {
      const medal = randomItem([...medalTypes, 'NONE']);
      const result = randomItem(results);

      const existing = await prisma.athleteAchievement.findFirst({
        where: { athleteId: athlete.id, result },
      });
      if (existing) continue;

      await prisma.athleteAchievement.create({
        data: {
          athleteId: athlete.id,
          tournamentId: completedTournament?.id,
          medal: medal === 'NONE' ? null : medal,
          result,
          isVerified: Math.random() > 0.2,
        },
      });
      achievementCount++;

      // Medal record (50% chance for medal-worthy achievements)
      if (medal !== 'NONE' && completedTournament && Math.random() > 0.5) {
        const medalExists = await prisma.medal.findFirst({
          where: {
            athleteId: athlete.id,
            tournamentId: completedTournament.id,
            type: medal,
          },
        });
        if (!medalExists) {
          await prisma.medal.create({
            data: {
              type: medal,
              year: 2026,
              athleteId: athlete.id,
              tournamentId: completedTournament.id,
            },
          });
          medalCount++;
        }
      }
    }
  }
  console.log(
    `  Created ${achievementCount} achievements, ${medalCount} new medals`,
  );

  // ─── Tournament-Athlete Connections ─────────────────────────────────
  console.log('2. Connecting athletes to tournaments...');
  let connectionCount = 0;

  for (const tournament of tournaments) {
    for (const athlete of athletes) {
      if (!athlete.sportId) continue;
      const isConnected = await prisma.tournament.findFirst({
        where: { id: tournament.id, athletes: { some: { id: athlete.id } } },
      });
      if (!isConnected && Math.random() > 0.4) {
        await prisma.tournament.update({
          where: { id: tournament.id },
          data: { athletes: { connect: { id: athlete.id } } },
        });
        connectionCount++;
      }
    }
  }
  console.log(`  Created ${connectionCount} athlete-tournament connections`);
  console.log('\n=== Seed Enhanced Profiles COMPLETED ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
