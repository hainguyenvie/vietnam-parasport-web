import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.CommentCreateInput) {
    return this.prisma.comment.create({
      data,
      include: {
        user: { select: { fullName: true, id: true, avatarUrl: true } },
        parent: true,
      },
    });
  }

  async findByPost(postId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Only fetch top-level comments
        isApproved: true,
      },
      include: {
        user: { select: { fullName: true, id: true, avatarUrl: true } },
        replies: {
          where: { isApproved: true },
          include: {
            user: { select: { fullName: true, id: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" }, // Oldest replies first
        },
      },
      orderBy: { createdAt: "desc" }, // Newest comments first
      skip,
      take: limit,
    });
  }

  async findByMatch(matchId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.comment.findMany({
      where: {
        matchId,
        parentId: null, // Only fetch top-level comments
        isApproved: true,
      },
      include: {
        user: { select: { fullName: true, id: true, avatarUrl: true } },
        replies: {
          where: { isApproved: true },
          include: {
            user: { select: { fullName: true, id: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
  }

  async findAll() {
    return this.prisma.comment.findMany({
      include: {
        user: { select: { fullName: true, id: true, avatarUrl: true } },
        post: { select: { title: true, id: true } },
        match: { select: { title: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: string, isApproved: boolean) {
    return this.prisma.comment.update({
      where: { id },
      data: { isApproved },
      include: {
        user: { select: { fullName: true, id: true, avatarUrl: true } },
      },
    });
  }

  async react(id: string, userId: string, type: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) return null;

    const currentReactions: any = comment.reactions || {};
    if (type) {
      currentReactions[userId] = type;
    } else {
      delete currentReactions[userId];
    }

    return this.prisma.comment.update({
      where: { id },
      data: { reactions: currentReactions },
      include: {
        user: { select: { fullName: true, id: true, avatarUrl: true } },
      },
    });
  }

  async updateContent(id: string, userId: string, role: string, newContent: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) return null;

    if (comment.userId !== userId && role !== "SUPER_ADMIN" && role !== "ADMIN") {
      throw new ForbiddenException("You are not authorized to edit this comment");
    }

    const history: any[] = (comment.editHistory as any[]) || [];
    history.push({
      content: comment.content,
      editedAt: new Date().toISOString(),
    });

    return this.prisma.comment.update({
      where: { id },
      data: {
        content: newContent,
        editHistory: history,
      },
      include: {
        user: { select: { fullName: true, id: true, avatarUrl: true } },
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) return null;

    // Only the author or admin can delete
    if (comment.userId === userId || role === "SUPER_ADMIN" || role === "ADMIN") {
      // Delete replies first if any (cascade if not configured in database)
      await this.prisma.comment.deleteMany({
        where: { parentId: id },
      });
      return this.prisma.comment.delete({ where: { id } });
    }
    throw new ForbiddenException("You are not authorized to delete this comment");
  }
}
