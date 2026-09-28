import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedReviews() {
  console.log("🌱 Seeding product reviews...");

  const products = await prisma.product.findMany({ take: 12, select: { id: true, name: true } });
  const users = await prisma.user.findMany({ take: 20, select: { id: true, fullName: true } });

  if (products.length === 0 || users.length === 0) {
    console.log("  ⚠️ No products or users found, skipping reviews");
    return;
  }

  const reviews = [
    {
      rating: 5,
      comment: "Sản phẩm tuyệt vời! Chất lượng rất tốt, giao hàng nhanh. Rất đáng đồng tiền.",
    },
    {
      rating: 4,
      comment: "Dùng được một thời gian rồi, thấy khá ổn. Chất liệu tốt, thiết kế đẹp.",
    },
    { rating: 5, comment: "Mua cho đội tập luyện, mọi người đều thích. Sẽ ủng hộ thêm." },
    {
      rating: 3,
      comment: "Sản phẩm tạm được, giá hơi cao so với chất lượng. Hy vọng có khuyến mãi.",
    },
    { rating: 4, comment: "Giao hàng nhanh, đóng gói cẩn thận. Sản phẩm đúng mô tả." },
    { rating: 5, comment: "Rất hài lòng! Mua lần thứ 2 rồi, chất lượng vẫn tốt như lần đầu." },
    { rating: 2, comment: "Màu sắc hơi khác so với hình. Chất lượng trung bình." },
    { rating: 5, comment: "Tập luyện với sản phẩm này thấy hiệu quả rõ rệt. Recommend!" },
    { rating: 4, comment: "Sản phẩm tốt, phù hợp với người khuyết tật. Thiết kế thông minh." },
    { rating: 5, comment: "Đã giới thiệu cho bạn bè trong CLB. Ai cũng khen. Cảm ơn shop!" },
    { rating: 3, comment: "Ổn, nhưng nên cải thiện thêm phần tay cầm cho dễ sử dụng hơn." },
    { rating: 4, comment: "Mua về dùng thử 1 tuần, thấy khá ổn. Sẽ review lại sau 1 tháng." },
    { rating: 5, comment: "Chất lượng vượt mong đợi! Sản phẩm hỗ trợ VĐV Paralympic rất ý nghĩa." },
    { rating: 4, comment: "Đóng gói đẹp, có kèm hướng dẫn sử dụng chi tiết bằng tiếng Việt." },
    { rating: 5, comment: "Mua ủng hộ các VĐV Paralympic Việt Nam. Tự hào quá!" },
  ];

  let created = 0;
  for (let i = 0; i < reviews.length; i++) {
    const product = products[i % products.length];
    const user = users[i % users.length];

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: product.id, userId: user.id } },
    });
    if (existing) continue;

    await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: reviews[i].rating,
        comment: reviews[i].comment,
      },
    });
    created++;
  }

  console.log(`  ✅ Created ${created} reviews across ${products.length} products`);
}

// Run directly
if (require.main === module) {
  seedReviews()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
