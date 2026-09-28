import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Seed Marketplace: Categories, Stores, Products ===\n");

  const partners = await prisma.partner.findMany();
  if (partners.length === 0) {
    console.error("No partners found. Run main seed.ts first.");
    process.exit(1);
  }

  // ─── Product Categories ──────────────────────────────────────────────
  console.log("1. Seeding Product Categories...");
  const categoryData = [
    {
      name: "Thiết bị tập luyện",
      slug: "thiet-bi-tap-luyen",
      description: "Dụng cụ và máy tập chuyên dụng cho vận động viên",
      imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    },
    {
      name: "Dinh dưỡng thể thao",
      slug: "dinh-duong-the-thao",
      description: "Thực phẩm bổ sung, whey protein, vitamin cho VĐV",
      imageUrl: "https://images.unsplash.com/photo-1622484212850-eb59c3e4b4e5?w=400",
    },
    {
      name: "Phụ kiện công nghệ",
      slug: "phu-kien-cong-nghe",
      description: "Đồng hồ thông minh, tai nghe, thiết bị theo dõi luyện tập",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    },
    {
      name: "Thời trang thể thao",
      slug: "thoi-trang-the-thao",
      description: "Quần áo, giày dép thể thao chuyên dụng",
      imageUrl: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=400",
    },
    {
      name: "Dụng cụ hỗ trợ",
      slug: "dung-cu-ho-tro",
      description: "Xe lăn thể thao, chân giả, thiết bị hỗ trợ vận động",
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    },
    {
      name: "Sản phẩm sức khỏe",
      slug: "san-pham-suc-khoe",
      description: "Băng quấn, dụng cụ massage, vật lý trị liệu",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoryData) {
    const cat = await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    categories[c.slug] = cat.id;
  }
  console.log(`  Created ${categoryData.length} categories`);

  const partnerMap = new Map(partners.map((p) => [p.name, p]));

  // ─── Sponsor Stores ──────────────────────────────────────────────────
  console.log("2. Seeding Sponsor Stores...");
  const storeConfigs: {
    partnerName: string;
    name: string;
    slug: string;
    description: string;
    logoUrl: string;
    bannerUrl: string;
  }[] = [
    {
      partnerName: "Decathlon VN",
      name: "Decathlon Vietnam",
      slug: "decathlon-vietnam",
      description:
        "Hệ thống bán lẻ đồ thể thao hàng đầu thế giới, nay có mặt tại Việt Nam với đầy đủ dụng cụ cho mọi bộ môn.",
      logoUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200",
      bannerUrl: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200",
    },
    {
      partnerName: "Herbalife VN",
      name: "Herbalife Vietnam",
      slug: "herbalife-vietnam",
      description:
        "Thương hiệu dinh dưỡng thể thao toàn cầu, cung cấp thực phẩm bổ sung chất lượng cao cho VĐV chuyên nghiệp.",
      logoUrl: "https://images.unsplash.com/photo-1622484212850-eb59c3e4b4e5?w=200",
      bannerUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200",
    },
    {
      partnerName: "Honda Việt Nam",
      name: "Honda Vietnam Sports",
      slug: "honda-vietnam-sports",
      description:
        "Chi nhánh thể thao của Honda Việt Nam, cung cấp thiết bị công nghệ và phụ kiện thể thao.",
      logoUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
      bannerUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200",
    },
    {
      partnerName: "FPT Corporation",
      name: "FPT Tech Store",
      slug: "fpt-tech-store",
      description:
        "Cửa hàng công nghệ từ FPT, chuyên cung cấp thiết bị đeo thông minh và phụ kiện công nghệ cho VĐV.",
      logoUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=200",
      bannerUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200",
    },
    {
      partnerName: "Tập đoàn Vingroup",
      name: "VinGroup Sports",
      slug: "vingroup-sports",
      description:
        "Thương hiệu thể thao thuộc tập đoàn Vingroup, cung cấp thiết bị tập luyện cao cấp và dụng cụ hỗ trợ VĐV.",
      logoUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200",
      bannerUrl: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200",
    },
  ];

  const stores: any[] = [];
  for (const cfg of storeConfigs) {
    const partner = partnerMap.get(cfg.partnerName);
    if (!partner) continue;
    const store = await prisma.sponsorStore.upsert({
      where: { slug: cfg.slug },
      update: {},
      create: {
        partnerId: partner.id,
        name: cfg.name,
        slug: cfg.slug,
        description: cfg.description,
        logoUrl: cfg.logoUrl,
        bannerUrl: cfg.bannerUrl,
        isActive: true,
      },
    });
    stores.push(store);
  }
  console.log(`  Created ${stores.length} stores`);

  // ─── Products ────────────────────────────────────────────────────────
  console.log("3. Seeding Products...");
  const productData = [
    // Decathlon (6 products)
    {
      storeSlug: "decathlon-vietnam",
      name: "Dây kháng lực tập cơ Decathlon",
      slug: "day-khang-luc-decathlon",
      description:
        "Bộ 5 dây kháng lực với các mức lực từ 5kg đến 25kg, phù hợp tập phục hồi chức năng và tăng cường sức mạnh cơ bắp cho VĐV khuyết tật.",
      price: 350000,
      salePrice: 290000,
      category: "thiet-bi-tap-luyen",
      images:
        '["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600","https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600"]',
      commissionRate: 5,
      stock: 150,
      isFeatured: true,
    },
    {
      storeSlug: "decathlon-vietnam",
      name: "Thảm tập yoga chống trượt",
      slug: "tham-tap-yoga-chong-truot",
      description:
        "Thảm tập dày 6mm, chống trượt tuyệt đối, phù hợp cho người tập trên xe lăn hoặc tập sàn.",
      price: 450000,
      salePrice: null,
      category: "thiet-bi-tap-luyen",
      images: '["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600"]',
      commissionRate: 5,
      stock: 200,
      isFeatured: false,
    },
    {
      storeSlug: "decathlon-vietnam",
      name: "Bóng tập Boccia thi đấu chính hãng",
      slug: "bong-tap-boccia-thi-dau",
      description:
        "Bộ 6 bóng Boccia tiêu chuẩn BISFed, da cao cấp, trọng lượng chuẩn 275g. Phù hợp thi đấu chuyên nghiệp.",
      price: 2800000,
      salePrice: 2450000,
      category: "dung-cu-ho-tro",
      images: '["https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600"]',
      commissionRate: 7,
      stock: 30,
      isFeatured: true,
    },
    {
      storeSlug: "decathlon-vietnam",
      name: "Áo tập thể thao thoáng khí nam",
      slug: "ao-tap-the-thao-thoang-khi-nam",
      description:
        "Áo thun công nghệ DryFit thoát mồ hôi nhanh, thiết kế rộng rãi dễ mặc cho VĐV xe lăn.",
      price: 250000,
      salePrice: 199000,
      category: "thoi-trang-the-thao",
      images: '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"]',
      commissionRate: 3,
      stock: 300,
      isFeatured: false,
    },
    {
      storeSlug: "decathlon-vietnam",
      name: "Giày chạy bộ đế Boost nâng đỡ",
      slug: "giay-chay-bo-de-boost",
      description:
        "Giày chạy bộ với đế Boost êm ái, hỗ trợ tối đa cho VĐV có chân giả hoặc khớp cổ chân yếu.",
      price: 1800000,
      salePrice: 1490000,
      category: "thoi-trang-the-thao",
      images:
        '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600","https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"]',
      commissionRate: 5,
      stock: 80,
      isFeatured: true,
    },
    {
      storeSlug: "decathlon-vietnam",
      name: "Băng quấn cổ tay bảo vệ khớp",
      slug: "bang-quan-co-tay-bao-ve-khop",
      description:
        "Băng quấn cổ tay co giãn, hỗ trợ nén và bảo vệ khớp cổ tay khi tập cử tạ và bóng bàn.",
      price: 180000,
      salePrice: null,
      category: "san-pham-suc-khoe",
      images: '["https://images.unsplash.com/photo-1609710713133-8aaa510c2b8c?w=600"]',
      commissionRate: 5,
      stock: 250,
      isFeatured: false,
    },
    // Herbalife (4 products)
    {
      storeSlug: "herbalife-vietnam",
      name: "Whey Protein Isolate Hương Vani",
      slug: "whey-protein-isolate-vani",
      description:
        "Protein tinh khiết 90%, 25g protein mỗi serving, ít béo, hỗ trợ phục hồi và phát triển cơ bắp sau tập luyện cường độ cao.",
      price: 1200000,
      salePrice: 990000,
      category: "dinh-duong-the-thao",
      images: '["https://images.unsplash.com/photo-1593095948071-474c5cc2c1cf?w=600"]',
      commissionRate: 8,
      stock: 120,
      isFeatured: true,
    },
    {
      storeSlug: "herbalife-vietnam",
      name: "BCAA Phục hồi cơ bắp 5000mg",
      slug: "bcaa-phuc-hoi-co-bap",
      description:
        "BCAA tỉ lệ 2:1:1 giúp giảm đau nhức cơ, đẩy nhanh phục hồi sau tập. Dạng viên tiện lợi.",
      price: 650000,
      salePrice: null,
      category: "dinh-duong-the-thao",
      images: '["https://images.unsplash.com/photo-1579722821273-0f67a4e1b0a2?w=600"]',
      commissionRate: 8,
      stock: 180,
      isFeatured: false,
    },
    {
      storeSlug: "herbalife-vietnam",
      name: "Vitamin tổng hợp Multi-Sport Formula",
      slug: "vitamin-tong-hop-multi-sport",
      description:
        "Công thức đặc biệt cho VĐV: B12, D3, Sắt, Kẽm, Magie. Tăng cường miễn dịch và năng lượng.",
      price: 450000,
      salePrice: 380000,
      category: "dinh-duong-the-thao",
      images: '["https://images.unsplash.com/photo-1550572017-edd951b55104?w=600"]',
      commissionRate: 6,
      stock: 200,
      isFeatured: true,
    },
    {
      storeSlug: "herbalife-vietnam",
      name: "Gel năng lượng thể thao vị cam",
      slug: "gel-nang-luong-the-thao-cam",
      description:
        "Gel năng lượng nhanh, cung cấp 25g carbs trong 30 giây. Dùng trước và trong khi thi đấu.",
      price: 35000,
      salePrice: null,
      category: "dinh-duong-the-thao",
      images: '["https://images.unsplash.com/photo-1589376410580-27663a16de94?w=600"]',
      commissionRate: 5,
      stock: 500,
      isFeatured: false,
    },
    // Honda Vietnam Sports (4 products)
    {
      storeSlug: "honda-vietnam-sports",
      name: "Đồng hồ thông minh Garmin Forerunner",
      slug: "dong-ho-garmin-forerunner",
      description:
        "Đồng hồ GPS đa môn thể thao, đo nhịp tim, SpO2, theo dõi giấc ngủ. Chống nước 50m.",
      price: 8500000,
      salePrice: 7290000,
      category: "phu-kien-cong-nghe",
      images: '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"]',
      commissionRate: 4,
      stock: 40,
      isFeatured: true,
    },
    {
      storeSlug: "honda-vietnam-sports",
      name: "Tai nghe Bluetooth chống ồn chủ động",
      slug: "tai-nghe-chong-on-chu-dong",
      description:
        "Tai nghe over-ear với ANC, pin 30 giờ, chống mồ hôi IPX5. Lý tưởng cho tập luyện tập trung.",
      price: 2200000,
      salePrice: 1890000,
      category: "phu-kien-cong-nghe",
      images: '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"]',
      commissionRate: 5,
      stock: 60,
      isFeatured: false,
    },
    {
      storeSlug: "honda-vietnam-sports",
      name: "Vòng đeo tay theo dõi sức khỏe Mi Band",
      slug: "vong-deo-tay-mi-band",
      description:
        "Theo dõi nhịp tim 24/7, bước chân, calories, giấc ngủ. Màn hình AMOLED, chống nước IP68.",
      price: 890000,
      salePrice: 749000,
      category: "phu-kien-cong-nghe",
      images: '["https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=600"]',
      commissionRate: 6,
      stock: 100,
      isFeatured: true,
    },
    {
      storeSlug: "honda-vietnam-sports",
      name: "Máy massage cầm tay Mini Gun",
      slug: "may-massage-cam-tay-mini-gun",
      description:
        "Súng massage cơ mini với 4 đầu massage, 5 tốc độ. Giảm căng cơ, tăng tuần hoàn máu sau tập.",
      price: 1200000,
      salePrice: 990000,
      category: "san-pham-suc-khoe",
      images: '["https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600"]',
      commissionRate: 7,
      stock: 70,
      isFeatured: false,
    },
    // FPT Tech Store (4 products)
    {
      storeSlug: "fpt-tech-store",
      name: "iPad Pro M4 11 inch WiFi 256GB",
      slug: "ipad-pro-m4-11-inch",
      description:
        "Máy tính bảng mạnh mẽ cho VĐV xem video phân tích kỹ thuật, theo dõi chiến thuật và học tập trực tuyến.",
      price: 25990000,
      salePrice: 23490000,
      category: "phu-kien-cong-nghe",
      images: '["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"]',
      commissionRate: 3,
      stock: 25,
      isFeatured: true,
    },
    {
      storeSlug: "fpt-tech-store",
      name: "Apple Watch Ultra 2",
      slug: "apple-watch-ultra-2",
      description:
        "Đồng hồ thể thao siêu bền, đo ECG, SpO2, nhiệt độ, độ sâu. Pin 36 giờ. Hoàn hảo cho VĐV đa môn.",
      price: 21990000,
      salePrice: null,
      category: "phu-kien-cong-nghe",
      images: '["https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600"]',
      commissionRate: 3,
      stock: 20,
      isFeatured: false,
    },
    {
      storeSlug: "fpt-tech-store",
      name: "Camera hành trình GoPro Hero 13",
      slug: "gopro-hero-13",
      description:
        "Quay video 5.3K, chống rung HyperSmooth 6.0, chống nước 10m. Ghi lại mọi khoảnh khắc tập luyện và thi đấu.",
      price: 10990000,
      salePrice: 9490000,
      category: "phu-kien-cong-nghe",
      images: '["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600"]',
      commissionRate: 4,
      stock: 35,
      isFeatured: true,
    },
    {
      storeSlug: "fpt-tech-store",
      name: "Loa Bluetooth JBL Charge 5",
      slug: "loa-bluetooth-jbl-charge-5",
      description:
        "Loa Bluetooth chống nước IP67, pin 20 giờ, âm bass mạnh mẽ. Tạo động lực tập luyện với âm nhạc chất lượng.",
      price: 3490000,
      salePrice: 2990000,
      category: "phu-kien-cong-nghe",
      images: '["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"]',
      commissionRate: 5,
      stock: 50,
      isFeatured: false,
    },
    // VinGroup Sports (5 products)
    {
      storeSlug: "vingroup-sports",
      name: "Xe lăn thể thao chuyên dụng Quickie",
      slug: "xe-lan-the-thao-quickie",
      description:
        "Xe lăn thể thao siêu nhẹ 8.5kg, khung titanium, bánh xe carbon, thiết kế khí động học cho bóng rổ và tennis xe lăn.",
      price: 45000000,
      salePrice: 38500000,
      category: "dung-cu-ho-tro",
      images: '["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"]',
      commissionRate: 10,
      stock: 10,
      isFeatured: true,
    },
    {
      storeSlug: "vingroup-sports",
      name: "Chân giả thể thao chạy bộ Flex-Foot",
      slug: "chan-gia-the-thao-flex-foot",
      description:
        "Chân giả carbon chuyên dụng cho chạy bộ, thiết kế lưỡi cong lưu trữ và giải phóng năng lượng. Phân loại T42-T44.",
      price: 35000000,
      salePrice: null,
      category: "dung-cu-ho-tro",
      images: '["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"]',
      commissionRate: 8,
      stock: 8,
      isFeatured: true,
    },
    {
      storeSlug: "vingroup-sports",
      name: "Bộ tạ dumbbell điều chỉnh 25kg",
      slug: "bo-ta-dumbbell-dieu-chinh",
      description:
        "Bộ tạ tay thông minh, xoay núm điều chỉnh từ 2.5kg đến 25kg. Tiết kiệm không gian, phù hợp tập tại nhà.",
      price: 6500000,
      salePrice: 5490000,
      category: "thiet-bi-tap-luyen",
      images: '["https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600"]',
      commissionRate: 6,
      stock: 40,
      isFeatured: true,
    },
    {
      storeSlug: "vingroup-sports",
      name: "Gối massage cổ vai gáy nhiệt hồng ngoại",
      slug: "goi-massage-co-vai-gay",
      description:
        "Gối massage với 8 bi massage, sưởi hồng ngoại, 3 chế độ. Giảm đau mỏi cổ vai cho VĐV tập luyện nhiều.",
      price: 890000,
      salePrice: 690000,
      category: "san-pham-suc-khoe",
      images: '["https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600"]',
      commissionRate: 7,
      stock: 90,
      isFeatured: false,
    },
    {
      storeSlug: "vingroup-sports",
      name: "Bộ băng cản nước TheraBand CLX",
      slug: "bo-bang-can-nuoc-theraband",
      description:
        "Bộ 3 băng cản lực (nhẹ, vừa, nặng) dùng trong vật lý trị liệu và tập tăng cường sức mạnh cơ cho VĐV khuyết tật.",
      price: 550000,
      salePrice: null,
      category: "thiet-bi-tap-luyen",
      images: '["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600"]',
      commissionRate: 6,
      stock: 120,
      isFeatured: false,
    },
  ];

  const storeMap: Record<string, any> = {};
  for (const s of stores) storeMap[s.slug] = s;

  let createdCount = 0;
  for (const p of productData) {
    const store = storeMap[p.storeSlug];
    if (!store) continue;
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          storeId: store.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          salePrice: p.salePrice,
          currency: "VND",
          images: JSON.parse(p.images),
          categoryId: categories[p.category] || null,
          commissionRate: p.commissionRate,
          stock: p.stock,
          isFeatured: p.isFeatured,
          isActive: true,
        },
      });
      createdCount++;
    }
  }
  console.log(`  Created ${createdCount} products`);
  console.log("\n=== Seed Marketplace COMPLETED ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
