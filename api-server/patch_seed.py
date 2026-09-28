import re
import sys

def patch_seed():
    filepath = 'C:/Users/ducth/OneDrive/Tài liệu/GitHub/VietNam-Paralympic-Sport/api-server/prisma/seed.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add faker import
    if "import { fakerVI as faker } from '@faker-js/faker';" not in content:
        content = content.replace("import * as bcrypt from 'bcrypt';", "import * as bcrypt from 'bcrypt';\nimport { fakerVI as faker } from '@faker-js/faker';")

    # Replace user generation
    old_user_gen = """
  // Seed 100 additional athlete users
  const extraUsers = [];
  for (let i = 1; i <= 100; i++) {
    extraUsers.push({
      email: `athlete${i}@paralympic.vn`,
      fullName: `Vận động viên ${i}`,
      roleId: userRole!.id,
    });
  }"""
    
    new_user_gen = """
  // Seed 100 additional athlete users with Faker
  const extraUsers = [];
  for (let i = 1; i <= 100; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${lastName} ${firstName}`;
    extraUsers.push({
      email: faker.internet.email({ firstName: toSlug(firstName), lastName: toSlug(lastName), provider: 'paralympic.vn' }),
      fullName,
      roleId: userRole!.id,
    });
  }"""
    
    content = content.replace(old_user_gen, new_user_gen)

    # Replace post generation loop
    old_post_gen = """
    // Generate 50 posts for each sport
    const postsData = [];
    for (let i = 1; i <= 50; i++) {
      postsData.push({
        title: `Tin tức nổi bật môn ${s.nameVi} - Cập nhật số ${i}`,
        slug: `tin-tuc-${s.slug}-so-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        content: `<h2>Cập nhật thông tin mới nhất về ${s.nameVi}</h2><p>Đây là bài viết chi tiết số ${i} về quá trình tập luyện và thi đấu của bộ môn này.</p>`,
        excerpt: `Bản tin vắn tắt số ${i} về các sự kiện và diễn biến quan trọng của bộ môn ${s.nameVi}.`,
        thumbnail: 'https://images.unsplash.com/photo-1574169208507-84376144848b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        status: 'PUBLISHED' as any,
        publishedAt: new Date(),
        authorId: adminUser.id,
        categoryId: categoryNews.id
      });
    }"""

    new_post_gen = """
    // Generate 50 posts for each sport using Faker
    const postsData = [];
    for (let i = 1; i <= 50; i++) {
      const title = faker.lorem.sentence({ min: 5, max: 10 }).replace('.', '') + ` về ${s.nameVi}`;
      postsData.push({
        title,
        slug: toSlug(title) + `-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        content: `<h2>${faker.lorem.sentence()}</h2><p>${faker.lorem.paragraphs({ min: 3, max: 5 }, '<br/>')}</p>`,
        excerpt: faker.lorem.paragraph(),
        thumbnail: faker.image.urlLoremFlickr({ category: 'sports' }),
        status: 'PUBLISHED' as any,
        publishedAt: faker.date.recent({ days: 30 }),
        authorId: adminUser.id,
        categoryId: categoryNews.id
      });
    }"""
    
    content = content.replace(old_post_gen, new_post_gen)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Patch applied.")

if __name__ == '__main__':
    patch_seed()
