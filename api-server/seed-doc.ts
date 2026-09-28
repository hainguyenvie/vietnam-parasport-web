import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const topic = await prisma.documentTopic.upsert({
    where: { slug: 'truyen-thong' },
    update: {},
    create: {
      name: 'Truyền thông & Báo chí',
      slug: 'truyen-thong',
      description: 'Tài liệu hướng dẫn truyền thông',
    },
  });

  await prisma.document.upsert({
    where: { slug: 'cach-tranh-ngon-tu-thuong-hai' },
    update: {},
    create: {
      title: 'Cách tránh ngôn từ thương hại khi truyền thông',
      slug: 'cach-tranh-ngon-tu-thuong-hai',
      content:
        '<h2>Ngôn từ định hình nhận thức</h2><p>Khi viết về vận động viên khuyết tật, tuyệt đối tránh sử dụng các từ ngữ mang tính chất thương hại như: nạn nhân, đáng thương, bất hạnh...</p><p>Thay vào đó, hãy sử dụng ngôn từ tập trung vào thành tích thể thao, nỗ lực và sự chuyên nghiệp của họ.</p>',
      topicId: topic.id,
      attachments: {
        create: [
          {
            fileUrl:
              'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            fileName: 'Huong_Dan_Truyen_Thong.pdf',
            fileType: 'pdf',
          },
        ],
      },
    },
  });
  console.log('Document created!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
