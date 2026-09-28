import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - randomInt(0, 23));
  d.setMinutes(randomInt(0, 59));
  return d;
}

const VIETNAM_IPS = [
  "14.160.0.1",
  "14.161.0.1",
  "14.162.0.1",
  "27.0.0.1",
  "27.2.0.1",
  "42.112.0.1",
  "58.186.0.1",
  "58.187.0.1",
  "113.160.0.1",
  "113.161.0.1",
  "115.72.0.1",
  "115.73.0.1",
  "116.96.0.1",
  "116.97.0.1",
  "117.0.0.1",
  "118.68.0.1",
  "118.69.0.1",
  "123.16.0.1",
  "123.17.0.1",
  "171.224.0.1",
];

const DEVICES = ["mobile", "desktop", "tablet", "mobile", "mobile", "desktop"];
const UTM_SOURCES = ["google", "facebook", "tiktok", "youtube", "zalo"];
const UTM_MEDIUMS = ["cpc", "social", "email", "referral", "organic"];
const UTM_CAMPAIGNS = [
  "tet-sale",
  "summer-deal",
  "flash-sale",
  "new-year",
  "payday",
  "super-sale",
  "brand-day",
  "mega-sale",
];

const PLATFORMS: Array<"SHOPEE" | "TIKTOK" | "LAZADA"> = ["SHOPEE", "TIKTOK", "LAZADA"];

const COMMENT_TEXTS = [
  "Chúc mừng anh chị! Thành tích thật tuyệt vời.",
  "Cố lên! Ủng hộ tinh thần các vận động viên Việt Nam.",
  "Rất tự hào về các vận động viên khuyết tật Việt Nam.",
  "Bài viết rất ý nghĩa, cảm ơn đã chia sẻ.",
  "Ngưỡng mộ nghị lực của các anh chị.",
  "Tinh thần thể thao thật đáng khâm phục.",
  "Cảm ơn những nỗ lực phi thường của các vận động viên.",
  "Chúc các vận động viên luôn mạnh khỏe và thành công.",
  "Rất xúc động khi đọc bài viết này.",
  "Hy vọng sẽ có nhiều hỗ trợ hơn cho thể thao người khuyết tật.",
  "Luôn ủng hộ và theo dõi hành trình của các bạn.",
  "Thành tích này là niềm tự hào của cả nước.",
  "Chúc may mắn cho giải đấu sắp tới!",
  "Những tấm gương vượt khó thật đáng học hỏi.",
  "Cảm ơn vì đã truyền cảm hứng cho cộng đồng.",
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

export default async function seed(prisma: PrismaClient) {
  console.log("\n=== PHASE 6: REALISTIC INTERCONNECTED DATA ===\n");

  const passwordHash = await bcrypt.hash("password123", 10);

  // =========================================================================
  // PHASE 1: FOUNDATION — gather references to existing data
  // =========================================================================
  console.log("--- Phase 1: Fetching references ---");

  // Sports
  const sportRefs: Record<string, any> = {};
  const sportNames = [
    "Cử tạ",
    "Điền kinh",
    "Bơi lội",
    "Bóng bàn",
    "Bắn cung",
    "Cầu lông",
    "Cờ vua",
    "Bóng rổ xe lăn",
    "Quần vợt xe lăn",
  ];
  for (const name of sportNames) {
    let s = await prisma.sport.findFirst({ where: { nameVi: name } });
    if (!s) {
      // Create missing sports (Bắn cung may not exist)
      const slugMap: Record<string, string> = {
        "Cử tạ": "cu-ta",
        "Điền kinh": "dien-kinh",
        "Bơi lội": "boi-loi",
        "Bóng bàn": "bong-ban",
        "Bắn cung": "ban-cung",
        "Cầu lông": "cau-long",
        "Cờ vua": "co-vua",
        "Bóng rổ xe lăn": "bong-ro-xe-lan",
        "Quần vợt xe lăn": "quan-vot-xe-lan",
      };
      s = await prisma.sport.create({
        data: {
          nameVi: name,
          nameEn: slugMap[name]?.replace(/-/g, " ") ?? name,
          slug: slugMap[name] ?? name.toLowerCase().replace(/\s+/g, "-"),
          icon: "🏅",
          descVi: `Mô tả môn ${name}`,
          descEn: `Description of ${name}`,
          detailDescVi: `Chi tiết môn ${name}`,
          detailDescEn: `Details of ${name}`,
        },
      });
      console.log(`  Created sport: ${name}`);
    }
    sportRefs[name] = s;
  }

  // Organizations (find by name or create)
  const orgNames = [
    "CLB TDTT Hải Phòng",
    "CLB TDTT TP.HCM",
    "CLB TDTT Hà Nội",
    "CLB TDTT Cần Thơ",
    "CLB TDTT Đà Nẵng",
    "CLB TDTT Thái Nguyên",
  ];
  const orgRefs: Record<string, any> = {};
  for (const name of orgNames) {
    let org = await prisma.organization.findFirst({ where: { name } });
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name,
          type: "CLUB",
          location: name.replace("CLB TDTT ", ""),
          description: `Câu lạc bộ Thể dục Thể thao tại ${name.replace("CLB TDTT ", "")}`,
          isApproved: true,
        },
      });
      console.log(`  Created org: ${name}`);
    }
    orgRefs[name] = org;
  }

  // DisabilityType
  const disabilityTypes = await prisma.disabilityType.findMany();
  if (disabilityTypes.length === 0) {
    console.warn("  WARNING: No DisabilityType records found. Creating defaults.");
    disabilityTypes.push(
      await prisma.disabilityType.create({
        data: {
          name: "Khuyết tật vận động chi dưới",
          desc: "Suy giảm chức năng vận động ở hai chi dưới",
        },
      }),
      await prisma.disabilityType.create({
        data: {
          name: "Khuyết tật vận động chi trên",
          desc: "Suy giảm chức năng vận động ở chi trên",
        },
      }),
      await prisma.disabilityType.create({
        data: { name: "Khiếm thị", desc: "Suy giảm hoặc mất hoàn toàn thị lực" },
      })
    );
  }
  const defaultDisability = disabilityTypes[0];

  // Role USER
  const userRole = await prisma.role.findFirst({ where: { name: "USER" } });
  if (!userRole) throw new Error("USER role not found. Run the core seed first.");

  // Products (for affiliate links)
  const products = await prisma.product.findMany({ where: { isActive: true } });
  if (products.length === 0) {
    console.warn("  WARNING: No products found. Affiliate links will omit productId.");
  }

  // Posts (for comments/bookmarks)
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    take: 10,
  });
  if (posts.length === 0) {
    console.warn("  WARNING: No published posts found. Comments/bookmarks will be skipped.");
  }

  console.log(
    `  Found: ${Object.keys(sportRefs).length} sports, ${Object.keys(orgRefs).length} orgs, ${disabilityTypes.length} disability types, ${products.length} products, ${posts.length} posts`
  );

  // =========================================================================
  // PHASE 2: CREATE 15 ATHLETE USERS
  // =========================================================================
  console.log("\n--- Phase 2: Creating 15 athletes ---");

  // Helper to find or create a SportClassification
  async function findOrCreateClassification(sportId: string, code: string, description?: string) {
    let cls = await prisma.sportClassification.findFirst({
      where: { sportId, code },
    });
    if (!cls) {
      cls = await prisma.sportClassification.create({
        data: {
          sportId,
          code,
          description: description ?? `Phân loại ${code}`,
        },
      });
    }
    return cls;
  }

  // Pre-resolve sport-specific classifications
  const cuTaClassN_A = await findOrCreateClassification(
    sportRefs["Cử tạ"].id,
    "N/A",
    "Hạng thương tật chung"
  );
  const boiLoiClassS5 = await findOrCreateClassification(
    sportRefs["Bơi lội"].id,
    "S5",
    "Bơi tự do/ngửa/bướm - Suy giảm vừa"
  );
  const boiLoiClassS6 = await findOrCreateClassification(
    sportRefs["Bơi lội"].id,
    "S6",
    "Bơi tự do/ngửa/bướm - Suy giảm nhẹ"
  );
  const bongBanClass5 = await findOrCreateClassification(
    sportRefs["Bóng bàn"].id,
    "5",
    "VĐV xe lăn khuyết tật thân mình nhẹ"
  );
  const bongBanClass8 = await findOrCreateClassification(
    sportRefs["Bóng bàn"].id,
    "8",
    "VĐV đứng khuyết tật chân trung bình"
  );
  const banCungClassW1 = await findOrCreateClassification(
    sportRefs["Bắn cung"].id,
    "W1",
    "Cung thủ khuyết tật nặng sử dụng cung compound"
  );
  const cauLongClassWH2 = await findOrCreateClassification(
    sportRefs["Cầu lông"].id,
    "WH2",
    "VĐV xe lăn - Suy giảm vừa"
  );
  const coVuaClassVI_B1 = await findOrCreateClassification(
    sportRefs["Cờ vua"].id,
    "VI-B1",
    "Kỳ thủ khiếm thị hoàn toàn"
  );
  const bongRoClass2_5 = await findOrCreateClassification(
    sportRefs["Bóng rổ xe lăn"].id,
    "2.5",
    "Điểm phân loại 2.5 - Suy giảm trung bình"
  );
  const quanVotClassOpen = await findOrCreateClassification(
    sportRefs["Quần vợt xe lăn"].id,
    "Open",
    "Hạng mở - Khuyết tật chi dưới"
  );

  // Existing classifications for Điền kinh (F57 should exist)
  const dienKinhClassF57 = await findOrCreateClassification(
    sportRefs["Điền kinh"].id,
    "F57",
    "Ném đĩa/lao - Suy giảm vừa"
  );

  interface AthleteDef {
    fullName: string;
    email: string;
    gender: "MALE" | "FEMALE";
    sportKey: string;
    classification: any;
    orgKey: string;
    bio: string;
    disabilityIdx: number;
  }

  const athletes: AthleteDef[] = [
    {
      fullName: "Lê Văn Công",
      email: "levancong@paralympic.vn",
      gender: "MALE",
      sportKey: "Cử tạ",
      classification: cuTaClassN_A,
      orgKey: "CLB TDTT Hải Phòng",
      bio: "Kỷ lục gia Paralympic môn Cử tạ hạng 49kg",
      disabilityIdx: 0,
    },
    {
      fullName: "Châu Hoàng Tuyết Loan",
      email: "chautuyetloan@paralympic.vn",
      gender: "FEMALE",
      sportKey: "Cử tạ",
      classification: cuTaClassN_A,
      orgKey: "CLB TDTT TP.HCM",
      bio: "VĐV Cử tạ nữ xuất sắc",
      disabilityIdx: 0,
    },
    {
      fullName: "Cao Ngọc Hùng",
      email: "caongochung@paralympic.vn",
      gender: "MALE",
      sportKey: "Điền kinh",
      classification: dienKinhClassF57,
      orgKey: "CLB TDTT Hà Nội",
      bio: "HCV Paralympic môn Ném lao",
      disabilityIdx: 0,
    },
    {
      fullName: "Nguyễn Thị Hải",
      email: "nguyenthihai@paralympic.vn",
      gender: "FEMALE",
      sportKey: "Điền kinh",
      classification: dienKinhClassF57,
      orgKey: "CLB TDTT Hà Nội",
      bio: "VĐV Ném đĩa - Điền kinh",
      disabilityIdx: 0,
    },
    {
      fullName: "Võ Thanh Tùng",
      email: "vothanhtung@paralympic.vn",
      gender: "MALE",
      sportKey: "Bơi lội",
      classification: boiLoiClassS5,
      orgKey: "CLB TDTT Cần Thơ",
      bio: "Kình ngư vàng Paralympic",
      disabilityIdx: 0,
    },
    {
      fullName: "Trịnh Thị Bích Như",
      email: "trinhbichnhu@paralympic.vn",
      gender: "FEMALE",
      sportKey: "Bơi lội",
      classification: boiLoiClassS6,
      orgKey: "CLB TDTT TP.HCM",
      bio: "VĐV Bơi lội đẳng cấp quốc tế",
      disabilityIdx: 0,
    },
    {
      fullName: "Nguyễn Thị Hồng",
      email: "nguyenthihongtt@paralympic.vn",
      gender: "FEMALE",
      sportKey: "Bóng bàn",
      classification: bongBanClass5,
      orgKey: "CLB TDTT Đà Nẵng",
      bio: "Tay vợt bóng bàn hàng đầu",
      disabilityIdx: 0,
    },
    {
      fullName: "Phạm Văn Tuấn",
      email: "phamvantuan@paralympic.vn",
      gender: "MALE",
      sportKey: "Bóng bàn",
      classification: bongBanClass8,
      orgKey: "CLB TDTT Hải Phòng",
      bio: "VĐV Bóng bàn kỳ cựu",
      disabilityIdx: 0,
    },
    {
      fullName: "Lê Tiến Đạt",
      email: "letiendat@paralympic.vn",
      gender: "MALE",
      sportKey: "Bắn cung",
      classification: banCungClassW1,
      orgKey: "CLB TDTT Hà Nội",
      bio: "Cung thủ Paralympic",
      disabilityIdx: 0,
    },
    {
      fullName: "Hoàng Thị Thùy",
      email: "hoangthithuy@paralympic.vn",
      gender: "FEMALE",
      sportKey: "Cầu lông",
      classification: cauLongClassWH2,
      orgKey: "CLB TDTT Thái Nguyên",
      bio: "Tay vợt cầu lông xe lăn",
      disabilityIdx: 1,
    },
    {
      fullName: "Nguyễn Văn Hòa",
      email: "nguyenvanhoa@paralympic.vn",
      gender: "MALE",
      sportKey: "Cờ vua",
      classification: coVuaClassVI_B1,
      orgKey: "CLB TDTT TP.HCM",
      bio: "Kỳ thủ cờ vua khiếm thị",
      disabilityIdx: 2,
    },
    {
      fullName: "Phạm Thị Hương",
      email: "phamthihuong@paralympic.vn",
      gender: "FEMALE",
      sportKey: "Bóng rổ xe lăn",
      classification: bongRoClass2_5,
      orgKey: "CLB TDTT Cần Thơ",
      bio: "VĐV Bóng rổ xe lăn",
      disabilityIdx: 0,
    },
    {
      fullName: "Trần Văn Anh",
      email: "tranvananh@paralympic.vn",
      gender: "MALE",
      sportKey: "Quần vợt xe lăn",
      classification: quanVotClassOpen,
      orgKey: "CLB TDTT TP.HCM",
      bio: "Tay vợt quần vợt xe lăn",
      disabilityIdx: 0,
    },
    {
      fullName: "Bùi Thị Mai",
      email: "buithimai@paralympic.vn",
      gender: "FEMALE",
      sportKey: "Bắn cung",
      classification: banCungClassW1,
      orgKey: "CLB TDTT Hà Nội",
      bio: "Cung thủ nữ Paralympic",
      disabilityIdx: 0,
    },
    {
      fullName: "Đặng Quang Vinh",
      email: "dangquangvinh@paralympic.vn",
      gender: "MALE",
      sportKey: "Cử tạ",
      classification: cuTaClassN_A,
      orgKey: "CLB TDTT Đà Nẵng",
      bio: "VĐV Cử tạ hạng 72kg",
      disabilityIdx: 0,
    },
  ];

  const athleteProfiles: any[] = [];
  for (const a of athletes) {
    const sport = sportRefs[a.sportKey];
    const org = orgRefs[a.orgKey];

    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {
        fullName: a.fullName,
        gender: a.gender,
        bio: a.bio,
        passwordHash,
      },
      create: {
        email: a.email,
        passwordHash,
        fullName: a.fullName,
        gender: a.gender,
        bio: a.bio,
        roleId: userRole.id,
        isActive: true,
      },
    });

    const profile = await prisma.athleteProfile.upsert({
      where: { userId_sportId: { userId: user.id, sportId: sport.id } },
      update: {
        sportId: sport.id,
        disabilityId: disabilityTypes[a.disabilityIdx]?.id ?? defaultDisability.id,
        organizationId: org.id,
        classificationId: a.classification.id,
        achievements: a.bio,
        active: true,
      },
      create: {
        userId: user.id,
        sportId: sport.id,
        disabilityId: disabilityTypes[a.disabilityIdx]?.id ?? defaultDisability.id,
        organizationId: org.id,
        classificationId: a.classification.id,
        achievements: a.bio,
        active: true,
      },
    });

    athleteProfiles.push(profile);
    console.log(`  Athlete: ${a.fullName} (${a.email})`);
  }

  // =========================================================================
  // PHASE 3: CREATE 3 TOURNAMENTS WITH FULL DETAIL
  // =========================================================================
  console.log("\n--- Phase 3: Creating tournaments ---");

  // --- Tournament 1: Giải Vô địch Toàn quốc 2025 ---
  const t1 = await prisma.tournament.upsert({
    where: { slug: "giai-vo-dich-toan-quoc-2025" },
    update: {},
    create: {
      name: "Giải Vô địch Thể thao Người khuyết tật Toàn quốc 2025",
      slug: "giai-vo-dich-toan-quoc-2025",
      status: "COMPLETED",
      location: "Hà Nội",
      startDate: new Date("2025-12-10"),
      endDate: new Date("2025-12-15"),
      format: "SINGLE_ELIMINATION",
      participantType: "INDIVIDUAL",
      holdThirdPlaceMatch: true,
    },
  });
  console.log(`  Tournament 1: ${t1.name}`);

  const t1SubTournamentDefs = [
    {
      name: "Điền kinh - Giải Vô địch Toàn quốc 2025",
      sportKey: "Điền kinh",
      athleteIndices: [2, 3],
    },
    { name: "Bơi lội - Giải Vô địch Toàn quốc 2025", sportKey: "Bơi lội", athleteIndices: [4, 5] },
    { name: "Cử tạ - Giải Vô địch Toàn quốc 2025", sportKey: "Cử tạ", athleteIndices: [0, 1, 14] },
    {
      name: "Bóng bàn - Giải Vô địch Toàn quốc 2025",
      sportKey: "Bóng bàn",
      athleteIndices: [6, 7],
    },
  ];

  // --- Tournament 2: ASEAN Para Games 13 ---
  const t2 = await prisma.tournament.upsert({
    where: { slug: "asean-para-games-13" },
    update: {},
    create: {
      name: "ASEAN Para Games 13",
      slug: "asean-para-games-13",
      status: "COMPLETED",
      location: "Bangkok, Thái Lan",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-10"),
      format: "SINGLE_ELIMINATION",
      participantType: "INDIVIDUAL",
      holdThirdPlaceMatch: true,
    },
  });
  console.log(`  Tournament 2: ${t2.name}`);

  const t2SubTournamentDefs = [
    { name: "Cử tạ - ASEAN Para Games 13", sportKey: "Cử tạ", athleteIndices: [0, 1, 14] },
    { name: "Bơi lội - ASEAN Para Games 13", sportKey: "Bơi lội", athleteIndices: [4, 5] },
    { name: "Bóng bàn - ASEAN Para Games 13", sportKey: "Bóng bàn", athleteIndices: [6, 7] },
    { name: "Cầu lông - ASEAN Para Games 13", sportKey: "Cầu lông", athleteIndices: [9] },
  ];

  // --- Tournament 3: Giải Vô địch Châu Á - Thái Bình Dương Mở rộng 2026 ---
  const t3 = await prisma.tournament.upsert({
    where: { slug: "giai-vo-dich-chau-a-tbd-mo-rong-2026" },
    update: {},
    create: {
      name: "Giải Vô địch Châu Á - Thái Bình Dương Mở rộng 2026",
      slug: "giai-vo-dich-chau-a-tbd-mo-rong-2026",
      status: "UPCOMING",
      location: "Hà Nội",
      startDate: new Date("2026-11-20"),
      endDate: new Date("2026-11-25"),
      format: "SINGLE_ELIMINATION",
      participantType: "INDIVIDUAL",
      holdThirdPlaceMatch: true,
    },
  });
  console.log(`  Tournament 3: ${t3.name}`);

  const t3SubTournamentDefs = [
    { name: "Điền kinh - Châu Á TBD 2026", sportKey: "Điền kinh", athleteIndices: [2, 3] },
    { name: "Cử tạ - Châu Á TBD 2026", sportKey: "Cử tạ", athleteIndices: [0, 1, 14] },
    { name: "Bơi lội - Châu Á TBD 2026", sportKey: "Bơi lội", athleteIndices: [4, 5] },
    { name: "Bóng bàn - Châu Á TBD 2026", sportKey: "Bóng bàn", athleteIndices: [6, 7] },
    { name: "Cầu lông - Châu Á TBD 2026", sportKey: "Cầu lông", athleteIndices: [9] },
    { name: "Bắn cung - Châu Á TBD 2026", sportKey: "Bắn cung", athleteIndices: [8, 13] },
  ];

  // Helper to create sub-tournament + matches + rankings + medals
  async function createSubTournamentDetail(
    tournament: any,
    def: { name: string; sportKey: string; athleteIndices: number[] },
    matchStatus: string,
    createMedals: boolean,
    year: number
  ) {
    const sport = sportRefs[def.sportKey];
    const subAthletes = def.athleteIndices.map((i) => athleteProfiles[i]).filter(Boolean);

    // Find or create sub-tournament
    let st = await prisma.subTournament.findFirst({
      where: { tournamentId: tournament.id, sportId: sport.id, name: def.name },
    });
    if (!st) {
      st = await prisma.subTournament.create({
        data: {
          name: def.name,
          tournamentId: tournament.id,
          sportId: sport.id,
          format: "SINGLE_ELIMINATION",
          participantType: "INDIVIDUAL",
        },
      });
    }

    // Create matches (semifinal + final)
    const matchDefs: Array<{
      title: string;
      round: string;
      startTime: Date;
      homeIdx: number;
      awayIdx: number;
      result?: string;
    }> = [];

    if (subAthletes.length >= 2) {
      const tStart = tournament.startDate ? new Date(tournament.startDate) : new Date();
      matchDefs.push({
        title: `${def.sportKey} - Bán kết`,
        round: "SEMIFINAL",
        startTime: new Date(tStart.getTime() + 86400000 * 2),
        homeIdx: 0,
        awayIdx: 1,
        result: matchStatus === "COMPLETED" ? getMatchResult(def.sportKey) : undefined,
      });
    }
    if (subAthletes.length >= 2) {
      const tStart = tournament.startDate ? new Date(tournament.startDate) : new Date();
      const homeIdx = subAthletes.length >= 4 ? 2 : 0;
      const awayIdx = subAthletes.length >= 4 ? 3 : subAthletes.length >= 3 ? 2 : 1;
      matchDefs.push({
        title: `${def.sportKey} - Chung kết`,
        round: "FINAL",
        startTime: new Date(tStart.getTime() + 86400000 * 4),
        homeIdx,
        awayIdx,
        result: matchStatus === "COMPLETED" ? getMatchResult(def.sportKey) : undefined,
      });
    }

    for (const md of matchDefs) {
      const existingMatch = await prisma.match.findFirst({
        where: {
          tournamentId: tournament.id,
          subTournamentId: st.id,
          title: md.title,
          round: md.round,
        },
      });
      if (existingMatch) {
        await prisma.match.update({
          where: { id: existingMatch.id },
          data: { result: md.result, status: matchStatus as any },
        });
      } else {
        await prisma.match.create({
          data: {
            title: md.title,
            sportId: sport.id,
            tournamentId: tournament.id,
            subTournamentId: st.id,
            round: md.round,
            startTime: md.startTime,
            location: tournament.location ?? "Hà Nội",
            status: matchStatus as any,
            result: md.result,
          },
        });
      }
    }

    // Create rankings
    for (let i = 0; i < subAthletes.length && i < 4; i++) {
      const athlete = subAthletes[i];
      const existingRanking = await prisma.ranking.findFirst({
        where: {
          athleteId: athlete.id,
          tournamentId: tournament.id,
          sportId: sport.id,
        },
      });
      if (!existingRanking) {
        await prisma.ranking.create({
          data: {
            sportId: sport.id,
            athleteId: athlete.id,
            tournamentId: tournament.id,
            classificationId: athlete.classificationId,
            seed: i + 1,
            rank: i + 1,
            points: (4 - i) * 100,
            status: "ACTIVE",
          },
        });
      }
    }

    // Create medals for completed tournaments
    if (createMedals && subAthletes.length > 0) {
      const medalColors = ["GOLD", "SILVER", "BRONZE"];
      for (let i = 0; i < Math.min(subAthletes.length, 3); i++) {
        const athlete = subAthletes[i];
        const existingMedal = await prisma.medal.findFirst({
          where: {
            athleteId: athlete.id,
            tournamentId: tournament.id,
            type: medalColors[i],
          },
        });
        if (!existingMedal) {
          await prisma.medal.create({
            data: {
              type: medalColors[i],
              year,
              athleteId: athlete.id,
              tournamentId: tournament.id,
            },
          });
        }
      }
    }

    return st;
  }

  function getMatchResult(sportKey: string): string {
    const results: Record<string, string[]> = {
      "Cử tạ": ["145kg - 140kg", "150kg - 148kg", "138kg - 135kg", "160kg - 155kg"],
      "Điền kinh": ["45.20m - 42.10m", "32.50m - 30.40m", "12.15s - 12.48s", "28.30m - 26.70m"],
      "Bơi lội": [
        "1:05.32 - 1:08.15",
        "0:58.40 - 1:01.22",
        "2:15.60 - 2:20.10",
        "0:32.18 - 0:33.45",
      ],
      "Bóng bàn": [
        "11-7, 11-8, 11-6",
        "11-9, 9-11, 11-7, 11-5",
        "11-5, 11-3, 11-8",
        "7-11, 11-8, 11-6, 6-11, 11-9",
      ],
      "Cầu lông": ["21-15, 21-18", "21-17, 19-21, 21-14", "21-12, 21-16", "21-19, 21-17"],
      "Bắn cung": [
        "6-4 (28-27, 27-29, 29-28, 30-28)",
        "6-2 (28-26, 29-27, 27-27, 29-26)",
        "7-3 (29-28, 28-27, 28-28, 30-27, 29-28)",
        "6-0 (28-24, 29-25, 30-26)",
      ],
      "Cờ vua": [
        "1-0 (42 nước)",
        "0.5-0.5 (hòa, thắng tiebreak)",
        "1-0 (38 nước)",
        "0-1 (45 nước)",
      ],
      "Bóng rổ xe lăn": ["68-52", "72-65", "58-54", "63-60"],
      "Quần vợt xe lăn": ["6-3, 6-4", "6-4, 3-6, 6-3", "6-2, 6-1", "7-5, 6-4"],
    };
    const pool = results[sportKey] ?? ["WIN - LOSS"];
    return randomItem(pool);
  }

  // Create sub-tournament details for all three tournaments
  for (const def of t1SubTournamentDefs) {
    await createSubTournamentDetail(t1, def, "COMPLETED", true, 2025);
  }
  console.log("  T1 sub-tournaments: 4 created with matches, rankings, medals");

  for (const def of t2SubTournamentDefs) {
    await createSubTournamentDetail(t2, def, "COMPLETED", true, 2025);
  }
  console.log("  T2 sub-tournaments: 4 created with matches, rankings, medals");

  for (const def of t3SubTournamentDefs) {
    await createSubTournamentDetail(t3, def, "SCHEDULED", false, 2026);
  }
  console.log("  T3 sub-tournaments: 6 created with matches, rankings (no medals)");

  // =========================================================================
  // PHASE 4: CREATE ACHIEVEMENTS
  // =========================================================================
  console.log("\n--- Phase 4: Creating achievements ---");

  const allCompletedTournaments = [t1, t2];

  for (const tournament of allCompletedTournaments) {
    // Get medals for this tournament
    const medals = await prisma.medal.findMany({
      where: { tournamentId: tournament.id },
      include: { athlete: { include: { classification: true } } },
    });

    for (const medal of medals) {
      const sport = await prisma.sport.findFirst({
        where: { id: medal.athlete.sportId },
      });

      const resultStr = sport
        ? `${sport.nameVi} - Huy chương ${medal.type === "GOLD" ? "Vàng" : medal.type === "SILVER" ? "Bạc" : "Đồng"}`
        : `Huy chương ${medal.type}`;

      const existing = await prisma.athleteAchievement.findFirst({
        where: {
          athleteId: medal.athleteId,
          tournamentId: tournament.id,
          medal: medal.type,
        },
      });

      if (!existing) {
        await prisma.athleteAchievement.create({
          data: {
            athleteId: medal.athleteId,
            tournamentId: tournament.id,
            classificationId: medal.athlete.classificationId,
            medal: medal.type,
            result: resultStr,
            isVerified: medal.type === "GOLD",
          },
        });
      }
    }
    console.log(`  Achievements for tournament "${tournament.name}": ${medals.length}`);
  }

  // Also create a few verified GOLD achievements explicitly from the tournament data
  for (const tournament of allCompletedTournaments) {
    const goldMedals = await prisma.medal.findMany({
      where: { tournamentId: tournament.id, type: "GOLD" },
    });
    for (const gm of goldMedals) {
      await prisma.athleteAchievement.updateMany({
        where: { athleteId: gm.athleteId, tournamentId: tournament.id, medal: "GOLD" },
        data: { isVerified: true },
      });
    }
  }

  // =========================================================================
  // PHASE 5: AFFILIATE LINKS + CLICKS + COMMISSIONS + PAYOUTS
  // =========================================================================
  console.log("\n--- Phase 5: Creating affiliate data ---");

  const allAffiliateLinks: any[] = [];

  for (const athlete of athleteProfiles) {
    const athleteSport = await prisma.sport.findUnique({ where: { id: athlete.sportId } });
    const numLinks = randomInt(2, 3);

    for (let i = 0; i < numLinks; i++) {
      const platform = randomItem(PLATFORMS);
      const product = products.length > 0 ? randomItem(products) : null;

      const titles: Record<string, string[]> = {
        SHOPEE: [
          "Dụng cụ tập luyện chuyên dụng",
          "Thực phẩm bổ sung dinh dưỡng",
          "Trang phục thể thao thoáng khí",
        ],
        TIKTOK: [
          "Review dụng cụ thể thao",
          "Bí quyết tập luyện tại nhà",
          "Phụ kiện thể thao giá tốt",
        ],
        LAZADA: [
          "Thiết bị hỗ trợ tập luyện",
          "Combo dinh dưỡng thể thao",
          "Dụng cụ phục hồi sau tập",
        ],
      };

      const shortCode = `${athlete.id.substring(0, 6)}-${platform.toLowerCase()}-${i + 1}`;

      const link = await prisma.affiliateLink.upsert({
        where: { trackingUrl: `https://${platform.toLowerCase()}.vn/aff/${shortCode}` },
        update: {},
        create: {
          athleteId: athlete.id,
          platform,
          productId: product?.id ?? null,
          title: randomItem(titles[platform] ?? titles.SHOPEE),
          description: `Link tiếp thị liên kết ${platform} - ${athleteSport?.nameVi ?? "Thể thao"}`,
          originalUrl: `https://${platform.toLowerCase()}.vn/product-${randomInt(10000, 99999)}.html`,
          trackingUrl: `https://${platform.toLowerCase()}.vn/aff/${shortCode}`,
          shortCode,
          affiliateCode: `AFF-${shortCode.toUpperCase()}`,
          commissionRate: randomFloat(3, 10, 0),
          isActive: true,
        },
      });

      allAffiliateLinks.push(link);

      // Create clicks
      const numClicks = randomInt(5, 20);
      for (let c = 0; c < numClicks; c++) {
        await prisma.affiliateClick.create({
          data: {
            linkId: link.id,
            ipAddress: randomItem(VIETNAM_IPS),
            userAgent: "Mozilla/5.0",
            referer: `https://${randomItem(UTM_SOURCES)}.com`,
            utmSource: randomItem(UTM_SOURCES),
            utmMedium: randomItem(UTM_MEDIUMS),
            utmCampaign: randomItem(UTM_CAMPAIGNS),
            country: "VN",
            device: randomItem(DEVICES),
            isConverted: Math.random() > 0.7,
            createdAt: daysAgo(randomInt(1, 90)),
          },
        });
      }

      // Update click count
      await prisma.affiliateLink.update({
        where: { id: link.id },
        data: { clickCount: numClicks },
      });
    }
  }

  console.log(`  Affiliate links created: ${allAffiliateLinks.length} (clicks included)`);

  // Create commissions
  const allCommissions: any[] = [];
  const commissionStatuses: Array<"PENDING" | "CONFIRMED" | "APPROVED" | "PAID"> = [
    "PENDING",
    "CONFIRMED",
    "APPROVED",
    "PAID",
  ];

  for (const athlete of athleteProfiles) {
    const athleteLinks = allAffiliateLinks.filter((l) => l.athleteId === athlete.id);
    const numCommissions = randomInt(1, 3);

    for (let c = 0; c < numCommissions; c++) {
      const link = athleteLinks.length > 0 ? randomItem(athleteLinks) : null;
      const product = link?.productId
        ? products.find((p) => p.id === link.productId)
        : randomItem(products);
      const rate = randomFloat(3, 10, 1);
      const orderAmount = randomFloat(200000, 5000000, 0);
      const status = randomItem(commissionStatuses);

      const commission = await prisma.commission.create({
        data: {
          athleteId: athlete.id,
          linkId: link?.id ?? null,
          productId: product?.id ?? null,
          platform: link?.platform ?? randomItem(PLATFORMS),
          orderId: `ORD-${Date.now()}-${randomInt(1000, 9999)}`,
          orderAmount,
          commissionRate: rate,
          commissionAmount: Math.round(orderAmount * (rate / 100)),
          status,
          notes: status === "PENDING" ? "Đang chờ xác nhận từ nhãn hàng" : undefined,
          approvedAt: ["CONFIRMED", "APPROVED", "PAID"].includes(status)
            ? daysAgo(randomInt(1, 30))
            : null,
          createdAt: daysAgo(randomInt(5, 90)),
        },
      });

      allCommissions.push(commission);
    }
  }

  console.log(`  Commissions created: ${allCommissions.length}`);

  // Create payouts for APPROVED/PAID commissions
  const approvedCommissions = allCommissions.filter(
    (c) => c.status === "APPROVED" || c.status === "PAID"
  );
  const payoutGroups: Map<string, any[]> = new Map();

  for (const comm of approvedCommissions) {
    const key = comm.athleteId;
    if (!payoutGroups.has(key)) payoutGroups.set(key, []);
    payoutGroups.get(key)!.push(comm);
  }

  let payoutCount = 0;
  const maxPayouts = randomInt(3, 5);
  const athleteKeys = Array.from(payoutGroups.keys());

  for (let i = 0; i < Math.min(maxPayouts, athleteKeys.length); i++) {
    const athleteId = athleteKeys[i];
    const comms = payoutGroups.get(athleteId)!;
    const totalAmount = comms.reduce((sum, c) => sum + c.commissionAmount, 0);

    const payout = await prisma.payout.create({
      data: {
        athleteId,
        amount: Math.round(totalAmount),
        status: "APPROVED",
        paymentMethod: randomItem(["BANK_TRANSFER", "MOMO", "ZALOPAY"]),
        paymentInfo: {
          bankName: "Vietcombank",
          accountNumber: `${randomInt(1000000000, 9999999999)}`,
        },
        referenceId: `PAY-${Date.now()}-${i}`,
        processedAt: daysAgo(randomInt(1, 15)),
      },
    });

    // Link commissions to this payout
    for (const comm of comms) {
      await prisma.commission.update({
        where: { id: comm.id },
        data: { payoutId: payout.id, status: "PAID" },
      });
    }

    payoutCount++;
  }

  console.log(`  Payouts created: ${payoutCount}`);

  // =========================================================================
  // PHASE 6: SOCIAL / COMMUNITY DATA
  // =========================================================================
  console.log("\n--- Phase 6: Creating social/community data ---");

  // Companion Requests (sponsorship requests)
  const companionDefs = [
    {
      fullName: "Nguyễn Thị Lan",
      unit: "CLB TDTT Hà Nội",
      phone: "0912345678",
      email: "lan.nguyen@gmail.com",
      type: "SPONSORSHIP",
      message:
        "Kính gửi Ban tổ chức, tôi là đại diện CLB TDTT Hà Nội. Chúng tôi đang tìm kiếm nhà tài trợ cho đội tuyển điền kinh tham dự giải đấu sắp tới. Rất mong nhận được sự hỗ trợ.",
    },
    {
      fullName: "Trần Văn Minh",
      unit: "Trung tâm Bảo trợ Xã hội TP.HCM",
      phone: "0987654321",
      email: "minh.tran@gmail.com",
      type: "SPONSORSHIP",
      message:
        "Chúng tôi có 5 vận động viên bơi lội cần được tài trợ thiết bị tập luyện và chi phí đi lại tham dự ASEAN Para Games. Mong quý đơn vị quan tâm hỗ trợ.",
    },
  ];

  for (const cr of companionDefs) {
    const existing = await prisma.companionRequest.findFirst({
      where: { email: cr.email, type: cr.type },
    });
    if (!existing) {
      await prisma.companionRequest.create({ data: cr });
    }
  }
  console.log(`  Companion requests: ${companionDefs.length}`);

  // Comments on posts by new users
  if (posts.length > 0) {
    let commentCount = 0;
    for (const athlete of athleteProfiles) {
      if (Math.random() > 0.4) {
        const post = randomItem(posts);
        const user = await prisma.user.findUnique({ where: { id: athlete.userId } });
        if (user) {
          await prisma.comment.create({
            data: {
              content: randomItem(COMMENT_TEXTS),
              userId: user.id,
              postId: post.id,
              isApproved: true,
            },
          });
          commentCount++;
        }
      }
    }
    console.log(`  Comments: ${commentCount}`);
  }

  // Bookmarks for new users on posts
  if (posts.length > 0) {
    let bookmarkCount = 0;
    for (const athlete of athleteProfiles) {
      if (Math.random() > 0.5) {
        const post = randomItem(posts);
        const user = await prisma.user.findUnique({ where: { id: athlete.userId } });
        if (user) {
          await prisma.bookmark.upsert({
            where: {
              userId_postId: {
                userId: user.id,
                postId: post.id,
              },
            },
            update: {},
            create: {
              userId: user.id,
              postId: post.id,
            },
          });
          bookmarkCount++;
        }
      }
    }
    console.log(`  Bookmarks: ${bookmarkCount}`);
  }

  console.log("\n=== PHASE 6 COMPLETE ===\n");
}

// ---------------------------------------------------------------------------
// Self-executing entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  seed(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
