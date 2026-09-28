import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding expanded sport events for all 15 sports...');

  const sports = await prisma.sport.findMany();

  const sportMap: Record<string, (typeof sports)[0] | undefined> = {};
  for (const s of sports) {
    sportMap[s.slug] = s;
  }

  const eventConfigs: Record<
    string,
    {
      name: string;
      gender: 'MALE' | 'FEMALE' | 'MIXED';
      teamSize: number;
      unit: string;
    }[]
  > = {
    'bong-ban': [
      { name: 'Đơn nam', gender: 'MALE', teamSize: 1, unit: '' },
      { name: 'Đơn nữ', gender: 'FEMALE', teamSize: 1, unit: '' },
      { name: 'Đôi nam', gender: 'MALE', teamSize: 2, unit: '' },
      { name: 'Đôi nữ', gender: 'FEMALE', teamSize: 2, unit: '' },
      { name: 'Đồng đội nam', gender: 'MALE', teamSize: 3, unit: '' },
      { name: 'Đồng đội nữ', gender: 'FEMALE', teamSize: 3, unit: '' },
    ],
    'cau-long': [
      { name: 'Đơn nam', gender: 'MALE', teamSize: 1, unit: '' },
      { name: 'Đơn nữ', gender: 'FEMALE', teamSize: 1, unit: '' },
      { name: 'Đôi nam', gender: 'MALE', teamSize: 2, unit: '' },
      { name: 'Đôi nữ', gender: 'FEMALE', teamSize: 2, unit: '' },
      { name: 'Đôi nam nữ', gender: 'MIXED', teamSize: 2, unit: '' },
    ],
    'bong-ro-xe-lan': [
      { name: 'Đồng đội nam', gender: 'MALE', teamSize: 5, unit: '' },
      { name: 'Đồng đội nữ', gender: 'FEMALE', teamSize: 5, unit: '' },
    ],
    'quan-vot-xe-lan': [
      { name: 'Đơn nam', gender: 'MALE', teamSize: 1, unit: '' },
      { name: 'Đơn nữ', gender: 'FEMALE', teamSize: 1, unit: '' },
      { name: 'Đôi nam', gender: 'MALE', teamSize: 2, unit: '' },
      { name: 'Đôi nữ', gender: 'FEMALE', teamSize: 2, unit: '' },
    ],
    'co-vua': [
      { name: 'Cá nhân nam', gender: 'MALE', teamSize: 1, unit: '' },
      { name: 'Cá nhân nữ', gender: 'FEMALE', teamSize: 1, unit: '' },
      { name: 'Đồng đội', gender: 'MIXED', teamSize: 4, unit: '' },
    ],
    'co-tuong': [
      { name: 'Cá nhân nam', gender: 'MALE', teamSize: 1, unit: '' },
      { name: 'Cá nhân nữ', gender: 'FEMALE', teamSize: 1, unit: '' },
      { name: 'Đồng đội', gender: 'MIXED', teamSize: 2, unit: '' },
    ],
    'judo-khiem-thi': [
      { name: 'Nam -60kg', gender: 'MALE', teamSize: 1, unit: '' },
      { name: 'Nam -73kg', gender: 'MALE', teamSize: 1, unit: '' },
      { name: 'Nam -90kg', gender: 'MALE', teamSize: 1, unit: '' },
      { name: 'Nam +90kg', gender: 'MALE', teamSize: 1, unit: '' },
      { name: 'Nữ -57kg', gender: 'FEMALE', teamSize: 1, unit: '' },
      { name: 'Nữ -70kg', gender: 'FEMALE', teamSize: 1, unit: '' },
      { name: 'Nữ +70kg', gender: 'FEMALE', teamSize: 1, unit: '' },
    ],
    boccia: [
      { name: 'BC1 Đơn', gender: 'MIXED', teamSize: 1, unit: '' },
      { name: 'BC2 Đơn', gender: 'MIXED', teamSize: 1, unit: '' },
      { name: 'BC3 Đơn', gender: 'MIXED', teamSize: 1, unit: '' },
      { name: 'BC4 Đơn', gender: 'MIXED', teamSize: 1, unit: '' },
      { name: 'Đồng đội BC1/BC2', gender: 'MIXED', teamSize: 3, unit: '' },
    ],
    canoeing: [
      { name: 'KL1 200m Nam', gender: 'MALE', teamSize: 1, unit: 'giây' },
      { name: 'KL2 200m Nam', gender: 'MALE', teamSize: 1, unit: 'giây' },
      { name: 'KL3 200m Nam', gender: 'MALE', teamSize: 1, unit: 'giây' },
      { name: 'VL2 200m Nữ', gender: 'FEMALE', teamSize: 1, unit: 'giây' },
      { name: 'VL3 200m Nữ', gender: 'FEMALE', teamSize: 1, unit: 'giây' },
    ],
    rowing: [
      { name: 'PR1 Đơn nam', gender: 'MALE', teamSize: 1, unit: 'giây' },
      { name: 'PR1 Đơn nữ', gender: 'FEMALE', teamSize: 1, unit: 'giây' },
      { name: 'PR2 Đôi nam nữ', gender: 'MIXED', teamSize: 2, unit: 'giây' },
      { name: 'PR3 Bốn hỗn hợp', gender: 'MIXED', teamSize: 4, unit: 'giây' },
    ],
    'ban-sung': [
      {
        name: 'P1 10m súng ngắn hơi nam',
        gender: 'MALE',
        teamSize: 1,
        unit: 'điểm',
      },
      {
        name: 'P2 10m súng ngắn hơi nữ',
        gender: 'FEMALE',
        teamSize: 1,
        unit: 'điểm',
      },
      {
        name: 'R1 10m súng trường hơi đứng nam',
        gender: 'MALE',
        teamSize: 1,
        unit: 'điểm',
      },
      {
        name: 'R2 10m súng trường hơi đứng nữ',
        gender: 'FEMALE',
        teamSize: 1,
        unit: 'điểm',
      },
    ],
    '3-mon-phoi-hop': [
      { name: 'PT1 Nam', gender: 'MALE', teamSize: 1, unit: 'giây' },
      { name: 'PT2 Nam', gender: 'MALE', teamSize: 1, unit: 'giây' },
      { name: 'PT3 Nam', gender: 'MALE', teamSize: 1, unit: 'giây' },
      { name: 'PT4 Nam', gender: 'MALE', teamSize: 1, unit: 'giây' },
      { name: 'PT2 Nữ', gender: 'FEMALE', teamSize: 1, unit: 'giây' },
      { name: 'PT4 Nữ', gender: 'FEMALE', teamSize: 1, unit: 'giây' },
    ],
  };

  for (const [slug, events] of Object.entries(eventConfigs)) {
    const sport = sportMap[slug];
    if (!sport) {
      console.log(`  Sport not found for slug: ${slug}, skipping...`);
      continue;
    }

    for (const ev of events) {
      const existing = await prisma.sportEvent.findFirst({
        where: { sportId: sport.id, name: ev.name },
      });
      if (!existing) {
        await prisma.sportEvent.create({
          data: {
            sportId: sport.id,
            name: ev.name,
            gender: ev.gender,
            teamSize: ev.teamSize,
            unit: ev.unit,
          },
        });
      }
    }
    console.log(`  ${sport.nameVi}: ${events.length} events created`);
  }

  console.log('Expanded sport events seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
