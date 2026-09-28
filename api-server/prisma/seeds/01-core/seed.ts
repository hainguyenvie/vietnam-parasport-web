import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import { fakerVI as faker } from "@faker-js/faker";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Converts Vietnamese text to a URL-safe slug
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d") // đ -> d
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  console.log("Bắt đầu dọn dẹp dữ liệu cũ...");

  // Clean tables to avoid duplicates for sequential seed runs
  // Order matters: delete dependents first (child before parent)
  await prisma.ranking.deleteMany({});
  await prisma.affiliateClick.deleteMany({});
  await prisma.commission.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.affiliateLink.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.sponsorStore.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.matchEvent.deleteMany({});
  await prisma.sportEvent.deleteMany({});
  await prisma.subTournament.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.medal.deleteMany({});
  await prisma.athleteAchievement.deleteMany({});
  await prisma.athleteProfile.deleteMany({});
  await prisma.coachProfile.deleteMany({});
  await prisma.assistantProfile.deleteMany({});
  await prisma.sportClassification.deleteMany({});
  await prisma.sport.deleteMany({});
  await prisma.disabilityType.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.systemSetting.deleteMany({});
  await prisma.socialLink.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.tokenBlacklist.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.userCourseProgress.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.chapter.deleteMany({});
  await prisma.documentAttachment.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.documentTopic.deleteMany({});
  await prisma.capcutTemplate.deleteMany({});
  await prisma.emailTemplate.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.companionRequest.deleteMany({});
  await prisma.partner.deleteMany({});

  console.log("Bắt đầu seeding dữ liệu...");

  // 1. Create Roles
  // 0. Create Permissions
  const resources = ["USER", "ROLE", "POST", "COURSE", "TOURNAMENT", "SYSTEM"];
  const actions = ["READ", "CREATE", "UPDATE", "DELETE"];

  const allPermissions = [];
  for (const resource of resources) {
    for (const action of actions) {
      let perm = await prisma.permission.findFirst({
        where: { action, resource },
      });
      if (!perm) {
        perm = await prisma.permission.create({
          data: { action, resource },
        });
      }
      allPermissions.push(perm);
    }
  }

  // 1. Create Roles
  const roles = [
    { name: "SUPER_ADMIN", description: "Quản trị viên cấp cao" },
    { name: "ADMIN", description: "Quản trị viên" },
    { name: "EDITOR", description: "Biên tập viên" },
    { name: "INSTRUCTOR", description: "Giảng viên" },
    { name: "TOURNAMENT_MANAGER", description: "Quản lý giải đấu" },
    { name: "USER", description: "Người dùng/Vận động viên" },
  ];

  for (const role of roles) {
    let existingRole = await prisma.role.findUnique({
      where: { name: role.name },
    });

    if (!existingRole) {
      existingRole = await prisma.role.create({ data: role });
    }

    // Assign ALL permissions to SUPER_ADMIN by default
    if (role.name === "SUPER_ADMIN") {
      await prisma.role.update({
        where: { id: existingRole.id },
        data: {
          permissions: {
            connect: allPermissions.map((p) => ({ id: p.id })),
          },
        },
      });
    }
    // Assign Tournament permissions to TOURNAMENT_MANAGER
    if (role.name === "TOURNAMENT_MANAGER") {
      const tournamentPerms = allPermissions.filter((p) => p.resource === "TOURNAMENT");
      await prisma.role.update({
        where: { id: existingRole.id },
        data: {
          permissions: {
            connect: tournamentPerms.map((p) => ({ id: p.id })),
          },
        },
      });
    }
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { name: "SUPER_ADMIN" },
  });
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  const editorRole = await prisma.role.findUnique({
    where: { name: "EDITOR" },
  });
  const instructorRole = await prisma.role.findUnique({
    where: { name: "INSTRUCTOR" },
  });
  const userRole = await prisma.role.findUnique({ where: { name: "USER" } });

  const passwordHash = await bcrypt.hash("password123", 10);

  // 2. Create Core Users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@paralympic.vn" },
    update: {},
    create: {
      email: "admin@paralympic.vn",
      fullName: "Quản trị viên",
      passwordHash,
      roleId: superAdminRole!.id,
    },
  });

  const instructorUser = await prisma.user.upsert({
    where: { email: "giangvien@paralympic.vn" },
    update: {},
    create: {
      email: "giangvien@paralympic.vn",
      fullName: "HLV Lê Văn Tuấn",
      passwordHash,
      roleId: instructorRole!.id,
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: "user@paralympic.vn" },
    update: {},
    create: {
      email: "user@paralympic.vn",
      fullName: "VĐV Nguyễn Thị Hải",
      passwordHash,
      roleId: userRole!.id,
    },
  });

  // Seed 100 additional athlete users with Faker
  const extraUsers = [];
  for (let i = 1; i <= 100; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${lastName} ${firstName}`;
    extraUsers.push({
      email: faker.internet.email({
        firstName: toSlug(firstName),
        lastName: toSlug(lastName),
        provider: "paralympic.vn",
      }),
      fullName,
      roleId: userRole!.id,
    });
  }

  const seededUsers = [adminUser, instructorUser, normalUser];

  for (const eu of extraUsers) {
    const u = await prisma.user.upsert({
      where: { email: eu.email },
      update: {},
      create: {
        email: eu.email,
        fullName: eu.fullName,
        passwordHash,
        roleId: eu.roleId,
      },
    });
    seededUsers.push(u);
  }

  // 5 coach users
  const coachUsers: any[] = [];
  for (let i = 1; i <= 5; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${lastName} ${firstName}`;
    const cu = await prisma.user.upsert({
      where: { email: `coach${i}@paralympic.vn` },
      update: {},
      create: {
        email: `coach${i}@paralympic.vn`,
        fullName,
        passwordHash,
        roleId: instructorRole!.id,
      },
    });
    seededUsers.push(cu);
    coachUsers.push(cu);
  }

  // 3. Create Categories and Tags
  const categorySports = await prisma.category.upsert({
    where: { slug: "the-thao" },
    update: {},
    create: { name: "Thể Thao", slug: "the-thao" },
  });

  const categoryNews = await prisma.category.upsert({
    where: { slug: "su-kien" },
    update: {},
    create: { name: "Sự Kiện", slug: "su-kien" },
  });

  // Re-map references so the code below doesn't break
  const categoryCreatorLab = categoryNews;
  const categoryClubs = categoryNews;

  const tagParis = await prisma.tag.upsert({
    where: { slug: "paris-2024" },
    update: {},
    create: { name: "Paris 2024", slug: "paris-2024" },
  });

  const tagDienKinh = await prisma.tag.upsert({
    where: { slug: "dien-kinh" },
    update: {},
    create: { name: "Điền kinh", slug: "dien-kinh" },
  });

  const tagBoiLoi = await prisma.tag.upsert({
    where: { slug: "boi-loi" },
    update: {},
    create: { name: "Bơi lội", slug: "boi-loi" },
  });

  const tagCuTa = await prisma.tag.upsert({
    where: { slug: "cu-ta" },
    update: {},
    create: { name: "Cử tạ", slug: "cu-ta" },
  });

  const tagCreator = await prisma.tag.upsert({
    where: { slug: "creator-lab-tag" },
    update: {},
    create: { name: "Creator Lab", slug: "creator-lab-tag" },
  });

  const tagHuongDan = await prisma.tag.upsert({
    where: { slug: "huong-dan" },
    update: {},
    create: { name: "Hướng dẫn", slug: "huong-dan" },
  });

  // 4. Create Posts
  const postData = [
    {
      title: "Đoàn thể thao người khuyết tật Việt Nam lên đường dự Paralympic Paris 2024",
      slug: "viet-nam-tham-du-paralympic-2024",
      excerpt:
        "Đoàn thể thao người khuyết tật Việt Nam đã chính thức lên đường tham dự Paralympic Paris 2024 với quyết tâm cao độ.",
      content:
        "<p>Tối 23/8, Đoàn Thể thao người khuyết tật (TTNKT) Việt Nam đã lên đường sang Pháp tham dự Paralympic Paris 2024. Đoàn Việt Nam tham dự với 14 thành viên, trong đó có 7 VĐV thi đấu ở 3 môn: Điền kinh, Bơi và Cử tạ.</p><p>Mục tiêu của đoàn là phấn đấu giành từ 1 đến 2 huy chương.</p>",
      thumbnail:
        "https://images.unsplash.com/photo-1569074187119-c87815b476da?auto=format&fit=crop&q=80&w=1000",
      categoryId: categoryNews.id,
      tags: [tagParis.id],
    },
    {
      title: "Lực sĩ Lê Văn Công - Niềm hy vọng Vàng của Cử tạ Việt Nam",
      slug: "le-van-cong-hy-vong-vang-cu-ta",
      excerpt:
        "Nhà vô địch Paralympic Rio 2016 Lê Văn Công đang tích cực tập luyện cho kỳ thế vận hội tại Pháp.",
      content:
        "<p>Lực sĩ Lê Văn Công là tượng đài của thể thao người khuyết tật Việt Nam với kỷ lục thế giới ở hạng cân 49kg nam. Dù đang gặp chấn thương vai, anh vẫn quyết tâm thi đấu hết mình vì màu cờ sắc áo.</p>",
      thumbnail:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000",
      categoryId: categorySports.id,
      tags: [tagCuTa.id, tagParis.id],
    },
    {
      title: "Kình ngư Lê Tiến Đạt nỗ lực vượt khó vươn lên",
      slug: "le-tien-dat-vuot-kho-de-den-paris",
      excerpt: "Bản lĩnh của Đạt đã được tôi luyện qua những đường bơi tốc độ cao đầy thử thách.",
      content:
        "<p>Lê Tiến Đạt là một trong những VĐV bơi lội xuất sắc của đoàn Việt Nam. Anh sẽ tranh tài ở nội dung bơi ếch 100m hạng thương tật SB5. Nghị lực rèn luyện của anh là niềm tự hào của cả đội tuyển.</p>",
      thumbnail:
        "https://images.unsplash.com/photo-1519315901367-f34f8a65d565?auto=format&fit=crop&q=80&w=1000",
      categoryId: categorySports.id,
      tags: [tagBoiLoi.id, tagParis.id],
    },
    {
      title: "Tập huấn kỹ năng sử dụng AI trong sản xuất nội dung số cho VĐV tại TP.HCM",
      slug: "tap-huan-su-dung-ai-san-xuat-noi-dung-so-seeding",
      excerpt:
        "Buổi tập huấn trong khuôn khổ Creator Lab đã diễn ra thành công với sự tham gia của hơn 40 vận động viên khuyết tật khu vực phía Nam.",
      content:
        "<p>Khóa tập huấn cung cấp các kiến thức cơ bản về sử dụng trí tuệ nhân tạo (AI) để lên ý tưởng video, viết kịch bản, và tự dựng phim trên điện thoại di động, giúp các VĐV xây dựng thương hiệu cá nhân.</p>",
      thumbnail:
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1000",
      categoryId: categoryCreatorLab.id,
      tags: [tagCreator.id, tagHuongDan.id],
    },
    {
      title: "CLB Điền kinh xe lăn Hà Nội kêu gọi tài trợ trang thiết bị tập luyện trợ năng",
      slug: "clb-dien-kinh-xe-lan-ha-noi-keu-goi-tai-tro-seeding",
      excerpt:
        "CLB đang cần nâng cấp các xe lăn chuyên dụng phục vụ các vận động viên trẻ triển vọng chuẩn bị cho giải quốc gia.",
      content:
        "<p>Với mục tiêu nâng cao thành tích thi đấu cho VĐV điền kinh xe lăn, CLB đang tìm kiếm các đơn vị hỗ trợ hiện vật và chuyên môn để bảo dưỡng xe lăn thể thao và sắm mới các phụ tùng trợ năng đạt chuẩn quốc tế.</p>",
      thumbnail:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1000",
      categoryId: categoryClubs.id,
      tags: [tagDienKinh.id],
    },
    {
      title: "Học cách viết kịch bản xây kênh TikTok chuyên nghiệp cho vận động viên",
      slug: "viet-kich-ban-tiktok-cho-vdv",
      excerpt:
        "Hướng dẫn chi tiết giúp các VĐV xây dựng nội dung ngắn truyền cảm hứng và tránh lối kể chuyện thương hại.",
      content:
        "<p>Bài viết hướng dẫn các bước xây dựng outline kịch bản 60 giây, cách viết hook hấp dẫn người xem và chia sẻ chân thực về hành trình tập luyện thể thao của mình để truyền tải nguồn năng lượng tích cực nhất.</p>",
      thumbnail:
        "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=1000",
      categoryId: categoryCreatorLab.id,
      tags: [tagCreator.id, tagHuongDan.id],
    },
    {
      title: "Gặp gỡ VĐV điền kinh khuyết tật Nguyễn Thị Hải: Ý chí thép trên sân ném đĩa",
      slug: "nguyen-thi-hai-y-chi-thep-nem-dia",
      excerpt: "Hành trình chinh phục những đỉnh cao mới của nữ VĐV ném đĩa kỳ cựu Việt Nam.",
      content:
        "<p>Nguyễn Thị Hải là một trong những vận động viên điền kinh kỳ cựu mang về nhiều tấm huy chương vàng quý giá cho thể thao người khuyết tật Việt Nam tại các kỳ ASEAN Para Games.</p>",
      thumbnail:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1000",
      categoryId: categorySports.id,
      tags: [tagDienKinh.id],
    },
    {
      title: "Khởi tranh Giải vô địch Bóng bàn Người khuyết tật toàn quốc năm 2026",
      slug: "khoi-tranh-giai-vo-dich-bong-ban-nkt-2026-seeding",
      excerpt:
        "Hơn 150 cây vợt xuất sắc từ các tỉnh thành đã tề tựu tại Đà Nẵng để tranh tài ở các nhóm phân hạng thương tật.",
      content:
        "<p>Giải đấu do Tổng cục Thể dục Thể thao và Hiệp hội Thể thao Người khuyết tật Việt Nam phối hợp tổ chức, nhằm tìm kiếm những gương mặt trẻ nổi bật đại diện cho đội tuyển quốc gia.</p>",
      thumbnail:
        "https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?auto=format&fit=crop&q=80&w=1000",
      categoryId: categoryNews.id,
      tags: [tagParis.id],
    },
    {
      title: "Những lưu ý quan trọng về chế độ dinh dưỡng cho người tập xe lăn",
      slug: "dinh-duong-cho-vdv-xe-lan",
      excerpt:
        "Hướng dẫn cân bằng nhóm chất dinh dưỡng và bổ sung nước hợp lý cho người tập luyện thể thao xe lăn.",
      content:
        "<p>Tập luyện xe lăn tiêu tốn lượng calo lớn ở phần thân trên. Bài viết chia sẻ kinh nghiệm thiết lập thực đơn giàu protein, chất xơ và kiểm soát lượng tinh bột để duy trì thể hình tối ưu.</p>",
      thumbnail:
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000",
      categoryId: categorySports.id,
      tags: [tagHuongDan.id],
    },
    {
      title: "Hướng dẫn sử dụng thiết bị thu âm trợ năng khi quay Vlog thể thao",
      slug: "thiet-bi-thu-am-tro-nang",
      excerpt:
        "Cách lựa chọn và setup micro không dây thu âm giọng nói rõ ràng khi tập luyện thể thao cường độ cao.",
      content:
        "<p>Để có một video chất lượng trên mạng xã hội, âm thanh đóng vai trò 50%. Chúng tôi sẽ hướng dẫn các VĐV chọn mic cài áo chống ồn hiệu quả và cách giảm tiếng gió khi quay ngoài trời pitch.</p>",
      thumbnail:
        "https://images.unsplash.com/photo-1484755560695-a4c7302c52e9?auto=format&fit=crop&q=80&w=1000",
      categoryId: categoryCreatorLab.id,
      tags: [tagCreator.id, tagHuongDan.id],
    },
  ];

  const seededPosts: any[] = [];
  for (const post of postData) {
    const createdPost = await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        thumbnail: post.thumbnail,
        authorId: adminUser.id,
        categoryId: post.categoryId,
        status: "PUBLISHED",
        tags: { connect: post.tags.map((id) => ({ id })) },
      },
    });
    seededPosts.push(createdPost);
  }

  // 5. Create Courses & Chapters & Lessons
  const courses = [
    {
      title: "Y học Thể thao & Chăm sóc Sức khỏe VĐV Khuyết tật",
      slug: "y-hoc-the-thao-va-suc-khoe-vdv-khuyet-tat",
      description:
        "Khóa học cơ bản dành cho huấn luyện viên và VĐV khuyết tật vận động để hiểu rõ cấu trúc cơ khớp đặc thù và các biện pháp tự phòng ngừa chấn thương tại nhà.",
      thumbnail:
        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=1000",
      chapters: [
        {
          title: "Cơ bản về Giải phẫu & Chấn thương đặc thù",
          order: 1,
          lessons: [
            {
              title: "Hội chứng chèn ép khớp vai ở VĐV xe lăn",
              order: 1,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content:
                "Tìm hiểu các tác động lực học lên khớp vai khi đẩy xe lăn cường độ cao và cách phát hiện sớm các tổn thương khớp.",
              documentUrl:
                "/uploads/documents/Prevention_Shoulder_Injuries_Wheelchair_Athletes.pdf",
            },
            {
              title: "Các bài tập căng cơ cổ tay và cẳng tay dự phòng hội chứng ống cổ tay",
              order: 2,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content:
                "Hướng dẫn các bài tập kéo giãn cơ gập/duỗi cổ tay đơn giản có thể thực hiện ngay trên xe lăn.",
              vttUrl: "/uploads/subtitles/wrist_stretch.vtt",
            },
          ],
        },
        {
          title: "Dinh dưỡng & Bù nước trong tập luyện",
          order: 2,
          lessons: [
            {
              title: "Tính toán nhu cầu Calo cho VĐV khuyết tật liệt nửa người",
              order: 1,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content:
                "Hướng dẫn tính toán năng lượng tiêu hao nền tảng (BMR) và năng lượng bổ sung dựa trên hoạt động thể thao đặc thù.",
              documentUrl: "/uploads/documents/Calorie_Calculator_Template.xlsx",
            },
            {
              title: "Nguyên tắc bù nước điện giải trước và trong khi thi đấu cự ly dài",
              order: 2,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content:
                "Cách duy trì mức điện giải tối ưu để ngăn ngừa chuột rút và mệt mỏi sớm trong thi đấu marathon xe lăn.",
            },
          ],
        },
      ],
    },
    {
      title: "Luật thi đấu & Hệ thống Phân hạng thương tật IPC",
      slug: "luat-thi-dau-va-phan-hang-thuong-tat-ipc",
      description:
        "Giới thiệu cấu trúc phân loại thương tật của Ủy ban Paralympic Quốc tế (IPC), luật thi đấu các bộ môn trọng điểm tại Việt Nam.",
      thumbnail:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1000",
      chapters: [
        {
          title: "Phân loại thương tật trong Điền kinh (Para-Athletics)",
          order: 1,
          lessons: [
            {
              title: "Phân hạng thương tật chạy/nhảy T35 - T38 (Bại não)",
              order: 1,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content:
                "Tìm hiểu tiêu chí đánh giá trương lực cơ, sự phối hợp vận động tay chân để xếp lớp thi đấu điền kinh công bằng.",
              documentUrl: "/uploads/documents/World_Para_Athletics_Rules_T35_T38_Summary.pdf",
            },
            {
              title: "Quy định về Người dẫn đường (Guide runner) đối với VĐV khiếm thị",
              order: 2,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content:
                "Luật thi đấu quy định về vị trí, dây dẫn đường và cách thức cán đích của cặp đôi VĐV khiếm thị hạng T11/T12.",
            },
          ],
        },
        {
          title: "Luật thi đấu môn Boccia",
          order: 2,
          lessons: [
            {
              title: "Quy tắc tính điểm và phân loại bóng trong Boccia",
              order: 1,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content: "Hướng dẫn luật thi đấu Boccia cơ bản cho các hạng BC1, BC2, BC3 và BC4.",
            },
            {
              title: "Vai trò và giới hạn hành vi của Người hỗ trợ máng lăn BC3 trong sân đấu",
              order: 2,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content:
                "Luật cấm người hỗ trợ BC3 quay mặt vào sân đấu hoặc đưa ra bất kỳ chỉ dẫn chiến thuật nào cho VĐV trong lượt ném.",
              documentUrl: "/uploads/documents/Boccia_Rules_BC3_Guide.pdf",
            },
          ],
        },
      ],
    },
    {
      title: "Kỹ năng truyền thông và Dựng video cá nhân (Creator Lab)",
      slug: "ky-nang-truyen-thong-dung-video-ca-nhan-creator-lab",
      description:
        "Khóa học hướng dẫn VĐV khuyết tật tự quay phim, viết kịch bản, dựng video kể câu chuyện thể thao chân thực và thu hút nhà tài trợ.",
      thumbnail:
        "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=1000",
      chapters: [
        {
          title: "Lên ý tưởng & Kịch bản",
          order: 1,
          lessons: [
            {
              title: "Kể câu chuyện thể thao chân thực và tránh lối truyền thông bi kịch hóa",
              order: 1,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content:
                "Hướng dẫn cách nói về bản thân tự tin, tôn trọng và chuyên nghiệp thay vì tập trung kể khổ.",
            },
            {
              title: "Thiết lập góc máy quay cận cảnh và góc rộng khi tự tập luyện một mình",
              order: 2,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content:
                "Cách đặt chân máy, lấy sáng và căn góc quay thể hiện tốt nhất động lực động tác thể thao khuyết tật.",
            },
          ],
        },
        {
          title: "Biên tập Video chuyên nghiệp bằng CapCut",
          order: 2,
          lessons: [
            {
              title: "Hướng dẫn cắt ghép video, đồng bộ âm thanh và chèn nhạc tạo động lực",
              order: 1,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content:
                "Các kỹ thuật dựng nhanh video ngắn Tik Tok/Reels để tăng tương tác trên kênh cá nhân.",
            },
            {
              title:
                "Kỹ thuật làm phụ đề tự động và tải lên file phụ đề trợ năng cho người khiếm thính",
              order: 2,
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              content: "Tạo tệp phụ đề rời SRT/VTT để hỗ trợ tối đa khả năng tiếp cận nội dung số.",
              vttUrl: "/uploads/subtitles/creator_lab_capcut.vtt",
            },
          ],
        },
      ],
    },
  ];

  const seededLessons: any[] = [];
  const lessonSlugCounter: Record<string, number> = {};

  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        title: c.title,
        slug: c.slug,
        description: c.description,
        thumbnail: c.thumbnail,
        instructorId: instructorUser.id,
      },
    });

    for (const ch of c.chapters) {
      const chapter = await prisma.chapter.create({
        data: {
          title: ch.title,
          order: ch.order,
          courseId: course.id,
        },
      });

      for (const les of ch.lessons) {
        // Generate unique slug from lesson title
        const baseSlug = toSlug(les.title);
        lessonSlugCounter[baseSlug] = (lessonSlugCounter[baseSlug] ?? 0) + 1;
        const uniqueSlug =
          lessonSlugCounter[baseSlug] > 1 ? `${baseSlug}-${lessonSlugCounter[baseSlug]}` : baseSlug;

        const lesson = await prisma.lesson.create({
          data: {
            title: les.title,
            slug: uniqueSlug,
            order: les.order,
            videoUrl: les.videoUrl,
            vttUrl: (les as any).vttUrl || null,
            documentUrl: (les as any).documentUrl || null,
            content: `<p>${les.content}</p>`,
            chapterId: chapter.id,
          },
        });
        seededLessons.push(lesson);
      }
    }
  }

  // 6. Create Clubs (18 clubs across Vietnam)
  const clubsData = [
    // Miền Bắc
    {
      name: "CLB Cử tạ Người khuyết tật Hà Nội",
      location: "Hà Nội (Miền Bắc)",
      sport: "Cử tạ",
      schedule: "Chiều Thứ 2, 4, 6 từ 14:00 - 17:00",
      suitableFor: "Người khuyết tật vận động chi dưới",
      contactInfo: "HLV Nguyễn Hồng Anh - 0987654321",
      description:
        "Nơi tập luyện của các vận động viên cử tạ khuyết tật hàng đầu, trang bị đầy đủ dụng cụ bổ trợ cơ lực vai.",
      isApproved: true,
    },
    {
      name: "CLB Điền kinh Khuyết tật Hải Phòng",
      location: "Hải Phòng (Miền Bắc)",
      sport: "Điền kinh",
      schedule: "Sáng Thứ 3, 5, Chủ nhật từ 06:30 - 09:00",
      suitableFor: "Mọi dạng khuyết tật vận động nhẹ và vừa",
      contactInfo: "HLV Vũ Văn Thái - 0912233445",
      description:
        "Phong trào chạy bộ xe lăn và điền kinh tốc độ cao. Sân bãi rộng rãi, có hỗ trợ xe lăn chuyên dụng.",
      isApproved: true,
    },
    {
      name: "CLB Bắn cung Trợ năng Thái Nguyên",
      location: "Thái Nguyên (Miền Bắc)",
      sport: "Bắn cung",
      schedule: "Chiều Thứ Bảy & Chủ nhật từ 15:00 - 17:30",
      suitableFor: "Người khuyết tật vận động chi dưới, tay tốt",
      contactInfo: "Quản lý Trần Thị Linh - 0945566778",
      description:
        "Trải nghiệm bộ môn bắn cung tập trung tinh thần cao độ. Hỗ trợ bia ngắm thấp và giá đỡ cung cho VĐV ngồi.",
      isApproved: true,
    },
    {
      name: "CLB Cầu lông Xe lăn Quảng Ninh",
      location: "Quảng Ninh (Miền Bắc)",
      sport: "Cầu lông",
      schedule: "Tối Thứ 3, 5 từ 18:00 - 20:30",
      suitableFor: "Người khuyết tật chân di chuyển bằng xe lăn thể thao",
      contactInfo: "HLV Nguyễn Quang Hải - 0981234567",
      description:
        "Giao lưu cầu lông xe lăn đầy kịch tính, rèn luyện phản xạ và tốc độ di chuyển bánh xe.",
      isApproved: true,
    },
    {
      name: "CLB Bóng bàn NKT Nam Định",
      location: "Nam Định (Miền Bắc)",
      sport: "Bóng bàn",
      schedule: "Sáng Thứ 2, 4, 6 từ 08:30 - 11:00",
      suitableFor: "Khuyết tật vận động, người khiếm thính",
      contactInfo: "Bác Phạm Văn Thành - 0398877665",
      description:
        "Không gian tập luyện ấm cúng với 4 bàn tiêu chuẩn quốc tế, thường xuyên tham gia các giải tỉnh.",
      isApproved: true,
    },
    {
      name: "CLB Bơi lội Trợ năng Bắc Ninh",
      location: "Bắc Ninh (Miền Bắc)",
      sport: "Bơi lội",
      schedule: "Chiều Thứ 3, 5, 7 từ 16:30 - 18:30",
      suitableFor: "Mọi dạng tật có thể xuống nước an toàn",
      contactInfo: "Thầy Lê Văn Hùng - 0973344556",
      description:
        "Bể bơi có lối dốc trợ năng và phao nâng chuyên dụng. Huấn luyện viên kèm cặp 1-1 cực kỳ tận tâm.",
      isApproved: true,
    },

    // Miền Trung
    {
      name: "CLB Điền kinh Khuyết tật Đà Nẵng",
      location: "Đà Nẵng (Miền Trung)",
      sport: "Điền kinh",
      schedule: "Sáng Thứ 3, 5, 7 từ 6:00 - 8:30",
      suitableFor: "Mọi dạng tật có khả năng vận động",
      contactInfo: "Cô Lê Thị Nga - 0912345678",
      description:
        "Cộng đồng chạy bộ và điền kinh xe lăn sôi động bên bờ biển, thường xuyên tổ chức chạy giao lưu.",
      isApproved: true,
    },
    {
      name: "CLB Cầu lông Người khuyết tật Quảng Nam",
      location: "Quảng Nam (Miền Trung)",
      sport: "Cầu lông",
      schedule: "Chiều Thứ 2, 4, 6 từ 15:30 - 17:30",
      suitableFor: "Người khuyết tật vận động chi dưới, khiếm thính",
      contactInfo: "Anh Đinh Văn Trường - 0905123456",
      description:
        "CLB phát triển mạnh phong trào cầu lông phong trào cho người đi xe lăn và đứng đánh.",
      isApproved: true,
    },
    {
      name: "CLB Bơi lội Người khuyết tật Khánh Hòa",
      location: "Khánh Hòa (Miền Trung)",
      sport: "Bơi lội",
      schedule: "Sáng Thứ Bảy & Chủ nhật từ 07:00 - 09:30",
      suitableFor: "Khuyết tật vận động chi, liệt nửa người nhẹ",
      contactInfo: "HLV Nguyễn Minh Tiến - 0905789123",
      description:
        "Bơi lội rèn luyện sức bền và vật lý trị liệu tại hồ bơi nước ấm thành phố Nha Trang.",
      isApproved: true,
    },
    {
      name: "CLB Bóng bàn Người khuyết tật Huế",
      location: "Thừa Thiên Huế (Miền Trung)",
      sport: "Bóng bàn",
      schedule: "Chiều Thứ 3, 5, 7 từ 15:00 - 17:00",
      suitableFor: "Người khuyết tật đứng hoặc ngồi xe lăn",
      contactInfo: "Thầy Võ Hoài Nam - 0888555444",
      description: "Nơi quy tụ nhiều cây vợt cựu trào giàu kinh nghiệm thi đấu Para Games.",
      isApproved: true,
    },
    {
      name: "CLB Cử tạ Trợ năng Nghệ An",
      location: "Nghệ An (Miền Trung)",
      sport: "Cử tạ",
      schedule: "Chiều Thứ 2, 4, 6 từ 14:30 - 17:30",
      suitableFor: "Khuyết tật chi dưới, sức bền thân trên tốt",
      contactInfo: "HLV Phạm Văn Hùng - 0915999888",
      description: "Trang bị ghế đẩy nằm đẩy ngực trợ năng đạt chuẩn thi đấu ParaSport.",
      isApproved: true,
    },
    {
      name: "CLB Bắn cung Thể thao Lâm Đồng",
      location: "Lâm Đồng (Miền Trung)",
      sport: "Bắn cung",
      schedule: "Sáng Chủ nhật từ 08:30 - 11:30",
      suitableFor: "Thương tật chi dưới, khiếm thính",
      contactInfo: "Chị Mai Lan Vy - 0932333444",
      description:
        "Tập luyện trong nhà mát mẻ tại Đà Lạt, nâng cao độ tập trung và cơ bắp bả vai kéo cung.",
      isApproved: true,
    },

    // Miền Nam
    {
      name: "CLB Thể thao Bơi lội NKT TP.HCM",
      location: "TP. Hồ Chí Minh (Miền Nam)",
      sport: "Bơi lội",
      schedule: "Chiều Thứ 3, 5, 7 từ 15:00 - 17:30",
      suitableFor: "Mọi dạng tật có thể tiếp xúc nước",
      contactInfo: "Thầy Trần Minh Hoàng - 0909999999",
      description:
        "Tập luyện tại hồ bơi đạt chuẩn trợ năng tại Quận 11, huấn luyện viên chuyên nghiệp nhiều kinh nghiệm.",
      isApproved: true,
    },
    {
      name: "CLB Bóng bàn xe lăn Cần Thơ",
      location: "Cần Thơ (Miền Nam)",
      sport: "Bóng bàn",
      schedule: "Chiều Thứ 2, 4, 6 từ 15:00 - 17:00",
      suitableFor: "Người khuyết tật chi dưới ngồi xe lăn",
      contactInfo: "Anh Lê Hoàng Nam - 0949112233",
      description:
        "Sinh hoạt tại Nhà thi đấu Đa năng TP Cần Thơ, cơ sở vật chất khang trang, lối đi không rào cản.",
      isApproved: true,
    },
    {
      name: "CLB Cầu lông Người khuyết tật Đồng Nai",
      location: "Đồng Nai (Miền Nam)",
      sport: "Cầu lông",
      schedule: "Tối Thứ Bảy & Chủ nhật từ 18:00 - 20:00",
      suitableFor: "Mọi dạng thương tật vận động",
      contactInfo: "HLV Phùng Quốc Cường - 0918776655",
      description:
        "Cộng đồng giao lưu cầu lông tràn đầy tiếng cười, kết nối xã hội và nâng cao sức khỏe tim mạch.",
      isApproved: true,
    },
    {
      name: "CLB Điền kinh Khuyết tật Bình Dương",
      location: "Bình Dương (Miền Nam)",
      sport: "Điền kinh",
      schedule: "Sáng Thứ 2, 4, 6 từ 05:30 - 07:30",
      suitableFor: "Khuyết tật vận động chi",
      contactInfo: "Anh Vũ Hoàng Hải - 0938445566",
      description: "Địa điểm lý tưởng tập luyện cự ly ngắn và ném đĩa/đẩy tạ xích.",
      isApproved: true,
    },
    {
      name: "CLB Bắn cung Trợ năng Bà Rịa - Vũng Tàu",
      location: "Bà Rịa - Vũng Tàu (Miền Nam)",
      sport: "Bắn cung",
      schedule: "Chiều Thứ 7 từ 15:00 - 18:00",
      suitableFor: "Khuyết tật vận động chi dưới",
      contactInfo: "HLV Trần Minh Đức - 0908889990",
      description:
        "Bắn cung tầm ngắn ngoài trời lộng gió biển, giúp điều hòa hơi thở và tinh thần thư thái.",
      isApproved: true,
    },
    {
      name: "CLB Cử tạ Khuyết tật An Giang",
      location: "An Giang (Miền Nam)",
      sport: "Cử tạ",
      schedule: "Sáng Thứ 3, 5, 7 từ 08:30 - 10:30",
      suitableFor: "Khuyết tật chi dưới cụt/liệt",
      contactInfo: "Thầy Nguyễn Thành Trung - 0917665544",
      description: "Nơi phát triển nhiều tài năng cử tạ trẻ cho khu vực Đồng bằng Sông Cửu Long.",
      isApproved: true,
    },
  ];

  await prisma.organization.createMany({
    data: clubsData,
  });

  // 7. Create Partners/Sponsors (10 partners)
  const partnersData = [
    {
      name: "Tập đoàn Vingroup",
      logoUrl: "/logos/vingroup.svg",
      website: "https://vingroup.net",
    },
    {
      name: "Viettel Group",
      logoUrl: "/logos/viettel.svg",
      website: "https://viettel.com.vn",
    },
    {
      name: "Sữa Vinamilk",
      logoUrl: "/logos/vinamilk.svg",
      website: "https://vinamilk.com.vn",
    },
    {
      name: "Vietcombank",
      logoUrl: "/logos/vietcombank.svg",
      website: "https://vietcombank.com.vn",
    },
    {
      name: "Decathlon VN",
      logoUrl: "/logos/decathlon.svg",
      website: "https://decathlon.vn",
    },
    {
      name: "Herbalife VN",
      logoUrl: "/logos/herbalife.svg",
      website: "https://herbalife.com",
    },
    {
      name: "Unilever Việt Nam",
      logoUrl: "/logos/unilever.svg",
      website: "https://unilever.com.vn",
    },
    {
      name: "Honda Việt Nam",
      logoUrl: "/logos/honda.svg",
      website: "https://honda.com.vn",
    },
    {
      name: "Masan Group",
      logoUrl: "/logos/masan.svg",
      website: "https://masangroup.com",
    },
    {
      name: "FPT Corporation",
      logoUrl: "/logos/fpt.svg",
      website: "https://fpt.com.vn",
    },
  ];

  await prisma.partner.createMany({
    data: partnersData,
  });

  // 8. Create Companion Requests (12 requests)
  const companionRequests = [
    {
      fullName: "Trần Minh Thuận",
      unit: "Công ty Cổ phần Xây dựng Hòa Bình",
      phone: "0909112233",
      email: "thuan.tm@hoabinhcorp.com.vn",
      type: "Tài trợ tài chính",
      message:
        "Chúng tôi muốn tài trợ 50 triệu đồng cho quỹ mua sắm xe lăn thể thao của CLB Điền kinh xe lăn Hà Nội.",
    },
    {
      fullName: "Nguyễn Thị Minh Thư",
      unit: "Cá nhân",
      phone: "0988776655",
      email: "thuminhnguyen@gmail.com",
      type: "Cộng tác viên chuyên môn",
      message:
        "Tôi tốt nghiệp ngành Y học thể thao và muốn đăng ký làm CTV hỗ trợ trị liệu, hướng dẫn khởi động cho các VĐV khuyết tật vào ngày Chủ nhật.",
    },
    {
      fullName: "Phạm Hùng Dũng",
      unit: "Công ty TNHH Thể thao và Đời sống",
      phone: "0931223344",
      email: "dung.ph@sportslife.vn",
      type: "Tài trợ trang thiết bị",
      message:
        "Đơn vị chúng tôi sẵn sàng tài trợ 20 chiếc vợt cầu lông và 10 hộp cầu lông chất lượng cao cho CLB Cầu lông xe lăn Quảng Ninh.",
    },
    {
      fullName: "Lê Thanh Vy",
      unit: "Cá nhân",
      phone: "0945998877",
      email: "vy.lethanh@gmail.com",
      type: "Đồng hành truyền thông",
      message:
        "Tôi là Designer và Content Writer tự do, rất muốn đóng góp thiết kế infographic và viết bài giới thiệu các môn Paralympic cho Creator Lab.",
    },
    {
      fullName: "Vũ Quốc Trung",
      unit: "Quỹ Từ thiện Sen Xanh",
      phone: "0977221100",
      email: "trungvq@senxanhfoundation.org",
      type: "Tài trợ tài chính",
      message:
        "Quỹ muốn đồng hành tài trợ chi phí ăn ở và đi lại cho 5 VĐV bơi lội trẻ xuất sắc tham gia giải vô địch bóng bàn sắp tới.",
    },
    {
      fullName: "Hoàng Kim Long",
      unit: "Trung tâm Thể thao Quận 3",
      phone: "0903445566",
      email: "longhk@q3sports.org.vn",
      type: "Tài trợ địa điểm sinh hoạt",
      message:
        "Chúng tôi muốn tài trợ miễn phí khung giờ tập luyện sáng Thứ 7 hàng tuần tại sân bóng bàn Quận 3 cho các CLB thể thao người khuyết tật.",
    },
    {
      fullName: "Nguyễn Văn Minh",
      unit: "Cá nhân",
      phone: "0911223344",
      email: "minh.nv@gmail.com",
      type: "Cộng tác viên chuyên môn",
      message:
        "Tôi là HLV điền kinh tự do, muốn đăng ký hỗ trợ giáo án tập luyện cự ly ngắn cho VĐV điền kinh xe lăn.",
    },
    {
      fullName: "Trần Thị Thảo",
      unit: "Cty TNHH Thiết bị Trợ Năng Việt",
      phone: "0982334455",
      email: "thao.tt@tronangviet.vn",
      type: "Tài trợ trang thiết bị",
      message:
        "Hỗ trợ bảo dưỡng miễn phí xe lăn và cung cấp đệm ngồi trợ năng chống loét cho 10 VĐV CLB xe lăn Hà Nội.",
    },
    {
      fullName: "Đỗ Tiến Đạt",
      unit: "Công ty Công nghệ FPT",
      phone: "0909334455",
      email: "dat.dt@fpt.com",
      type: "Tài trợ tài chính",
      message:
        "Muốn đồng hành tài trợ giải thưởng hiện kim cho Giải vô địch Bóng bàn NKT quốc gia 2026.",
    },
    {
      fullName: "Lê Quỳnh Anh",
      unit: "Trường Đại học Sư phạm TDTT",
      phone: "0966442211",
      email: "anh.lq@upes.edu.vn",
      type: "Cộng tác viên chuyên môn",
      message:
        "Đăng ký dẫn đoàn 15 sinh viên tình nguyện hỗ trợ tổ chức Giải vô địch Điền kinh NKT quốc gia vào tháng 7.",
    },
    {
      fullName: "Bùi Anh Tuấn",
      unit: "Cá nhân",
      phone: "0971223344",
      email: "tuan.ba@gmail.com",
      type: "Đồng hành truyền thông",
      message:
        "Tôi có kênh Tiktok 100k followers về thể thao và muốn quay video ngắn review về buổi tập luyện của CLB cử tạ NKT để lan tỏa năng lượng tích cực.",
    },
    {
      fullName: "Võ Thị Lan",
      unit: "Khách sạn Green Pearl Nha Trang",
      phone: "0905667788",
      email: "lan.vt@greenpearlnhatrang.com",
      type: "Tài trợ địa điểm sinh hoạt",
      message:
        "Tài trợ phòng nghỉ miễn phí cho đoàn 10 VĐV bơi lội NKT Khánh Hòa trong đợt huấn luyện hè.",
    },
  ];

  await prisma.companionRequest.createMany({
    data: companionRequests,
  });

  // 9. Create Comments & Replies (25 comments)
  const commentsData = [
    {
      content: "Bài viết rất hữu ích và truyền cảm hứng mạnh mẽ!",
      userId: normalUser.id,
      postId: seededPosts[0].id,
    },
    {
      content: "Chúc các anh chị VĐV thi đấu hết mình mang vinh quang về cho nước nhà.",
      userId: seededUsers[3].id,
      postId: seededPosts[0].id,
    },
    {
      content: "Thật tự hào khi Việt Nam có những tấm gương như anh Lê Văn Công.",
      userId: seededUsers[4].id,
      postId: seededPosts[1].id,
    },
    {
      content:
        "Kỹ thuật đẩy ngực của anh Lê Văn Công đạt đẳng cấp thế giới rồi, chúc anh sớm bình phục chấn thương.",
      userId: seededUsers[5].id,
      postId: seededPosts[1].id,
    },
    {
      content:
        "Câu chuyện bơi lội của Tiến Đạt là nguồn cổ vũ lớn cho nhiều người có hoàn cảnh tương tự.",
      userId: seededUsers[6].id,
      postId: seededPosts[2].id,
    },
    {
      content: "Tôi muốn tham gia lớp học AI này ở Hà Nội, không biết sắp tới có tổ chức không ạ?",
      userId: seededUsers[7].id,
      postId: seededPosts[3].id,
    },
    {
      content: "Khóa học Creator Lab này hoàn toàn miễn phí hả admin? Đăng ký ở đâu ạ?",
      userId: seededUsers[9].id,
      postId: seededPosts[3].id,
    },
    {
      content:
        "CLB điền kinh xe lăn Hà Nội hoạt động rất chuyên nghiệp, hy vọng có nhiều nhà tài trợ biết tới.",
      userId: seededUsers[10].id,
      postId: seededPosts[4].id,
    },
    {
      content: "Bài hướng dẫn viết kịch bản rất dễ hiểu, mình sẽ thử áp dụng ngay.",
      userId: seededUsers[11].id,
      postId: seededPosts[5].id,
    },
    {
      content: "Cảm ơn bài viết chia sẻ cực kỳ tâm huyết về cách làm video tránh bi kịch hóa.",
      userId: seededUsers[12].id,
      postId: seededPosts[5].id,
    },
    {
      content: "Cô Nguyễn Thị Hải ném đĩa siêu đỉnh, kỷ lục gia nhiều mùa vàng ASEAN Para Games.",
      userId: seededUsers[13].id,
      postId: seededPosts[6].id,
    },
    {
      content: "Chúc giải vô địch bóng bàn NKT toàn quốc diễn ra thành công tốt đẹp.",
      userId: seededUsers[14].id,
      postId: seededPosts[7].id,
    },
    {
      content: "Bài viết dinh dưỡng hữu ích, rất cần cho các bạn tập xe lăn duy trì cơ lực tay.",
      userId: normalUser.id,
      postId: seededPosts[8].id,
    },
    {
      content: "Micro thu âm loại nào chống ồn tốt nhất khi đang chạy xe lăn vậy tác giả?",
      userId: seededUsers[3].id,
      postId: seededPosts[9].id,
    },
  ];

  for (const c of commentsData) {
    await prisma.comment.create({
      data: c,
    });
  }

  // Create comments in lessons as well
  const lessonComments = [
    {
      content: "Bài tập khởi động rất chi tiết, tập xong thấy khớp vai linh hoạt hẳn.",
      userId: normalUser.id,
      lessonId: seededLessons[0].id,
    },
    {
      content: "HLV hướng dẫn rất từ tốn và dễ tập theo tại nhà.",
      userId: seededUsers[3].id,
      lessonId: seededLessons[0].id,
    },
    {
      content: "Cho em hỏi nếu bị chấn thương khớp cổ tay thì có tập bài này được không ạ?",
      userId: seededUsers[4].id,
      lessonId: seededLessons[1].id,
    },
    {
      content: "Kéo dây kháng lực lực nặng bao nhiêu kg là phù hợp cho người mới bắt đầu ạ?",
      userId: seededUsers[5].id,
      lessonId: seededLessons[3].id,
    },
    {
      content: "Tháp dinh dưỡng thiết kế rất khoa học, dễ cân đối bữa ăn hàng ngày.",
      userId: seededUsers[6].id,
      lessonId: seededLessons[4].id,
    },
    {
      content: "Mic không dây thu âm rõ, âm thanh không bị rè khi gió to.",
      userId: seededUsers[9].id,
      lessonId: seededLessons[8].id,
    },
  ];

  for (const lc of lessonComments) {
    await prisma.comment.create({
      data: lc,
    });
  }

  // 10. Seed Bookmarks & User Progress
  await prisma.bookmark
    .create({
      data: { userId: normalUser.id, postId: seededPosts[1].id },
    })
    .catch(() => {});

  await prisma.bookmark
    .create({
      data: { userId: normalUser.id, postId: seededPosts[3].id },
    })
    .catch(() => {});

  const allCourses = await prisma.course.findMany();
  for (const u of seededUsers) {
    if (u.roleId === userRole!.id) {
      const courseIdx = Math.floor(Math.random() * allCourses.length);
      const progress = Math.floor(Math.random() * 101); // 0-100%
      await prisma.userCourseProgress
        .create({
          data: {
            userId: u.id,
            courseId: allCourses[courseIdx].id,
            progressPct: progress,
            isCompleted: progress === 100,
          },
        })
        .catch(() => {});
    }
  }

  // 11. Seed System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: "maintenance_mode", value: false },
      { key: "contact_email", value: '"contact@paralympic.vn"' },
      { key: "hotline", value: '"1900 1234"' },
    ],
  });

  // 12. Seed Massive Events
  const eventsData = [];
  const eventTypes = [
    "Giải vô địch",
    "Hội thao",
    "Lớp tập huấn",
    "Hội thảo",
    "Giao lưu",
    "Lễ khai mạc",
    "Lễ trao thưởng",
  ];
  const locations = [
    "Sân vận động Mỹ Đình, Hà Nội",
    "Trung tâm HLTT Quốc gia",
    "Nhà thi đấu Phú Thọ, TP.HCM",
    "Cung thể thao Tiên Sơn, Đà Nẵng",
    "Trường Đại học TDTT",
    "Nhà văn hóa Thanh Niên",
  ];

  for (let i = 1; i <= 20; i++) {
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const dateOffset = Math.floor(Math.random() * 60) - 10; // -10 to 50 days from now

    eventsData.push({
      title: `${type} Thể thao người khuyết tật quy mô toàn quốc - Lần thứ ${i}`,
      slug: `su-kien-the-thao-nguoi-khuyet-tat-lan-thu-${i}`,
      description: `Sự kiện quan trọng nhằm thúc đẩy phong trào thể dục thể thao dành cho người khuyết tật. ${type} lần thứ ${i} hứa hẹn mang đến nhiều bất ngờ.`,
      content: `<p>Đây là nội dung chi tiết của sự kiện <strong>${type}</strong> được tổ chức tại ${location}. Sự kiện dự kiến sẽ có sự tham gia của hàng trăm vận động viên đến từ khắp các tỉnh thành trên cả nước.</p><ul><li>Giao lưu thể thao</li><li>Phát triển tài năng trẻ</li><li>Tôn vinh nỗ lực vượt khó</li></ul>`,
      location: location,
      startDate: new Date(new Date().getTime() + dateOffset * 86400000),
      endDate: new Date(new Date().getTime() + (dateOffset + 3) * 86400000),
      status: (dateOffset < 0 ? "COMPLETED" : dateOffset < 5 ? "ONGOING" : "UPCOMING") as any,
      isPublished: true,
    });
  }

  await prisma.event.createMany({
    data: eventsData,
  });

  // 13. Seed Disability Types
  const disabilityTypes = await Promise.all([
    prisma.disabilityType.create({
      data: {
        name: "Khuyết tật vận động chi dưới",
        desc: "Suy giảm chức năng vận động ở hai chi dưới",
      },
    }),
    prisma.disabilityType.create({
      data: {
        name: "Khuyết tật vận động chi trên",
        desc: "Suy giảm chức năng vận động ở chi trên",
      },
    }),
    prisma.disabilityType.create({
      data: { name: "Khiếm thị", desc: "Suy giảm hoặc mất hoàn toàn thị lực" },
    }),
  ]);

  // 14. Seed Sports & Massive News Data
  const sportsData = [
    {
      nameVi: "Điền kinh",
      nameEn: "Athletics",
      slug: "dien-kinh",
      icon: "🏃",
      desc: "Môn điền kinh dành cho người khuyết tật",
    },
    {
      nameVi: "Bơi lội",
      nameEn: "Swimming",
      slug: "boi-loi",
      icon: "🏊",
      desc: "Môn bơi lội dành cho người khuyết tật",
    },
    {
      nameVi: "Cử tạ",
      nameEn: "Powerlifting",
      slug: "cu-ta",
      icon: "🏋️",
      desc: "Cử tạ nằm dành cho người khuyết tật",
    },
    {
      nameVi: "Bóng bàn",
      nameEn: "Table Tennis",
      slug: "bong-ban",
      icon: "🏓",
      desc: "Môn bóng bàn dành cho người khuyết tật",
    },
    {
      nameVi: "Cầu lông",
      nameEn: "Badminton",
      slug: "cau-long",
      icon: "🏸",
      desc: "Môn cầu lông xe lăn",
    },
    {
      nameVi: "Bóng rổ xe lăn",
      nameEn: "Wheelchair Basketball",
      slug: "bong-ro-xe-lan",
      icon: "🏀",
      desc: "Bóng rổ dành cho VĐV đi xe lăn",
    },
    {
      nameVi: "Quần vợt xe lăn",
      nameEn: "Wheelchair Tennis",
      slug: "quan-vot-xe-lan",
      icon: "🎾",
      desc: "Quần vợt dành cho VĐV đi xe lăn",
    },
    {
      nameVi: "Cờ vua",
      nameEn: "Chess",
      slug: "co-vua",
      icon: "♟️",
      desc: "Cờ vua dành cho người khiếm thị và khuyết tật vận động",
    },
    {
      nameVi: "Cờ tướng",
      nameEn: "Xiangqi",
      slug: "co-tuong",
      icon: "🎲",
      desc: "Cờ tướng dành cho người khuyết tật",
    },
    {
      nameVi: "Judo khiếm thị",
      nameEn: "Para Judo",
      slug: "judo-khiem-thi",
      icon: "🥋",
      desc: "Võ Judo dành cho người khiếm thị",
    },
    {
      nameVi: "Boccia",
      nameEn: "Boccia",
      slug: "boccia",
      icon: "🔴",
      desc: "Môn Boccia dành cho người khuyết tật",
    },
    {
      nameVi: "Canoeing",
      nameEn: "Canoeing",
      slug: "canoeing",
      icon: "🚣",
      desc: "Môn Canoeing dành cho người khuyết tật",
    },
    {
      nameVi: "Rowing",
      nameEn: "Rowing",
      slug: "rowing",
      icon: "🛶",
      desc: "Môn Rowing dành cho người khuyết tật",
    },
    {
      nameVi: "Bắn súng",
      nameEn: "Shooting",
      slug: "ban-sung",
      icon: "🎯",
      desc: "Môn bắn súng dành cho người khuyết tật",
    },
    {
      nameVi: "3 môn phối hợp",
      nameEn: "Triathlon",
      slug: "3-mon-phoi-hop",
      icon: "🏊🏃🚴",
      desc: "3 môn phối hợp dành cho người khuyết tật",
    },
  ];

  const createdSports = [];
  const localNewsImages = [
    "/uploads/1781644852147-pcy2n1.jpg",
    "/uploads/1781644855465-frmous.jpg",
    "/uploads/1781644859054-tpt9zs.jpg",
  ];

  for (const s of sportsData) {
    const sport = await prisma.sport.create({
      data: {
        nameVi: s.nameVi,
        nameEn: s.nameEn,
        slug: s.slug,
        icon: s.icon,
        descVi: s.desc,
        descEn: `Para ${s.nameEn}`,
        detailDescVi: `Bao gồm các nội dung thi đấu chuyên nghiệp môn ${s.nameVi}.`,
        detailDescEn: `Professional competition contents for ${s.nameEn}.`,
      },
    });
    createdSports.push(sport);

    // Generate 10 posts for each sport
    const postsData = [];
    for (let i = 1; i <= 10; i++) {
      postsData.push({
        title: `Tin tức nổi bật môn ${s.nameVi} - Cập nhật số ${i}`,
        slug: `tin-tuc-${s.slug}-so-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        content: `<h2>Cập nhật thông tin mới nhất về ${s.nameVi}</h2><p>Đây là bài viết chi tiết số ${i} về quá trình tập luyện, thi đấu và những thành tích nổi bật của các vận động viên tham gia bộ môn <strong>${s.nameVi}</strong>. Chúng tôi sẽ liên tục cập nhật lịch thi đấu, hình ảnh và phân tích chuyên môn.</p><p>Sự nỗ lực không ngừng nghỉ của các VĐV Paralympic luôn là niềm tự hào và nguồn cảm hứng lớn lao cho cộng đồng. Hành trình rèn luyện vượt qua khó khăn để chinh phục đỉnh cao của môn ${s.nameVi} đòi hỏi ý chí kiên cường.</p>`,
        excerpt: `Bản tin vắn tắt số ${i} về các sự kiện và diễn biến quan trọng của bộ môn ${s.nameVi}.`,
        thumbnail: localNewsImages[(i - 1) % localNewsImages.length],
        status: "PUBLISHED" as any,
        publishedAt: new Date(),
        authorId: adminUser.id,
        categoryId: categoryNews.id,
      });
    }
    await prisma.post.createMany({ data: postsData });
  }

  // 14b. Seed SportClassifications (Hạng thương tật)
  console.log("Seeding hạng thương tật (SportClassifications)...");

  const classificationData = [
    {
      sportSlug: "dien-kinh",
      classes: [
        // T/F 11-20
        {
          code: "T11",
          description: "VĐV chạy khiếm thị hoàn toàn (cần người dẫn đường)",
          medicalDesc:
            "Mất hoàn toàn thị lực ở cả hai mắt hoặc chỉ nhận biết được ánh sáng vô hướng.",
          disabilityCriteria: "Thị lực kém hơn LogMAR 2.60.",
          requiresAssistant: true,
        },
        {
          code: "T12",
          description: "VĐV chạy khiếm thị nặng (có thể có người dẫn đường)",
          medicalDesc: "Thị lực giảm nặng hoặc thị trường bị thu hẹp đáng kể.",
          disabilityCriteria:
            "Thị lực từ LogMAR 1.50 đến 2.60 và/hoặc thị trường dưới 10 độ bán kính.",
          requiresAssistant: true,
        },
        { code: "T13", description: "VĐV chạy khiếm thị nhẹ" },
        {
          code: "F11",
          description: "VĐV ném khuyết tật thị lực hoàn toàn",
          medicalDesc: "Mất hoàn toàn thị lực ở cả hai mắt (ném từ vòng ném đứng).",
          disabilityCriteria: "Thị lực kém hơn LogMAR 2.60.",
          requiresAssistant: true,
        },
        {
          code: "F12",
          description: "VĐV ném khuyết tật thị lực nặng",
          medicalDesc: "Thị lực giảm nặng ở cả hai mắt.",
          disabilityCriteria: "Thị lực từ LogMAR 1.50 đến 2.60.",
          requiresAssistant: true,
        },
        { code: "F13", description: "VĐV ném khuyết tật thị lực nhẹ" },
        // T/F 20
        {
          code: "T20",
          description: "VĐV chạy khuyết tật trí tuệ",
          medicalDesc: "Khuyết tật trí tuệ theo tiêu chuẩn của WHO.",
          disabilityCriteria:
            "IQ từ 75 trở xuống, giới hạn đáng kể về hành vi thích ứng trước 18 tuổi.",
        },
        {
          code: "F20",
          description: "VĐV ném khuyết tật trí tuệ",
          medicalDesc: "Khuyết tật trí tuệ theo tiêu chuẩn của WHO.",
          disabilityCriteria: "IQ từ 75 trở xuống, giới hạn hành vi thích ứng.",
        },
        // T/F 31-38
        {
          code: "T31",
          description: "VĐV chạy bại não ảnh hưởng tứ chi nặng (di chuyển xe lăn)",
        },
        {
          code: "T32",
          description: "VĐV chạy bại não ảnh hưởng tứ chi trung bình (di chuyển xe lăn)",
        },
        {
          code: "T33",
          description: "VĐV chạy bại não ảnh hưởng ba chi hoặc liệt nửa người (di chuyển xe lăn)",
        },
        {
          code: "T34",
          description: "VĐV chạy bại não ảnh hưởng hai chi dưới (di chuyển xe lăn)",
        },
        {
          code: "T35",
          description: "VĐV chạy bại não ảnh hưởng thăng bằng khi đứng",
        },
        {
          code: "T36",
          description: "VĐV chạy bại não ảnh hưởng tứ chi mức độ vận động đứng",
        },
        {
          code: "T37",
          description: "VĐV chạy bại não liệt nửa người vận động đứng",
        },
        {
          code: "T38",
          description: "VĐV chạy bại não mức độ nhẹ nhất vận động đứng",
        },
        {
          code: "F31",
          description: "VĐV ném bại não ảnh hưởng tứ chi nặng (ném từ xe lăn)",
        },
        {
          code: "F32",
          description: "VĐV ném bại não ảnh hưởng tứ chi trung bình (ném từ xe lăn)",
        },
        {
          code: "F33",
          description: "VĐV ném bại não ảnh hưởng ba chi hoặc liệt nửa người (ném từ xe lăn)",
        },
        {
          code: "F34",
          description: "VĐV ném bại não ảnh hưởng hai chi dưới (ném từ xe lăn)",
        },
        {
          code: "F35",
          description: "VĐV ném bại não ảnh hưởng thăng bằng khi đứng",
        },
        {
          code: "F36",
          description: "VĐV ném bại não ảnh hưởng tứ chi mức độ vận động đứng",
        },
        {
          code: "F37",
          description: "VĐV ném bại não liệt nửa người vận động đứng",
        },
        {
          code: "F38",
          description: "VĐV ném bại não mức độ nhẹ nhất vận động đứng",
        },
        // T/F 40
        { code: "T40", description: "VĐV chạy thấp bé mức độ nặng (lùn)" },
        { code: "F40", description: "VĐV ném thấp bé mức độ nặng (lùn)" },
        // T/F 41-47
        { code: "T41", description: "VĐV chạy thấp bé mức độ trung bình" },
        {
          code: "T42",
          description: "VĐV chạy liệt/cụt chi dưới không sử dụng chân giả thi đấu đứng",
        },
        { code: "T43", description: "VĐV chạy hai chân giả thi đấu đứng" },
        { code: "T44", description: "VĐV chạy một chân giả thi đấu đứng" },
        { code: "T45", description: "VĐV chạy cụt hai tay" },
        { code: "T46", description: "VĐV chạy cụt một tay mức độ nặng" },
        { code: "T47", description: "VĐV chạy cụt một tay mức độ nhẹ" },
        { code: "F41", description: "VĐV ném thấp bé mức độ trung bình" },
        {
          code: "F42",
          description: "VĐV ném liệt/cụt chi dưới không sử dụng chân giả thi đấu đứng",
        },
        { code: "F43", description: "VĐV ném hai chân giả thi đấu đứng" },
        { code: "F44", description: "VĐV ném một chân giả thi đấu đứng" },
        { code: "F45", description: "VĐV ném cụt hai tay" },
        { code: "F46", description: "VĐV ném cụt một tay mức độ nặng" },
        { code: "F47", description: "VĐV ném cụt một tay mức độ nhẹ" },
        // T51-54
        {
          code: "T51",
          description: "VĐV đua xe lăn liệt tứ chi mức độ nặng (cử động tay hạn chế)",
        },
        {
          code: "T52",
          description: "VĐV đua xe lăn liệt tứ chi mức độ trung bình",
        },
        {
          code: "T53",
          description: "VĐV đua xe lăn liệt chi dưới hoàn toàn, cử động thân mình hạn chế",
        },
        {
          code: "T54",
          description: "VĐV đua xe lăn cử động thân mình và tay bình thường",
        },
        // F51-58
        {
          code: "F51",
          description: "VĐV ném xe lăn liệt tứ chi mức độ rất nặng",
        },
        { code: "F52", description: "VĐV ném xe lăn liệt tứ chi mức độ nặng" },
        {
          code: "F53",
          description: "VĐV ném xe lăn liệt tứ chi cử động tay hạn chế",
        },
        {
          code: "F54",
          description: "VĐV ném xe lăn cử động thân mình hoàn toàn không có",
        },
        {
          code: "F55",
          description: "VĐV ném xe lăn cử động thân mình một phần",
        },
        {
          code: "F56",
          description: "VĐV ném xe lăn cử động thân mình bình thường",
        },
        {
          code: "F57",
          description: "VĐV ném xe lăn có thể đứng lên ném nhưng không vững",
        },
        { code: "F58", description: "VĐV ném xe lăn khuyết tật chi dưới nhẹ" },
      ],
    },
    {
      sportSlug: "boccia",
      classes: [
        {
          code: "BC1",
          description: "VĐV bại não nặng, có thể ném bằng tay hoặc chân (được trợ giúp xe lăn)",
        },
        {
          code: "BC2",
          description: "VĐV bại não ném bằng tay, không cần trợ giúp viên",
        },
        {
          code: "BC3",
          description: "VĐV liệt tứ chi rất nặng, sử dụng thiết bị máng lăn và có trợ giúp viên",
        },
        {
          code: "BC4",
          description: "VĐV khuyết tật vận động không do bại não (teo cơ, liệt tủy) ném bằng tay",
        },
      ],
    },
    {
      sportSlug: "canoeing",
      classes: [
        {
          code: "KL1",
          description: "VĐV chỉ sử dụng tay để chèo xuồng (thân mình và chân bất động)",
        },
        {
          code: "KL2",
          description: "VĐV sử dụng tay và thân mình để chèo xuồng",
        },
        {
          code: "KL3",
          description: "VĐV sử dụng cả tay, thân mình và chân để chèo xuồng",
        },
      ],
    },
    {
      sportSlug: "rowing",
      classes: [
        {
          code: "AS",
          description: "VĐV chỉ sử dụng tay và vai để chèo thuyền (Arms and Shoulders)",
        },
        {
          code: "TA",
          description: "VĐV sử dụng thân mình và tay để chèo thuyền (Trunk and Arms)",
        },
        {
          code: "LTA",
          description: "VĐV sử dụng chân, thân mình và tay để chèo thuyền (Legs, Trunk and Arms)",
        },
      ],
    },
    {
      sportSlug: "ban-sung",
      classes: [
        {
          code: "SH1",
          description: "VĐV bắn súng không cần bệ đỡ súng (khuyết tật chi dưới hoặc chi trên nhẹ)",
        },
        {
          code: "SH2",
          description: "VĐV bắn súng cần bệ đỡ lò xo hỗ trợ súng (khuyết tật chi trên nặng)",
        },
      ],
    },
    {
      sportSlug: "bong-ban",
      classes: [
        {
          code: "1",
          description: "VĐV xe lăn khuyết tật tay cầm vợt và cử động thân mình rất nặng",
        },
        { code: "2", description: "VĐV xe lăn khuyết tật tay cầm vợt nặng" },
        {
          code: "3",
          description: "VĐV xe lăn khuyết tật cử động thân mình nặng",
        },
        {
          code: "4",
          description: "VĐV xe lăn khuyết tật thân mình trung bình",
        },
        {
          code: "5",
          description: "VĐV xe lăn khuyết tật thân mình nhẹ (có thể giữ thăng bằng tốt)",
        },
        {
          code: "6",
          description: "VĐV đứng khuyết tật tay cầm vợt và chân rất nặng",
        },
        {
          code: "7",
          description: "VĐV đứng khuyết tật chân nặng hoặc liệt hai bên",
        },
        {
          code: "8",
          description: "VĐV đứng khuyết tật chân trung bình hoặc cụt một chân",
        },
        {
          code: "9",
          description: "VĐV đứng khuyết tật tay cầm vợt nhẹ hoặc cụt tay không cầm vợt",
        },
        {
          code: "10",
          description: "VĐV đứng khuyết tật chân nhẹ hoặc cụt tay không cầm vợt nhẹ",
        },
        { code: "11", description: "VĐV bóng bàn khuyết tật trí tuệ" },
      ],
    },
    {
      sportSlug: "3-mon-phoi-hop",
      classes: [
        {
          code: "PT1",
          description: "VĐV sử dụng xe lăn (Handcycle phần đạp, xe lăn thể thao phần chạy)",
        },
        {
          code: "PT2",
          description:
            "VĐV khuyết tật vận động nặng thi đấu đứng (sử dụng chân giả/thiết bị hỗ trợ)",
        },
        {
          code: "PT3",
          description: "VĐV khuyết tật vận động trung bình thi đấu đứng",
        },
        {
          code: "PT4",
          description: "VĐV khuyết tật vận động nhẹ thi đấu đứng",
        },
        {
          code: "PT5",
          description:
            "VĐV khuyết tật thị lực/khiếm thị (thi đấu cùng người dẫn đường lái xe đạp đôi)",
        },
      ],
    },
  ];

  for (const cGroup of classificationData) {
    const sport = createdSports.find((sp) => sp.slug === cGroup.sportSlug);
    if (sport) {
      for (const cls of cGroup.classes) {
        await prisma.sportClassification.create({
          data: {
            sportId: sport.id,
            code: cls.code,
            description: cls.description,
            medicalDesc: (cls as any).medicalDesc || null,
            disabilityCriteria: (cls as any).disabilityCriteria || null,
            requiresAssistant: (cls as any).requiresAssistant || false,
          },
        });
      }
    }
  }

  // 15. Seed AthleteProfile & CoachProfile
  const athleteUsers = seededUsers.filter((u) => u.roleId === userRole!.id);
  const createdAthleteProfiles: { profile: any; user: any; sport: any }[] = [];

  // Distribute athletes across ALL 15 sports
  for (let i = 0; i < athleteUsers.length; i++) {
    const sportIdx = i % createdSports.length;
    const sport = createdSports[sportIdx];

    // Assign disability type based on sport
    // Vision sports: Judo, Chess, Xiangqi → Khiếm thị
    // Upper limb sports: Powerlifting, Table Tennis, Shooting → Chi trên
    // Mixed/wide range: Boccia, Triathlon → varied by athlete index
    // Default: rest → Chi dưới
    const visionSports = ["judo-khiem-thi", "co-vua", "co-tuong"];
    const upperSports = ["cu-ta", "bong-ban", "ban-sung"];
    const mixedSports = ["boccia", "3-mon-phoi-hop"];
    let disabilityIdx = 0; // default: Khuyết tật vận động chi dưới
    if (visionSports.includes(sport.slug))
      disabilityIdx = 2; // Khiếm thị
    else if (upperSports.includes(sport.slug))
      disabilityIdx = 1; // Chi trên
    else if (mixedSports.includes(sport.slug)) disabilityIdx = i % 3; // Varied for mixed-suitability sports

    // Get sport classification for this athlete (pick one matching their sport)
    const sportClasses = await prisma.sportClassification.findMany({
      where: { sportId: sport.id },
    });
    const randomClass = sportClasses.length > 0 ? sportClasses[i % sportClasses.length] : null;

    // Pick an organization/club for 40% of athletes
    const orgs = await prisma.organization.findMany();
    const randomOrg = orgs.length > 0 && Math.random() > 0.6 ? orgs[i % orgs.length] : null;

    const socialSlugs = ["vandongvien", "paralympic.vn", "thethao", "khuyettat", "parasports"];
    const profile = await prisma.athleteProfile.create({
      data: {
        userId: athleteUsers[i].id,
        sportId: sport.id,
        disabilityId: disabilityTypes[disabilityIdx].id,
        classificationId: randomClass?.id || null,
        organizationId: randomOrg?.id || null,
        achievements: `Huy chương tại giải ${sport.nameVi}`,
        rank: i + 1,
        active: true,
        facebookUrl:
          Math.random() > 0.4
            ? `https://facebook.com/${socialSlugs[i % socialSlugs.length]}.${athleteUsers[i].fullName?.replace(/\s/g, "").substring(0, 10) || "athlete"}`
            : null,
        zaloUrl:
          Math.random() > 0.6
            ? `https://zalo.me/${athleteUsers[i].phoneNumber || "0912345678"}`
            : null,
        tiktokUrl:
          Math.random() > 0.5
            ? `https://tiktok.com/@para_${sport.slug.replace(/-/g, "_")}_${i}`
            : null,
      },
    });
    createdAthleteProfiles.push({ profile, user: athleteUsers[i], sport });
  }

  const athlete = createdAthleteProfiles[0].profile;

  // Coach profiles: 1 per sport (first 8 sports get coaches for broader coverage)
  const coachSpecialties = [
    "Kỹ thuật chạy và nhảy",
    "Kỹ thuật bơi lội",
    "Cử tạ & sức mạnh",
    "Chiến thuật bóng bàn",
    "Chiến thuật cầu lông",
    "Bóng rổ xe lăn",
    "Tennis xe lăn",
    "Cờ vua - Khiếm thị",
  ];
  for (let i = 0; i < Math.min(8, createdSports.length); i++) {
    const coachUser = seededUsers.find((u) => u.email === `coach${i + 1}@paralympic.vn`);
    if (coachUser) {
      await prisma.coachProfile.create({
        data: {
          userId: coachUser.id,
          sportId: createdSports[i].id,
          experienceYears: 10 + i * 2,
          achievements: `HLV ${createdSports[i].nameVi} - Kinh nghiệm ${10 + i * 2} năm`,
          specialty: coachSpecialties[i] || `HLV chuyên ngành ${createdSports[i].nameVi}`,
          certificateUrl: `/uploads/certificates/coach_${i + 1}_cert.pdf`,
          facebookUrl: `https://facebook.com/coach.${createdSports[i].slug.replace(/-/g, ".")}`,
          zaloUrl:
            Math.random() > 0.5
              ? `https://zalo.me/09${String(10000000 + i * 123456).substring(0, 8)}`
              : null,
          isVerified: i < 5, // First 5 coaches are verified
        },
      });
    }
  }

  // Also create coach for instructorUser
  await prisma.coachProfile.create({
    data: {
      userId: instructorUser.id,
      sportId: createdSports[0].id,
      experienceYears: 15,
      achievements: "Huấn luyện viên xuất sắc năm 2022",
      specialty: "Kỹ thuật chạy & huấn luyện thể lực",
      certificateUrl: "/uploads/certificates/instructor_cert.pdf",
      facebookUrl: "https://facebook.com/coach.instructor",
      isVerified: true,
    },
  });

  // Create a Tournament
  const tournament1 = await prisma.tournament.create({
    data: {
      name: "Giải Vô địch Thể thao Người khuyết tật Toàn quốc 2026",
      slug: "giai-vo-dich-the-thao-nguoi-khuyet-tat-toan-quoc-2026",
      startDate: new Date("2026-10-15T00:00:00Z"),
      endDate: new Date("2026-10-25T00:00:00Z"),
      location: "Hà Nội",
      status: "UPCOMING",
    },
  });

  const tournament2 = await prisma.tournament.create({
    data: {
      name: "Đại hội Thể thao Đông Nam Á ASEAN Para Games 14",
      slug: "asean-para-games-14",
      startDate: new Date("2026-01-15T00:00:00Z"),
      endDate: new Date("2026-01-25T00:00:00Z"),
      location: "Bangkok, Thái Lan",
      status: "COMPLETED",
    },
  });

  // 16. Seed Match & Ranking
  // Seed a full Bracket for tournament1 (Điền kinh)
  const t1 = tournament1.id;
  const s1 = createdSports[0].id; // Điền kinh
  // Get athlete PROFILES (not users) for the bracket matches
  const bracketAthletes = createdAthleteProfiles
    .filter((ap) => ap.profile.sportId === s1)
    .slice(0, 8);
  // Fallback: if not enough athletes in sport 0, use first 8 athletes
  const matchProfiles =
    bracketAthletes.length >= 8 ? bracketAthletes : createdAthleteProfiles.slice(0, 8);

  // Chung kết (Final) - 1 match
  const finalP1 = matchProfiles[0];
  const finalP2 = matchProfiles[4];
  const finalMatch = await prisma.match.create({
    data: {
      title: "Chung kết - Đơn Nữ Điền kinh",
      sportId: s1,
      tournamentId: t1,
      startTime: new Date("2026-10-18T09:00:00Z"),
      location: "Sân vận động Mỹ Đình",
      status: "SCHEDULED",
      round: "Chung kết",
      participants: [
        {
          id: finalP1.profile.id,
          name: finalP1.user.fullName,
          athleteProfileId: finalP1.profile.id,
          score: 0,
        },
        {
          id: finalP2.profile.id,
          name: finalP2.user.fullName,
          athleteProfileId: finalP2.profile.id,
          score: 0,
        },
      ],
    },
  });

  // Bán kết (Semi Finals) - 2 matches
  const semis = [];
  for (let i = 0; i < 2; i++) {
    const winner1 = matchProfiles[i * 4]; // Winner of Q1 / Q3
    const winner2 = matchProfiles[i * 4 + 2]; // Winner of Q2 / Q4
    const sMatch = await prisma.match.create({
      data: {
        title: `Bán kết ${i + 1} - Đơn Nữ Điền kinh`,
        sportId: s1,
        tournamentId: t1,
        startTime: new Date("2026-10-16T14:00:00Z"),
        location: "Sân vận động Mỹ Đình",
        status: "COMPLETED",
        round: "Bán kết",
        result: "3 - 2",
        nextMatchId: finalMatch.id,
        participants: [
          {
            id: winner1.profile.id,
            name: winner1.user.fullName,
            athleteProfileId: winner1.profile.id,
            score: 3,
            isWinner: true,
          },
          {
            id: winner2.profile.id,
            name: winner2.user.fullName,
            athleteProfileId: winner2.profile.id,
            score: 2,
            isWinner: false,
          },
        ],
      },
    });
    semis.push(sMatch);
  }

  // Tứ kết (Quarter Finals) - 4 matches
  const quarters = [];
  for (let i = 0; i < 4; i++) {
    const p1 = matchProfiles[i * 2];
    const p2 = matchProfiles[i * 2 + 1];
    const qMatch = await prisma.match.create({
      data: {
        title: `Tứ kết ${i + 1} - Đơn Nữ Điền kinh`,
        sportId: s1,
        tournamentId: t1,
        startTime: new Date("2026-10-15T09:00:00Z"),
        location: "Sân vận động Mỹ Đình",
        status: "COMPLETED",
        round: "Tứ kết",
        result: "2 - 1",
        nextMatchId: semis[Math.floor(i / 2)].id,
        participants: [
          {
            id: p1.profile.id,
            name: p1.user.fullName,
            athleteProfileId: p1.profile.id,
            score: 2,
            isWinner: true,
          },
          {
            id: p2.profile.id,
            name: p2.user.fullName,
            athleteProfileId: p2.profile.id,
            score: 1,
            isWinner: false,
          },
        ],
      },
    });
    quarters.push(qMatch);
  }

  // Generate some Group stage matches to test
  const firstTwoProfiles = createdAthleteProfiles.slice(0, 2);
  for (let i = 1; i <= 3; i++) {
    await prisma.match.create({
      data: {
        title: `Vòng bảng Bảng A - Môn ${createdSports[0].nameVi}`,
        sportId: createdSports[0].id,
        tournamentId: tournament2.id,
        startTime: new Date(new Date().getTime() + i * 86400000),
        location: "Trung tâm Thể thao Quốc gia",
        status: "SCHEDULED",
        round: "Vòng bảng",
        participants: [
          {
            id: firstTwoProfiles[0].profile.id,
            name: firstTwoProfiles[0].user.fullName,
            athleteProfileId: firstTwoProfiles[0].profile.id,
            score: 0,
          },
          {
            id: firstTwoProfiles[1].profile.id,
            name: firstTwoProfiles[1].user.fullName,
            athleteProfileId: firstTwoProfiles[1].profile.id,
            score: 0,
          },
        ],
      },
    });
  }

  // Seed multiple rankings for the tournaments to show participants
  const allAthletes = await prisma.athleteProfile.findMany();
  for (let i = 0; i < allAthletes.length; i++) {
    const athlete = allAthletes[i];
    await prisma.ranking.create({
      data: {
        sportId: athlete.sportId, // Use athlete's actual sport, not derived index
        athleteId: athlete.id,
        tournamentId: i % 2 === 0 ? tournament1.id : tournament2.id,
        rank: (i % 20) + 1,
        points: 1200 - i * 50,
      },
    });
  }

  // Connect athletes to tournaments (many-to-many)
  console.log("Connecting athletes to tournaments...");
  for (const ap of createdAthleteProfiles) {
    const tournament =
      ap.sport.slug === "dien-kinh" || ap.sport.slug === "boi-loi" || ap.sport.slug === "cu-ta"
        ? tournament1
        : tournament2;
    // 60% chance to connect each athlete
    if (Math.random() > 0.4) {
      await prisma.tournament
        .update({
          where: { id: tournament.id },
          data: { athletes: { connect: { id: ap.profile.id } } },
        })
        .catch(() => {});
    }
  }

  // 17. Seed Quiz & Questions
  const allLessons = await prisma.lesson.findMany();
  if (allLessons.length > 0) {
    const quiz = await prisma.quiz.create({
      data: {
        title: "Trắc nghiệm: Kỹ năng khởi động cơ bản",
        lessonId: allLessons[0].id,
      },
    });

    await prisma.question.createMany({
      data: [
        {
          quizId: quiz.id,
          content: "Tại sao cần khởi động kỹ trước khi tập luyện?",
          options: [
            "Để làm nóng cơ bắp",
            "Để giảm nguy cơ chấn thương",
            "Cả hai đáp án trên",
            "Không cần thiết",
          ],
          correctOption: 2,
          explanation:
            "Khởi động giúp làm nóng cơ thể và chuẩn bị cho các khớp hoạt động linh hoạt, giảm chấn thương.",
        },
        {
          quizId: quiz.id,
          content: "Thời gian khởi động lý tưởng là bao lâu?",
          options: ["1-2 phút", "5-10 phút", "30 phút", "1 giờ"],
          correctOption: 1,
          explanation: "Khởi động từ 5 đến 10 phút là thời gian phù hợp nhất.",
        },
      ],
    });
  }

  // 18. Seed Creator Lab (DocumentTopic, Document, DocumentAttachment, CapcutTemplate)
  console.log("Seeding Creator Lab (Topics, Documents, Capcut)...");

  const topic1 = await prisma.documentTopic.create({
    data: {
      name: "Y học thể thao người khuyết tật",
      slug: "y-hoc-the-thao-nkt",
      description:
        "Các bài viết chuyên sâu về phục hồi chức năng, phòng ngừa chấn thương cơ khớp và chăm sóc y tế đặc thù cho vận động viên khuyết tật.",
    },
  });

  const topic2 = await prisma.documentTopic.create({
    data: {
      name: "Luật thi đấu & Phân hạng thương tật",
      slug: "luat-thi-dau-phan-hang",
      description:
        "Văn bản luật thi đấu Paralympic chính thức và cẩm nang hướng dẫn phân hạng thương tật (IPC Classification) cho VĐV.",
    },
  });

  const topic3 = await prisma.documentTopic.create({
    data: {
      name: "Cẩm nang truyền thông xã hội cho VĐV",
      slug: "cam-nang-truyen-thong",
      description:
        "Hướng dẫn xây dựng hình ảnh cá nhân, kỹ năng kể chuyện (storytelling) và làm nội dung số truyền cảm hứng trên mạng xã hội.",
    },
  });

  // Doc 1
  const doc1 = await prisma.document.create({
    data: {
      title: "Phòng ngừa chấn thương khớp vai cho VĐV đua xe lăn",
      slug: "phong-ngua-chan-thuong-khop-vai-cho-vdv-dua-xe-lan",
      content:
        "Tài liệu hướng dẫn chi tiết các bài tập kéo giãn, tăng sức bền nhóm cơ chóp xoay (rotator cuff) nhằm giảm thiểu hội chứng đau vai do đẩy xe lăn cường độ cao.",
      topicId: topic1.id,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=600",
      isPublic: true,
    },
  });

  await prisma.documentAttachment.create({
    data: {
      documentId: doc1.id,
      fileName: "Prevention_Shoulder_Injuries_Wheelchair_Athletes.pdf",
      fileUrl: "/uploads/documents/Prevention_Shoulder_Injuries_Wheelchair_Athletes.pdf",
      fileType: "application/pdf",
    },
  });

  // Doc 2
  const doc2 = await prisma.document.create({
    data: {
      title:
        "Luật thi đấu Điền kinh Paralympic Thế giới (Bản dịch tóm tắt cho hạng thương tật Bại não)",
      slug: "luat-thi-dau-dien-kinh-paralympic-ban-dich-tom-tat",
      content:
        "Bản dịch rút gọn luật thi đấu điền kinh Para-athletics dành cho các hạng thương tật chạy/nhảy từ T35 đến T38 (bại não thể co cứng và phối hợp vận động).",
      topicId: topic2.id,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600",
      isPublic: true,
    },
  });

  await prisma.documentAttachment.create({
    data: {
      documentId: doc2.id,
      fileName: "World_Para_Athletics_Rules_T35_T38_Summary.pdf",
      fileUrl: "/uploads/documents/World_Para_Athletics_Rules_T35_T38_Summary.pdf",
      fileType: "application/pdf",
    },
  });

  // Doc 3
  const doc3 = await prisma.document.create({
    data: {
      title: "Hướng dẫn kỹ thuật và quy định sử dụng máng lăn trong Boccia hạng BC3",
      slug: "huong-dan-ky-thuat-su-dung-mang-lan-boccia-bc3",
      content:
        "Quy định chính thức về kích thước máng lăn, luật cho phép người hỗ trợ máng lăn (Sport Assistant) và cách kiểm tra thiết bị trước trận đấu.",
      topicId: topic2.id,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600",
      isPublic: true,
    },
  });

  await prisma.documentAttachment.create({
    data: {
      documentId: doc3.id,
      fileName: "Boccia_Rules_BC3_Guide.pdf",
      fileUrl: "/uploads/documents/Boccia_Rules_BC3_Guide.pdf",
      fileType: "application/pdf",
    },
  });

  // Doc 4
  const doc4 = await prisma.document.create({
    data: {
      title: "Bộ cẩm nang truyền thông xã hội tích cực dành cho VĐV khuyết tật",
      slug: "bo-cam-nang-truyen-thong-xa-hoi-vdv-khuyet-tat",
      content:
        "Tài liệu hướng dẫn VĐV xây dựng hình ảnh cá nhân, tương tác với người hâm mộ và cách truyền tải câu chuyện vượt khó mà không rơi vào lối mòn thương hại hóa.",
      topicId: topic3.id,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=600",
      isPublic: true,
    },
  });

  await prisma.documentAttachment.create({
    data: {
      documentId: doc4.id,
      fileName: "Social_Media_Guide_Para_Athletes.pdf",
      fileUrl: "/uploads/documents/Social_Media_Guide_Para_Athletes.pdf",
      fileType: "application/pdf",
    },
  });

  // Seed Capcut Templates
  await prisma.capcutTemplate.createMany({
    data: [
      {
        title: "Mẫu video tập luyện tạo động lực",
        description:
          "Mẫu video nhịp điệu nhanh, chuyển cảnh đồng bộ theo nhịp đẩy tạ hoặc chuyển động của xe lăn truyền động lực mạnh mẽ.",
        capcutLink: "https://www.capcut.com/t/Zs8X_Motivation_Template/",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=600",
      },
      {
        title: "Mẫu giới thiệu chân dung VĐV",
        description:
          "Mẫu video giới thiệu chuyên nghiệp hiển thị Tên, Bộ môn, Phân hạng thương tật và các thành tích nổi bật của VĐV khuyết tật.",
        capcutLink: "https://www.capcut.com/t/Zs8Y_Profile_Template/",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=600",
      },
      {
        title: "Mẫu kể chuyện câu chuyện vượt khó",
        description:
          "Mẫu video hiển thị phụ đề trợ năng rõ ràng, nhịp điệu chậm rãi phù hợp để chèn giọng thuyết minh kể câu chuyện cá nhân.",
        capcutLink: "https://www.capcut.com/t/Zs8Z_Storytelling_Template/",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600",
      },
      {
        title: "Bơi — swimming 01",
        description: "Bơi",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHea9h/",
        thumbnailUrl: "/assets/capcut/capcut-swimming.jpg",
      },
      {
        title: "Bơi — swimming 02",
        description: "Bơi",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHeheL/",
        thumbnailUrl: "/assets/capcut/capcut-swimming.jpg",
      },
      {
        title: "Cử tạ — WORKOUT",
        description: "Cử tạ",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHwujk/",
        thumbnailUrl: "/assets/capcut/capcut-powerlifting.jpg",
      },
      {
        title: "Điền kinh — club",
        description: "Điền kinh — Chạy",
        capcutLink: "https://www.capcut.com/tv2/ZS4euc4Mx/",
        thumbnailUrl: "/assets/capcut/capcut-running.jpg",
      },
      {
        title: "Điền kinh — WORKOUT",
        description: "Điền kinh — Chạy",
        capcutLink: "https://www.capcut.com/tv2/ZS4eu3NJg/",
        thumbnailUrl: "/assets/capcut/capcut-running.jpg",
      },
      {
        title: "Điền kinh — running 01",
        description: "Điền kinh — Chạy",
        capcutLink: "https://www.capcut.com/tv2/ZS4euKnhx/",
        thumbnailUrl: "/assets/capcut/capcut-running.jpg",
      },
      {
        title: "Điền kinh — running 02",
        description: "Điền kinh — Chạy",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHFw2V/",
        thumbnailUrl: "/assets/capcut/capcut-running.jpg",
      },
      {
        title: "Điền kinh — recap",
        description: "Điền kinh — Chạy",
        capcutLink: "https://www.capcut.com/tv2/ZS4eH9m9N/",
        thumbnailUrl: "/assets/capcut/capcut-running.jpg",
      },
      {
        title: "Bắn cung — archery 🏹",
        description: "Bắn cung",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHffda/",
        thumbnailUrl: "/assets/capcut/capcut-archery.jpg",
      },
      {
        title: "Bắn cung — arch_ art",
        description: "Bắn cung",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHBX43/",
        thumbnailUrl: "/assets/capcut/capcut-archery.jpg",
      },
      {
        title: "Mẫu chung — running",
        description: "Mẫu chung",
        capcutLink: "https://www.capcut.com/tv2/ZS4euorNU/",
        thumbnailUrl: "/assets/capcut/capcut-general.jpg",
      },
      {
        title: "Mẫu chung — exercise",
        description: "Mẫu chung",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHBbnC/",
        thumbnailUrl: "/assets/capcut/capcut-general.jpg",
      },
      {
        title: "Mẫu chung — activity",
        description: "Mẫu chung",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHxPCy/",
        thumbnailUrl: "/assets/capcut/capcut-general.jpg",
      },
      {
        title: "Mẫu chung — mẫu 2 tấm",
        description: "Mẫu chung",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHykj8/",
        thumbnailUrl: "/assets/capcut/capcut-general.jpg",
      },
      {
        title: "Mẫu chung — workout2",
        description: "Mẫu chung",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHus3P/",
        thumbnailUrl: "/assets/capcut/capcut-general.jpg",
      },
      {
        title: "Mẫu chung — sự kiện 1",
        description: "Mẫu chung",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHfSyL/",
        thumbnailUrl: "/assets/capcut/capcut-general.jpg",
      },
      {
        title: "Mẫu chung — Just do it",
        description: "Mẫu chung",
        capcutLink: "https://www.capcut.com/tv2/ZS4eHxpVy/",
        thumbnailUrl: "/assets/capcut/capcut-general.jpg",
      },
    ],
  });

  // Seed Email Templates
  await prisma.emailTemplate.createMany({
    data: [
      {
        key: "forgot-password",
        subject: "[Vietnam ParaSports] Khôi phục mật khẩu tài khoản của bạn",
        content:
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;"><h2 style="color: #2b6cb0; text-align: center;">Khôi phục mật khẩu</h2><p>Xin chào <strong>{{fullName}}</strong>,</p><p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu từ tài khoản của bạn tại Vietnam ParaSports.</p><p>Vui lòng click vào liên kết bên dưới để tiến hành thiết lập mật khẩu mới (Liên kết này có hiệu lực trong vòng 15 phút):</p><div style="text-align: center; margin: 30px 0;"><a href="{{resetLink}}" style="background: linear-gradient(to right, #3182ce, #4c51bf); color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Đặt lại mật khẩu</a></div><p style="font-size: 12px; color: #718096;">Nếu bạn không yêu cầu thay đổi mật khẩu này, bạn có thể an tâm bỏ qua email này.</p><hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" /><p style="font-size: 12px; color: #a0aec0; text-align: center;">© Vietnam ParaSports - Vì sự phát triển của Thể thao Người khuyết tật Việt Nam</p></div>',
        variables: JSON.stringify(["fullName", "resetLink"]),
      },
      {
        key: "welcome",
        subject: "[Vietnam ParaSports] Chào mừng bạn tham gia hệ thống",
        content:
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;"><h2 style="color: #2b6cb0; text-align: center;">Chào mừng thành viên mới</h2><p>Xin chào <strong>{{fullName}}</strong>,</p><p>Cảm ơn bạn đã đăng ký tài khoản thành công tại Vietnam ParaSports - Cổng thông tin hỗ trợ và thúc đẩy phong trào Thể thao Paralympic Việt Nam.</p><p>Hãy cùng đồng hành và tiếp sức cho các vận động viên vượt lên nghịch cảnh!</p><hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" /><p style="font-size: 12px; color: #a0aec0; text-align: center;">© Vietnam ParaSports - Vì sự phát triển của Thể thao Người khuyết tật Việt Nam</p></div>',
        variables: JSON.stringify(["fullName"]),
      },
    ],
  });

  // 19. Seed SubTournaments
  console.log("Seeding SubTournaments...");
  const subTournaments = [];
  for (let i = 0; i < 4; i++) {
    const sport = createdSports[i];
    const st = await prisma.subTournament.create({
      data: {
        name: `${sport.nameVi} - Giải Vô địch Toàn quốc 2026`,
        tournamentId: tournament1.id,
        sportId: sport.id,
        format: "SINGLE_ELIMINATION",
        participantType: i === 2 ? "TEAM" : "INDIVIDUAL", // Bóng bàn = TEAM
      },
    });
    subTournaments.push(st);
  }
  // SubTournaments for ASEAN Para Games (COMPLETED)
  for (let i = 0; i < 3; i++) {
    const sport = createdSports[i + 4];
    const st = await prisma.subTournament.create({
      data: {
        name: `${sport.nameVi} - ASEAN Para Games 14`,
        tournamentId: tournament2.id,
        sportId: sport.id,
        format: "SINGLE_ELIMINATION",
        participantType: "INDIVIDUAL",
      },
    });
    subTournaments.push(st);
  }

  // 20. Seed AssistantProfiles
  console.log("Seeding AssistantProfiles...");
  const supportAreas = ["MEDICAL", "MOBILITY", "LOGISTICS", "OTHER"];
  const assistantCount = Math.min(25, createdAthleteProfiles.length);
  for (let i = 0; i < assistantCount; i++) {
    const athleteProfile = createdAthleteProfiles[i];
    // Pick a user who isn't an athlete for the assistant role
    const assistantUser = seededUsers.find(
      (u: any) =>
        u.roleId === userRole!.id &&
        !createdAthleteProfiles.some((ap: any) => ap.user.id === u.id) &&
        !createdAthleteProfiles.slice(0, i).some((ap: any) => ap._assignedAssistantId === u.id)
    );
    if (!assistantUser) continue;
    (athleteProfile as any)._assignedAssistantId = assistantUser.id;
    await prisma.assistantProfile.create({
      data: {
        userId: assistantUser.id,
        athleteId: athleteProfile.profile.id,
        supportArea: supportAreas[i % supportAreas.length],
        medicalDesc: `Hỗ trợ ${supportAreas[i % supportAreas.length]} cho VĐV ${athleteProfile.user.fullName}`,
        medicalCertUrl: i < 12 ? `/uploads/certificates/assistant_${i + 1}_medical.pdf` : null,
        facebookUrl:
          Math.random() > 0.5
            ? `https://facebook.com/assistant.${assistantUser.fullName?.replace(/\s/g, ".").substring(0, 15) || "tro-ly"}`
            : null,
        zaloUrl:
          Math.random() > 0.6
            ? `https://zalo.me/${assistantUser.phoneNumber || "0900000000"}`
            : null,
        isVerified: i < 15, // First 15 are verified
      },
    });
  }
  console.log(`  Created ${assistantCount} assistant profiles`);

  // 21. Seed Medals & SocialLinks for COMPLETED tournament
  console.log("Seeding Medals for all sports...");
  for (const sport of createdSports) {
    const sportAthletes = createdAthleteProfiles.filter((ap) => ap.profile.sportId === sport.id);
    if (sportAthletes.length >= 3) {
      const medals = [
        {
          type: "GOLD",
          athlete: sportAthletes[0].profile,
          athleteName: sportAthletes[0].user.fullName,
        },
        {
          type: "SILVER",
          athlete: sportAthletes[1].profile,
          athleteName: sportAthletes[1].user.fullName,
        },
        {
          type: "BRONZE",
          athlete: sportAthletes[2].profile,
          athleteName: sportAthletes[2].user.fullName,
        },
      ];
      for (const m of medals) {
        await prisma.medal.create({
          data: {
            type: m.type,
            year: 2026,
            athleteId: m.athlete.id,
            tournamentId: tournament2.id,
          },
        });
        // Also add athlete achievement
        await prisma.athleteAchievement.create({
          data: {
            athleteId: m.athlete.id,
            tournamentId: tournament2.id,
            medal: m.type,
            result: `${sport.nameVi} - ${m.type === "GOLD" ? "Huy chương Vàng" : m.type === "SILVER" ? "Huy chương Bạc" : "Huy chương Đồng"}`,
            isVerified: true,
          },
        });
      }
    }
  }
  console.log("  Medals created for all 15 sports");

  // Social Links
  console.log("Seeding Social Links...");
  await prisma.socialLink.createMany({
    data: [
      {
        name: "Facebook",
        url: "https://facebook.com/VietnamParaSports",
        icon: "facebook",
        isActive: true,
        order: 1,
      },
      {
        name: "TikTok",
        url: "https://tiktok.com/@vietnamparasports",
        icon: "tiktok",
        isActive: true,
        order: 2,
      },
      {
        name: "YouTube",
        url: "https://youtube.com/@VietnamParaSports",
        icon: "youtube",
        isActive: true,
        order: 3,
      },
      {
        name: "Instagram",
        url: "https://instagram.com/vietnamparasports",
        icon: "instagram",
        isActive: true,
        order: 4,
      },
      {
        name: "Zalo",
        url: "https://zalo.me/vietnamparasports",
        icon: "zalo",
        isActive: true,
        order: 5,
      },
    ],
  });

  // Audit Logs
  console.log("Seeding Audit Logs...");
  const auditActions = [
    "CREATE_POST",
    "UPDATE_POST",
    "DELETE_COMMENT",
    "CREATE_COURSE",
    "APPROVE_TOURNAMENT",
    "UPDATE_ROLE",
    "CREATE_SPORT",
    "DELETE_EVENT",
  ];
  for (let i = 0; i < 20; i++) {
    const adminUser = seededUsers.find((u) => u.email === "admin@paralympic.vn") || seededUsers[0];
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: auditActions[i % auditActions.length],
        entityId: `entity-${i + 1}`,
        details: {
          reason: `Hành động số ${i + 1} - ${auditActions[i % auditActions.length]}`,
          timestamp: new Date().toISOString(),
        },
        ipAddress: `192.168.1.${(i % 254) + 1}`,
      },
    });
  }
  console.log("  Created 20 audit logs");

  // 22. Seed Teams for team sports
  console.log("Seeding Teams...");
  const teamSports = createdSports.filter((s) =>
    ["bong-ro-xe-lan", "rowing", "canoeing", "bong-ban"].includes(s.slug)
  );
  for (const sport of teamSports.slice(0, 2)) {
    const st = subTournaments.find((s: any) => s.sportId === sport.id);
    if (!st) continue;
    const team = await prisma.team.create({
      data: {
        name: `Đội ${sport.nameVi} Việt Nam`,
        sportId: sport.id,
        tournamentId: tournament2.id,
      },
    });
    // Add team members
    const teamAthletes = createdAthleteProfiles.filter((ap) => ap.profile.sportId === sport.id);
    for (let i = 0; i < Math.min(4, teamAthletes.length); i++) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          athleteId: teamAthletes[i].profile.id,
          role: i === 0 ? "CAPTAIN" : "MEMBER",
        },
      });
    }
  }

  console.log("Seeding completed thành công với dữ liệu lớn!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
