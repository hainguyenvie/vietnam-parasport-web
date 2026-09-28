import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Rename "Tin tức chung" to "Sự Kiện"
  const catNews = await prisma.category.findUnique({ where: { slug: "tin-tuc-chung" } });
  if (catNews) {
    await prisma.category.update({
      where: { id: catNews.id },
      data: { name: "Sự Kiện", slug: "su-kien" },
    });
  }

  // 2. Rename "Các môn thể thao" to "Thể Thao"
  const catSports = await prisma.category.findUnique({ where: { slug: "cac-mon-the-thao" } });
  if (catSports) {
    await prisma.category.update({
      where: { id: catSports.id },
      data: { name: "Thể Thao", slug: "the-thao" },
    });
  }

  // 3. Move posts from other categories to "Sự Kiện"
  const catSuKien = await prisma.category.findUnique({ where: { slug: "su-kien" } });

  if (catSuKien) {
    const creatorLab = await prisma.category.findUnique({ where: { slug: "creator-lab" } });
    if (creatorLab) {
      await prisma.post.updateMany({
        where: { categoryId: creatorLab.id },
        data: { categoryId: catSuKien.id },
      });
      await prisma.category.delete({ where: { id: creatorLab.id } });
    }

    const clubs = await prisma.category.findUnique({ where: { slug: "hoat-dong-clb" } });
    if (clubs) {
      await prisma.post.updateMany({
        where: { categoryId: clubs.id },
        data: { categoryId: catSuKien.id },
      });
      await prisma.category.delete({ where: { id: clubs.id } });
    }
  }

  console.log("Categories updated successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
