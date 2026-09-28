const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.document.findMany();
  for (const d of docs) {
    const newSlug = d.slug
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    if (newSlug !== d.slug && newSlug.length > 0) {
      console.log(`Updating slug: "${d.slug}" -> "${newSlug}"`);
      await prisma.document.update({
        where: { id: d.id },
        data: { slug: newSlug }
      });
    }
  }
  
  const topics = await prisma.documentTopic.findMany();
  for (const t of topics) {
    const newSlug = t.slug
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    if (newSlug !== t.slug && newSlug.length > 0) {
      console.log(`Updating topic slug: "${t.slug}" -> "${newSlug}"`);
      await prisma.documentTopic.update({
        where: { id: t.id },
        data: { slug: newSlug }
      });
    }
  }
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
