import { Injectable, Logger, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  async findByProduct(productId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.count({ where: { productId } }),
    ]);

    const avgRating = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      avgRating: avgRating._avg.rating ?? 0,
      totalReviews: total,
    };
  }

  async create(userId: string, productId: string, dto: CreateReviewDto) {
    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) {
      throw new ConflictException("Bạn đã đánh giá sản phẩm này rồi.");
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException("Không tìm thấy sản phẩm.");
    }

    const review = await this.prisma.review.create({
      data: { productId, userId, rating: dto.rating, comment: dto.comment },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    this.logger.log(`Người dùng ${userId} đã đánh giá sản phẩm ${productId}: ${dto.rating} sao`);
    return review;
  }

  async getProductRating(productId: string) {
    const result = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const distribution = await this.prisma.review.groupBy({
      by: ["rating"],
      where: { productId },
      _count: { rating: true },
    });

    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) {
      ratingDist[d.rating] = d._count.rating;
    }

    return {
      avgRating: result._avg.rating ?? 0,
      totalReviews: result._count.rating,
      distribution: ratingDist,
    };
  }
}
