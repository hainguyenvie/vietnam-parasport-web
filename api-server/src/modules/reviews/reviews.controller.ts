import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("product/:productId")
  findByProduct(
    @Param("productId") productId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.reviewsService.findByProduct(productId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post("product/:productId")
  create(@Request() req: any, @Param("productId") productId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, productId, dto);
  }

  @Get("product/:productId/rating")
  getRating(@Param("productId") productId: string) {
    return this.reviewsService.getProductRating(productId);
  }
}
