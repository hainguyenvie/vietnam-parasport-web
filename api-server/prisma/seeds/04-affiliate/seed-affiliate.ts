import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as crypto from 'crypto';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function genShortCode(): string {
  return crypto.randomBytes(6).toString('base64url').substring(0, 8);
}
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
  console.log('=== Seed Affiliate: Links & Clicks ===\n');

  const athletes = await prisma.athleteProfile.findMany();
  const products = await prisma.product.findMany();

  if (athletes.length === 0) {
    console.error('No athletes found. Run main seed.ts first.');
    process.exit(1);
  }

  // ─── Affiliate Links ─────────────────────────────────────────────────
  console.log('1. Seeding Affiliate Links...');
  const platforms: Array<'SHOPEE' | 'TIKTOK' | 'LAZADA' | 'OTHER'> = [
    'SHOPEE',
    'TIKTOK',
    'LAZADA',
    'OTHER',
  ];
  const linkTemplates = [
    {
      platform: 'SHOPEE',
      title: 'Xe lăn thể thao gấp gọn - Shopee',
      originalUrl: 'https://shopee.vn/xe-lan-the-thao-gap-gon-i.123456.789012',
    },
    {
      platform: 'TIKTOK',
      title: 'Áo tập thể thao nam nữ thoáng khí - TikTok Shop',
      originalUrl: 'https://www.tiktok.com/@sportshop/video/123456',
    },
    {
      platform: 'LAZADA',
      title: 'Whey Protein tăng cơ giảm mỡ - Lazada',
      originalUrl:
        'https://www.lazada.vn/products/whey-protein-tang-co-i123456.html',
    },
    {
      platform: 'SHOPEE',
      title: 'Dây kháng lực tập gym đa năng - Shopee',
      originalUrl: 'https://shopee.vn/day-khang-luc-tap-gym-i.234567.890123',
    },
    {
      platform: 'TIKTOK',
      title: 'Bộ bóng Boccia tập luyện giá tốt - TikTok Shop',
      originalUrl: 'https://www.tiktok.com/@bocciashop/video/654321',
    },
    {
      platform: 'LAZADA',
      title: 'Đồng hồ Garmin chính hãng - Lazada',
      originalUrl:
        'https://www.lazada.vn/products/garmin-forerunner-i234567.html',
    },
    {
      platform: 'SHOPEE',
      title: 'Giày chạy bộ đế Boost chính hãng - Shopee',
      originalUrl: 'https://shopee.vn/giay-chay-bo-de-boost-i.345678.012345',
    },
    {
      platform: 'TIKTOK',
      title: 'Băng quấn cổ tay bảo vệ khớp - TikTok Shop',
      originalUrl: 'https://www.tiktok.com/@fitnessgear/video/789012',
    },
    {
      platform: 'LAZADA',
      title: 'Vitamin tổng hợp Multi-Sport - Lazada',
      originalUrl:
        'https://www.lazada.vn/products/vitamin-multi-sport-i345678.html',
    },
    {
      platform: 'SHOPEE',
      title: 'Tai nghe chống ồn thể thao - Shopee',
      originalUrl:
        'https://shopee.vn/tai-nghe-chong-on-the-thao-i.456789.123456',
    },
    {
      platform: 'TIKTOK',
      title: 'Máy massage cơ cầm tay - TikTok Shop',
      originalUrl: 'https://www.tiktok.com/@massageshop/video/890123',
    },
    {
      platform: 'LAZADA',
      title: 'Vòng đeo tay thông minh Mi Band - Lazada',
      originalUrl: 'https://www.lazada.vn/products/mi-band-8-i456789.html',
    },
    {
      platform: 'SHOPEE',
      title: 'Bộ tạ tay điều chỉnh thông minh - Shopee',
      originalUrl: 'https://shopee.vn/bo-ta-tay-dieu-chinh-i.567890.234567',
    },
    {
      platform: 'TIKTOK',
      title: 'BCAA phục hồi cơ bắp - TikTok Shop',
      originalUrl: 'https://www.tiktok.com/@supplementshop/video/901234',
    },
    {
      platform: 'LAZADA',
      title: 'Gel năng lượng thể thao - Lazada',
      originalUrl: 'https://www.lazada.vn/products/gel-nang-luong-i567890.html',
    },
    {
      platform: 'OTHER',
      title: 'Gối massage hồng ngoại cổ vai gáy',
      originalUrl: 'https://medishop.vn/goi-massage-hong-ngoai',
    },
  ];

  const createdLinks: any[] = [];
  for (let i = 0; i < Math.min(20, athletes.length); i++) {
    const athlete = athletes[i];
    const numLinks = randomInt(2, 3);
    for (let j = 0; j < numLinks; j++) {
      const template = linkTemplates[(i * 3 + j) % linkTemplates.length];
      const shortCode = genShortCode();
      const hasProduct = j === 0 && products.length > i;
      const commissionRate = randomFloat(3, 10);
      const clickCount = randomInt(0, 250);
      const conversionCount = randomInt(0, Math.floor(clickCount * 0.1));
      const totalEarnings = Math.round(
        conversionCount * randomFloat(50000, 500000),
      );

      try {
        const link = await prisma.affiliateLink.create({
          data: {
            athleteId: athlete.id,
            platform: template.platform as any,
            productId: hasProduct
              ? products[i % products.length].id
              : undefined,
            title: template.title,
            description: `${template.title} - Hỗ trợ VĐV khuyết tật Việt Nam`,
            originalUrl: template.originalUrl,
            affiliateCode: `ATH${String(i + 1).padStart(3, '0')}`,
            trackingUrl: `/go/${shortCode}`,
            shortCode,
            commissionRate,
            clickCount,
            conversionCount,
            totalEarnings,
            isActive: true,
          },
        });
        createdLinks.push(link);
      } catch {
        // Skip duplicate shortCode
      }
    }
  }
  console.log(`  Created ${createdLinks.length} affiliate links`);

  // ─── Affiliate Clicks ────────────────────────────────────────────────
  console.log('2. Seeding Affiliate Clicks...');
  const vietnamIPs = [
    '14.231.0.0',
    '113.185.0.0',
    '42.113.0.0',
    '171.236.0.0',
    '116.108.0.0',
    '118.70.0.0',
  ];
  const devices = [
    'mobile',
    'mobile',
    'mobile',
    'desktop',
    'desktop',
    'tablet',
  ];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  const oss = ['iOS', 'Android', 'Windows', 'macOS'];
  const utmSources = [
    'facebook',
    'tiktok',
    'zalo',
    'instagram',
    'google',
    'youtube',
  ];
  const utmMediums = ['social', 'cpc', 'organic', 'video'];

  let clickCount = 0;
  for (const link of createdLinks) {
    const numClicks = Math.min(randomInt(5, 30), link.clickCount || 0);
    for (let i = 0; i < numClicks; i++) {
      const isConverted = i < (link.conversionCount || 0);
      await prisma.affiliateClick.create({
        data: {
          linkId: link.id,
          ipAddress: `${randomItem(vietnamIPs)}.${randomInt(1, 254)}`,
          userAgent: `Mozilla/5.0 (${randomItem(oss)}; ${randomItem(browsers)}/${randomInt(80, 120)})`,
          referer: `${randomItem(utmSources)}.com/referral`,
          utmSource: randomItem(utmSources),
          utmMedium: randomItem(utmMediums),
          utmCampaign: `campaign_${randomInt(1, 5)}`,
          device: randomItem(devices),
          isConverted,
          convertedAt: isConverted ? daysAgo(randomInt(1, 60)) : null,
          createdAt: daysAgo(randomInt(1, 90)),
        },
      });
      clickCount++;
    }
  }
  console.log(`  Created ${clickCount} affiliate clicks`);
  console.log('\n=== Seed Affiliate COMPLETED ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
