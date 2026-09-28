import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedOrders() {
  console.log("🌱 Seeding orders & order items...");

  // Skip if orders already exist
  const existingCount = await prisma.order.count();
  if (existingCount > 0) {
    console.log(`  ⚠️ ${existingCount} orders already exist, skipping`);
    return;
  }

  const products = await prisma.product.findMany({
    take: 10,
    select: { id: true, name: true, price: true, salePrice: true, stock: true },
  });
  const users = await prisma.user.findMany({ take: 15, select: { id: true } });

  if (products.length === 0 || users.length === 0) {
    console.log("  ⚠️ No products or users found, skipping orders");
    return;
  }

  const addresses = [
    "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    "45 Lê Duẩn, Quận Hải Châu, Đà Nẵng",
    "78 Trần Phú, Quận Ba Đình, Hà Nội",
    "12 Nguyễn Trãi, Quận Thanh Xuân, Hà Nội",
    "56 Lê Lợi, TP. Huế, Thừa Thiên Huế",
    "90 Hùng Vương, TP. Cần Thơ",
    "34 Trần Hưng Đạo, TP. Nha Trang, Khánh Hòa",
    "67 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
  ];

  const phones = [
    "0912345678",
    "0987654321",
    "0905123456",
    "0978123456",
    "0933456789",
    "0966789012",
    "0945678901",
    "0922334455",
  ];

  const statuses = ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED"];

  const orderCount = 16;
  const createdOrders = [];

  for (let i = 0; i < orderCount; i++) {
    const user = users[i % users.length];
    const numItems = 1 + Math.floor(Math.random() * 3); // 1-3 items
    const items = [];
    let totalAmount = 0;

    const usedProducts = new Set<string>();
    for (let j = 0; j < numItems; j++) {
      let product;
      do {
        product = products[Math.floor(Math.random() * products.length)];
      } while (usedProducts.has(product.id));
      usedProducts.add(product.id);

      const price = product.salePrice ?? product.price;
      const quantity =
        product.stock > 0 ? Math.min(1 + Math.floor(Math.random() * 3), product.stock) : 1;
      const subtotal = price * quantity;
      totalAmount += subtotal;

      items.push({
        productId: product.id,
        productName: product.name,
        productPrice: price,
        quantity,
        subtotal,
      });

      // Decrement stock
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: { decrement: quantity } },
      });
    }

    const status = i < 4 ? statuses[i] : statuses[Math.floor(Math.random() * statuses.length)];

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        totalAmount,
        status,
        shippingAddress: addresses[i % addresses.length],
        phoneNumber: phones[i % phones.length],
        notes: status === "DELIVERED" ? "Khách đã nhận hàng và kiểm tra" : null,
        items: { create: items },
      },
    });

    createdOrders.push(order);
  }

  console.log(`  ✅ Created ${createdOrders.length} orders with items`);
}

if (require.main === module) {
  seedOrders()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
