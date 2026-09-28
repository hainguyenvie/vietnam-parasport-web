import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Seeding Website Info: Footer, Hero, Header, Partners, Social ===");

  // ──────────────────────────────────────────────
  // 1. SystemSettings
  // ──────────────────────────────────────────────
  const settings: { key: string; value: any }[] = [
    {
      key: "FOOTER_CONTENT",
      value: {
        aboutVi:
          "Vietnam ParaSports là nền tảng thể thao toàn diện dành cho cộng đồng người khuyết tật Việt Nam. Chúng tôi kết nối vận động viên, huấn luyện viên, câu lạc bộ và nhà tài trợ trên một nền tảng duy nhất.",
        aboutEn:
          "Vietnam ParaSports is a comprehensive sports platform for the Vietnamese disabled community. We connect athletes, coaches, clubs, and sponsors on a single platform.",
        addressVi: "Số 36 Trần Phú, Quận Ba Đình, Hà Nội, Việt Nam",
        addressEn: "36 Tran Phu Street, Ba Dinh District, Hanoi, Vietnam",
        phone: "1900 1234",
        email: "contact@paralympic.vn",
      },
    },
    {
      key: "HERO_CONTENT",
      value: {
        titleVi: "Cùng thể thao, cùng tỏa sáng",
        titleEn: "Vietnam Para Sports",
        descVi:
          "Cập nhật thành tích, hành trình tập luyện và những câu chuyện truyền cảm hứng của cộng đồng thể thao người khuyết tật Việt Nam.",
        descEn:
          "Connect passion, overcome limits. A comprehensive sports platform for the Vietnamese disabled community.",
      },
    },
    {
      key: "HERO_CAROUSEL",
      value: [
        {
          url: "/assets/homepage/creator-lab-launch.jpg",
          title: "Vietnam ParaSports Creator Lab — Lan tỏa dấu ấn cá nhân trên nền tảng số",
          link: "/creator-lab",
        },
        {
          url: "/assets/homepage/creator-lab-summit.jpg",
          title: "Vietnam ParaSports Creator Lab Summit 2026",
          link: "/creator-lab",
        },
        {
          url: "/uploads/1781644852147-pcy2n1.jpg",
          title: "Niềm vui chiến thắng của đoàn thể thao người khuyết tật Việt Nam",
          link: "/news",
        },
        {
          url: "/uploads/1781644855465-frmous.jpg",
          title: "Thể thao Việt Nam lan tỏa tinh thần đoàn kết",
          link: "/news",
        },
        {
          url: "/uploads/1781644859054-tpt9zs.jpg",
          title: "Cộng đồng ParaSports cùng vượt qua giới hạn",
          link: "/clubs",
        },
      ],
    },
    { key: "HERO_BANNER_SIZE", value: "large" },
    { key: "HERO_IMAGE_FIT", value: "cover" },
    { key: "HERO_SHOW_CONTENT", value: true },
    { key: "SHOW_PARTNERS", value: true },
    { key: "siteTitle", value: "Vietnam ParaSports" },
    { key: "HEADER_COLOR", value: "#bf0413" },
    { key: "HEADER_TEXT_COLOR", value: "#ffffff" },
    { key: "FOOTER_COLOR", value: "#8f0010" },
    { key: "FOOTER_TEXT_COLOR", value: "#ffffff" },
    {
      key: "HEADER_MENU_ORDER",
      value: [
        "home",
        "news",
        "sports",
        "tournaments",
        "matches",
        "rankings",
        "creator-lab",
        "clubs",
        "marketplace",
        "companion",
      ],
    },
    {
      key: "HEADER_MENU_VISIBILITY",
      value: {
        home: true,
        news: true,
        sports: true,
        tournaments: true,
        matches: true,
        rankings: true,
        "creator-lab": true,
        clubs: true,
        marketplace: true,
        companion: true,
      },
    },
    {
      key: "ADMIN_SIDEBAR_ORDER",
      value: [
        "/admin",
        "/admin/users",
        "/admin/posts",
        "/admin/creator-lab",
        "/admin/organizations",
        "/admin/teams",
        "/admin/companion",
        "/admin/partners",
        "/admin/sports",
        "/admin/disability-classes",
        "/admin/tournaments",
        "/admin/events",
        "/admin/audit-logs",
        "/admin/email-templates",
        "/admin/commissions",
        "/admin/affiliates",
        "/admin/assistants",
        "/admin/marketplace",
        "/admin/settings",
      ],
    },
    {
      key: "ADMIN_SIDEBAR_VISIBILITY",
      value: {
        "/admin": true,
        "/admin/users": true,
        "/admin/posts": true,
        "/admin/creator-lab": true,
        "/admin/organizations": true,
        "/admin/teams": true,
        "/admin/companion": true,
        "/admin/partners": true,
        "/admin/sports": true,
        "/admin/disability-classes": true,
        "/admin/tournaments": true,
        "/admin/events": true,
        "/admin/audit-logs": true,
        "/admin/email-templates": true,
        "/admin/commissions": true,
        "/admin/affiliates": true,
        "/admin/assistants": true,
        "/admin/marketplace": true,
        "/admin/settings": true,
      },
    },
    // Logo and favicon are set via admin panel uploads (Settings > Brand).
    // They are stored in uploads/settings/ and served from /api/v1/uploads/settings/.
    // { key: "logoPath", value: "/logos/vnparasports-logo.svg" },
    // { key: "faviconPath", value: "/favicon.ico" },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  console.log(`  ${settings.length} system settings seeded`);

  // ──────────────────────────────────────────────
  // 2. Partners — add websites where missing
  // ──────────────────────────────────────────────
  const partnerWebsites: Record<string, string> = {
    "Tập đoàn Vingroup": "https://vingroup.net",
    "Tập đoàn Viettel": "https://viettel.com.vn",
    Vinamilk: "https://vinamilk.com.vn",
    Vietcombank: "https://vietcombank.com.vn",
    "Decathlon Vietnam": "https://decathlon.vn",
    "Herbalife Vietnam": "https://herbalife.com.vn",
    "Unilever Vietnam": "https://unilever.com.vn",
    "Honda Vietnam": "https://honda.com.vn",
    "Masan Group": "https://masan.vn",
    "FPT Corporation": "https://fpt.com.vn",
  };

  for (const [name, website] of Object.entries(partnerWebsites)) {
    const existing = await prisma.partner.findFirst({ where: { name } });
    if (existing && !existing.website) {
      await prisma.partner.update({ where: { id: existing.id }, data: { website } });
    }
  }
  console.log("  Partner websites updated");

  // ──────────────────────────────────────────────
  // 3. SocialLinks — add email + website
  // ──────────────────────────────────────────────
  const extraLinks = [
    { name: "Email", url: "mailto:contact@paralympic.vn", icon: "mail", order: 6 },
    { name: "Website", url: "https://vietnamparasports.com", icon: "globe", order: 7 },
  ];

  for (const link of extraLinks) {
    const existing = await prisma.socialLink.findFirst({ where: { name: link.name } });
    if (!existing) {
      await prisma.socialLink.create({ data: link });
    }
  }
  console.log("  Social links updated");

  console.log("=== Website Info Seed Complete ===\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
