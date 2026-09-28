import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.course.create({ data });
  }

  async findAll() {
    const courses = await this.prisma.course.findMany({
      include: {
        chapters: {
          include: { lessons: { select: { id: true, duration: true } } },
        },
        progresses: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return courses.map((course) => {
      let lessonCount = 0;
      let totalDuration = 0;
      course.chapters.forEach((ch) => {
        lessonCount += ch.lessons.length;
        ch.lessons.forEach((l) => {
          if (l.duration) totalDuration += l.duration;
        });
      });
      return {
        ...course,
        enrolledCount: course.progresses.length,
        lessonCount,
        totalDuration,
      };
    });
  }

  async findOne(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        chapters: {
          include: { lessons: true },
          orderBy: { order: "asc" },
        },
        progresses: { select: { id: true } },
      },
    });

    if (!course) return null;

    let lessonCount = 0;
    let totalDuration = 0;
    course.chapters.forEach((ch) => {
      lessonCount += ch.lessons.length;
      ch.lessons.forEach((l) => {
        if (l.duration) totalDuration += l.duration;
      });
    });

    return {
      ...course,
      enrolledCount: course.progresses.length,
      lessonCount,
      totalDuration,
    };
  }

  async update(id: string, data: any) {
    return this.prisma.course.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.course.delete({ where: { id } });
  }

  private generateSlug(text: string): string {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, "a")
      .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, "e")
      .replace(/i|í|ì|ỉ|ĩ|ị/gi, "i")
      .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, "o")
      .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, "u")
      .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, "y")
      .replace(/đ/gi, "d")
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }

  async fixAllSlugs() {
    const courses = await this.prisma.course.findMany();
    let fixedCourses = 0;
    for (const c of courses) {
      if (c.slug) {
        const cleanSlug = this.generateSlug(c.slug);
        if (cleanSlug !== c.slug) {
          try {
            await this.prisma.course.update({ where: { id: c.id }, data: { slug: cleanSlug } });
            fixedCourses++;
          } catch (e) {
            console.error("Failed to fix course slug", c.id, e);
          }
        }
      }
    }

    const lessons = await this.prisma.lesson.findMany();
    let fixedLessons = 0;
    for (const l of lessons) {
      if (l.slug) {
        const cleanSlug = this.generateSlug(l.slug);
        if (cleanSlug !== l.slug) {
          try {
            await this.prisma.lesson.update({ where: { id: l.id }, data: { slug: cleanSlug } });
            fixedLessons++;
          } catch (e) {
            console.error("Failed to fix lesson slug", l.id, e);
          }
        }
      }
    }

    return { success: true, message: `Fixed ${fixedCourses} courses and ${fixedLessons} lessons.` };
  }
}
