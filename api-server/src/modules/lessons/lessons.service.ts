import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { getSignedUrl } from "../../common/utils/security";

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  private resignUrl(url: any): any {
    if (typeof url !== "string") return url;
    if (url.includes("/api/v1/media/view?file=")) {
      try {
        const urlObj = new URL(url, "http://localhost");
        const file = urlObj.searchParams.get("file");
        if (file) {
          return getSignedUrl(decodeURIComponent(file));
        }
      } catch (e) {
        const match = url.match(/file=([^&]+)/);
        if (match && match[1]) {
          return getSignedUrl(decodeURIComponent(match[1]));
        }
      }
    }
    return url;
  }

  private processLessonUrls(lesson: any) {
    if (!lesson) return lesson;
    if (lesson.documentUrl) {
      lesson.documentUrl = this.resignUrl(lesson.documentUrl);
    }
    if (lesson.documents) {
      if (typeof lesson.documents === "string") {
        try {
          const parsed = JSON.parse(lesson.documents);
          if (Array.isArray(parsed)) {
            lesson.documents = parsed.map((url) => this.resignUrl(url));
          }
        } catch (e) {
          // Ignore parse errors
          console.error("Failed to parse documents json", e);
        }
      } else if (Array.isArray(lesson.documents)) {
        lesson.documents = lesson.documents.map((url: any) => this.resignUrl(url));
      }
    }
    return lesson;
  }

  async create(data: any) {
    return this.prisma.lesson.create({ data });
  }

  async findByChapter(chapterId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { chapterId },
      orderBy: { order: "asc" },
    });
    return lessons.map((l) => this.processLessonUrls(l));
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
      },
    });
    return this.processLessonUrls(lesson);
  }

  async findBySlug(slug: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { slug },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
      },
    });
    return this.processLessonUrls(lesson);
  }

  async update(id: string, data: any) {
    return this.prisma.lesson.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }
}
