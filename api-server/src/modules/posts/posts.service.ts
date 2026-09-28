import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { CacheService, CACHE_TTL } from "../../common/cache/cache.service";

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  async create(data: any) {
    const { categoryId, tagIds, ...rest } = data;
    const createData: any = { ...rest };
    if (categoryId) {
      createData.category = { connect: { id: categoryId } };
    }
    if (tagIds && tagIds.length > 0) {
      createData.tags = { connect: tagIds.map((id: string) => ({ id })) };
    }
    return this.prisma.post.create({ data: createData });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        author: { select: { fullName: true, id: true } },
        category: true,
        tags: true,
      },
    });
  }

  async findPaginated(params: {
    page?: number;
    limit?: number;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }) {
    const { page = 1, limit = 12, where, orderBy } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        include: {
          author: { select: { fullName: true, id: true } },
          category: true,
          tags: true,
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(slug: string) {
    return this.cache.wrap(
      CacheService.keys.postBySlug(slug),
      () =>
        this.prisma.post.findUnique({
          where: { slug },
          include: {
            author: { select: { fullName: true, id: true } },
            category: true,
            tags: true,
            comments: {
              include: { user: { select: { fullName: true, id: true } } },
            },
          },
        }),
      CACHE_TTL.POST_DETAIL
    );
  }

  async update(id: string, data: any) {
    const { categoryId, tagIds, ...rest } = data;
    const updateData: any = { ...rest };
    if (updateData.createdAt) {
      updateData.createdAt = new Date(updateData.createdAt);
    }

    // Auto-set publishedAt when status changes to PUBLISHED
    if (updateData.status === "PUBLISHED") {
      const existing = await this.prisma.post.findUnique({
        where: { id },
        select: { publishedAt: true },
      });
      if (!existing?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    if (categoryId) {
      updateData.category = { connect: { id: categoryId } };
    }
    if (tagIds) {
      updateData.tags = { set: tagIds.map((tid: string) => ({ id: tid })) };
    }

    const post = await this.prisma.post.update({ where: { id }, data: updateData });
    await this.cache.del(CacheService.keys.postBySlug(post.slug));
    return post;
  }

  async bulkUpdateCreatedAt(updates: Array<{ id: string; createdAt: string }>) {
    await this.prisma.$transaction(
      updates.map((item) =>
        this.prisma.post.update({
          where: { id: item.id },
          data: { createdAt: new Date(item.createdAt) },
        })
      )
    );
    return { updated: updates.length };
  }

  async remove(id: string) {
    const post = await this.prisma.post.delete({ where: { id } });
    await this.cache.del(CacheService.keys.postBySlug(post.slug));
    return post;
  }

  async removeMany(ids: string[]) {
    // Lấy danh sách post để xóa cache
    const posts = await this.prisma.post.findMany({
      where: { id: { in: ids } },
      select: { slug: true },
    });

    const result = await this.prisma.post.deleteMany({
      where: { id: { in: ids } },
    });

    // Xóa cache cho từng post
    await Promise.all(posts.map((post) => this.cache.del(CacheService.keys.postBySlug(post.slug))));

    return result;
  }
}
