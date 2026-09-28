import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding events and classifications...');

  // Get sports by finding them by name or slug
  const sports = await prisma.sport.findMany();

  const athletics = sports.find(
    (s) =>
      s.nameVi.toLowerCase().includes('điền kinh') || s.slug === 'dien-kinh',
  );
  const weightlifting = sports.find(
    (s) => s.nameVi.toLowerCase().includes('cử tạ') || s.slug === 'cu-ta',
  );
  const swimming = sports.find(
    (s) => s.nameVi.toLowerCase().includes('bơi') || s.slug === 'boi-loi',
  );

  if (athletics) {
    console.log(`Found Athletics: ${athletics.id}`);

    // Seed Athletics Events (classifications handled by main seed.ts)
    const runEvents = [
      '100m',
      '200m',
      '400m',
      '800m',
      '1500m',
      '5000m',
      'Marathon',
      'Tiếp sức',
    ];
    for (const name of runEvents) {
      await prisma.sportEvent.create({
        data: {
          sportId: athletics.id,
          name: `Chạy ${name}`,
          gender: 'MIXED',
          teamSize: name === 'Tiếp sức' ? 4 : 1,
          unit: 'giây',
        },
      });
    }
    const jumpEvents = ['Nhảy xa', 'Nhảy cao', 'Nhảy ba bước'];
    for (const name of jumpEvents) {
      await prisma.sportEvent.create({
        data: {
          sportId: athletics.id,
          name,
          gender: 'MIXED',
          teamSize: 1,
          unit: 'mét',
        },
      });
    }
    const throwEvents = ['Đẩy tạ', 'Ném lao', 'Ném đĩa'];
    for (const name of throwEvents) {
      await prisma.sportEvent.create({
        data: {
          sportId: athletics.id,
          name: `${name} đứng`,
          gender: 'MIXED',
          teamSize: 1,
          unit: 'mét',
        },
      });
      await prisma.sportEvent.create({
        data: {
          sportId: athletics.id,
          name: `${name} ngồi`,
          gender: 'MIXED',
          teamSize: 1,
          unit: 'mét',
        },
      });
    }
  }

  if (weightlifting) {
    console.log(`Found Weightlifting: ${weightlifting.id}`);

    const weightliftingClasses = ['N/A']; // Weightlifting uses weight categories as events instead of classifications sometimes, but standard is just PR or similar. Let's add a general one.
    for (const code of weightliftingClasses) {
      const existing = await prisma.sportClassification.findFirst({
        where: { sportId: weightlifting.id, code },
      });
      if (!existing) {
        await prisma.sportClassification.create({
          data: {
            sportId: weightlifting.id,
            code,
            description: `Hạng thương tật chung`,
          },
        });
      }
    }

    const maleWeights = [
      '49kg',
      '54kg',
      '59kg',
      '65kg',
      '72kg',
      '80kg',
      '88kg',
      '97kg',
      '107kg',
      'Trên 107kg',
    ];
    for (const name of maleWeights) {
      await prisma.sportEvent.create({
        data: {
          sportId: weightlifting.id,
          name: `Đẩy tạ ${name}`,
          gender: 'MALE',
          teamSize: 1,
          unit: 'kg',
        },
      });
    }

    const femaleWeights = [
      '41kg',
      '45kg',
      '50kg',
      '55kg',
      '61kg',
      '67kg',
      '73kg',
      '79kg',
      '86kg',
      'Trên 86kg',
    ];
    for (const name of femaleWeights) {
      await prisma.sportEvent.create({
        data: {
          sportId: weightlifting.id,
          name: `Đẩy tạ ${name}`,
          gender: 'FEMALE',
          teamSize: 1,
          unit: 'kg',
        },
      });
    }
  }

  if (swimming) {
    console.log(`Found Swimming: ${swimming.id}`);

    // Seed Swimming Events (classifications handled by main seed.ts)
    const swimFree = ['50m', '100m', '200m', '400m'];
    for (const dist of swimFree) {
      await prisma.sportEvent.create({
        data: {
          sportId: swimming.id,
          name: `Bơi tự do ${dist}`,
          gender: 'MIXED',
          teamSize: 1,
          unit: 'giây',
        },
      });
    }
    const swimBack = ['50m', '100m'];
    for (const dist of swimBack) {
      await prisma.sportEvent.create({
        data: {
          sportId: swimming.id,
          name: `Bơi ngửa ${dist}`,
          gender: 'MIXED',
          teamSize: 1,
          unit: 'giây',
        },
      });
    }
    const swimFly = ['50m', '100m'];
    for (const dist of swimFly) {
      await prisma.sportEvent.create({
        data: {
          sportId: swimming.id,
          name: `Bơi bướm ${dist}`,
          gender: 'MIXED',
          teamSize: 1,
          unit: 'giây',
        },
      });
    }
    const swimBreast = ['50m', '100m'];
    for (const dist of swimBreast) {
      await prisma.sportEvent.create({
        data: {
          sportId: swimming.id,
          name: `Bơi ếch ${dist}`,
          gender: 'MIXED',
          teamSize: 1,
          unit: 'giây',
        },
      });
    }
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
