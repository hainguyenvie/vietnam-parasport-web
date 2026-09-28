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
function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randomInt(0, 23), randomInt(0, 59));
  return d;
}

async function main() {
  console.log('=== Seed Commissions & Payouts ===\n');

  const athletes = await prisma.athleteProfile.findMany();
  const links = await prisma.affiliateLink.findMany();

  if (athletes.length === 0) {
    console.error('No athletes found. Run main seed.ts first.');
    process.exit(1);
  }

  const platforms: Array<'SHOPEE' | 'TIKTOK' | 'LAZADA' | 'OTHER'> = [
    'SHOPEE',
    'TIKTOK',
    'LAZADA',
    'OTHER',
  ];

  // ─── Commissions ─────────────────────────────────────────────────────
  console.log('1. Seeding Commissions...');
  const statusWeight = [
    'PENDING',
    'PENDING',
    'CONFIRMED',
    'APPROVED',
    'APPROVED',
    'APPROVED',
    'REJECTED',
    'PAID',
    'PAID',
  ];
  const commissionReasons = [
    null,
    null,
    null,
    'Đơn hàng bị hủy - khách đổi ý',
    'Không đủ điều kiện hoa hồng - sản phẩm hoàn trả',
    'Tài khoản nhận sai, cần cập nhật thông tin ngân hàng',
  ];

  const createdCommissions: any[] = [];
  for (let i = 0; i < Math.min(15, athletes.length); i++) {
    const athlete = athletes[i];
    const athleteLinks = links.filter((l) => l.athleteId === athlete.id);
    const numCommissions = randomInt(1, 3);

    for (let j = 0; j < numCommissions; j++) {
      const status = randomItem(statusWeight);
      const orderAmount = randomInt(200000, 5000000);
      const rate = randomFloat(3, 10);
      const commissionAmount = parseFloat(
        (orderAmount * (rate / 100)).toFixed(0),
      );
      const notes =
        status === 'REJECTED'
          ? randomItem(commissionReasons.filter(Boolean))
          : null;
      const isApproved = status === 'APPROVED' || status === 'PAID';

      const comm = await prisma.commission.create({
        data: {
          athleteId: athlete.id,
          linkId:
            athleteLinks.length > 0 ? randomItem(athleteLinks).id : undefined,
          platform: randomItem(platforms),
          orderId: `ORD-${randomInt(10000, 99999)}`,
          orderAmount,
          commissionRate: rate,
          commissionAmount,
          status: status as any,
          notes: notes,
          approvedAt: isApproved ? daysAgo(randomInt(5, 30)) : null,
          createdAt: daysAgo(randomInt(5, 60)),
        },
      });
      createdCommissions.push(comm);
    }
  }
  console.log(`  Created ${createdCommissions.length} commissions`);

  // ─── Payouts ─────────────────────────────────────────────────────────
  console.log('2. Seeding Payouts...');
  const payoutMethods: Array<'BANK' | 'MOMO' | 'ZALOPAY'> = [
    'BANK',
    'MOMO',
    'ZALOPAY',
  ];
  const payoutInfos = [
    {
      bankName: 'Vietcombank',
      accountNumber: '0123456789',
      accountName: 'Nguyen Van A',
    },
    {
      bankName: 'Techcombank',
      accountNumber: '19034567890123',
      accountName: 'Tran Thi B',
    },
    { phoneNumber: '0912345678' },
    { phoneNumber: '0987654321' },
    {
      bankName: 'BIDV',
      accountNumber: '4510123456789',
      accountName: 'Le Van C',
    },
  ];
  const payoutStatuses = [
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'COMPLETED',
    'COMPLETED',
  ];

  let payoutCount = 0;
  const usedAthletes = new Set<string>();

  for (let i = 0; i < Math.min(6, athletes.length); i++) {
    const athlete = athletes[i];
    if (usedAthletes.has(athlete.id)) continue;

    const athleteCommissions = createdCommissions.filter(
      (c) => c.athleteId === athlete.id && c.status === 'APPROVED',
    );
    if (athleteCommissions.length === 0) continue;

    usedAthletes.add(athlete.id);
    const totalAmount = athleteCommissions.reduce(
      (sum: number, c: any) => sum + c.commissionAmount,
      0,
    );
    const payoutStatus = randomItem(payoutStatuses);
    const isCompleted = payoutStatus === 'COMPLETED';
    const method = randomItem(payoutMethods);
    const info = payoutInfos[i % payoutInfos.length];

    const payout = await prisma.payout.create({
      data: {
        athleteId: athlete.id,
        amount: Math.min(
          totalAmount > 0 ? totalAmount : 500000,
          randomInt(200000, 2000000),
        ),
        status: payoutStatus as any,
        paymentMethod: method,
        paymentInfo: info as any,
        referenceId: isCompleted
          ? `TXN-${Date.now()}-${randomInt(1000, 9999)}`
          : null,
        processedAt: isCompleted ? daysAgo(randomInt(1, 10)) : null,
        createdAt: daysAgo(randomInt(10, 45)),
      },
    });

    // Link commissions to this payout
    let remainingAmount = payout.amount;
    for (const comm of athleteCommissions) {
      if (remainingAmount <= 0) break;
      await prisma.commission.update({
        where: { id: comm.id },
        data: {
          payoutId: payout.id,
          status: (isCompleted ? 'PAID' : 'APPROVED') as any,
        },
      });
      remainingAmount -= comm.commissionAmount;
    }
    payoutCount++;
  }
  console.log(`  Created ${payoutCount} payouts`);
  console.log('\n=== Seed Commissions & Payouts COMPLETED ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
