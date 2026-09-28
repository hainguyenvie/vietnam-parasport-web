import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedAssignments() {
  console.log("🌱 Seeding assignments & submissions...");

  const lessons = await prisma.lesson.findMany({
    take: 5,
    select: { id: true, title: true, chapter: { select: { courseId: true } } },
  });
  const users = await prisma.user.findMany({ take: 10, select: { id: true, fullName: true } });

  if (lessons.length === 0 || users.length === 0) {
    console.log("  ⚠️ No lessons or users found, skipping assignments");
    return;
  }

  const assignmentTemplates = [
    {
      title: "Bài tập cuối khóa",
      description: "Hoàn thành bài tập tổng hợp kiến thức đã học. Nộp file PDF hoặc Word.",
    },
    {
      title: "Thực hành kỹ thuật",
      description: "Quay video thực hiện kỹ thuật đã học và nộp link video.",
    },
    { title: "Viết báo cáo", description: "Viết báo cáo 500 từ về trải nghiệm tập luyện của bạn." },
    {
      title: "Bài kiểm tra giữa kỳ",
      description: "Trả lời các câu hỏi và nộp qua form được cung cấp.",
    },
  ];

  const feedbacks = [
    "Bài làm tốt, trình bày rõ ràng. Cần cải thiện phần phân tích.",
    "Hoàn thành đầy đủ yêu cầu. Điểm cao!",
    "Cần nộp lại phần thực hành, video chưa đạt yêu cầu.",
    "Bài làm xuất sắc, phân tích sâu sắc. Giữ vững phong độ!",
    "Đạt yêu cầu cơ bản. Cố gắng hơn ở bài tiếp theo.",
  ];

  let createdAssignments = 0;
  let createdSubmissions = 0;

  for (let i = 0; i < Math.min(lessons.length, assignmentTemplates.length); i++) {
    const lesson = lessons[i];
    const template = assignmentTemplates[i];

    const assignment = await prisma.assignment.create({
      data: {
        title: template.title,
        description: template.description,
        lessonId: lesson.id,
      },
    });
    createdAssignments++;

    // Create 2-4 submissions per assignment
    const numSubmissions = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numSubmissions; j++) {
      const user = users[(i * 3 + j) % users.length];
      const status = j === 0 ? "GRADED" : j === 1 && Math.random() > 0.5 ? "GRADED" : "PENDING";

      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignment.id,
          userId: user.id,
          text: `Bài nộp của ${user.fullName} cho "${template.title}"`,
          status,
          score: status === "GRADED" ? 6 + Math.floor(Math.random() * 4) : null,
          feedback: status === "GRADED" ? feedbacks[(i + j) % feedbacks.length] : null,
        },
      });
      createdSubmissions++;
    }
  }

  console.log(`  ✅ Created ${createdAssignments} assignments, ${createdSubmissions} submissions`);
}

if (require.main === module) {
  seedAssignments()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
