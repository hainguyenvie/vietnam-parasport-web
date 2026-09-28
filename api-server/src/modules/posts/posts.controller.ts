import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  Request,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { PostsService } from "./posts.service";
import { Prisma } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { BulkUpdatePostDatesDto, CreatePostDto, UpdatePostDto } from "./dto/post.dto";

@Controller("posts")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("categoryId") categoryId?: string,
    @Query("search") search?: string
  ) {
    const where: Prisma.PostWhereInput = { status: "PUBLISHED" };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    return this.postsService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : 10,
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("paginated")
  findPaginated(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("categoryId") categoryId?: string,
    @Query("categorySlug") categorySlug?: string,
    @Query("search") search?: string
  ) {
    const where: Prisma.PostWhereInput = { status: "PUBLISHED" };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    return this.postsService.findPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "EDITOR")
  @Get("admin/all")
  findAllAdmin() {
    return this.postsService.findAll({
      orderBy: { createdAt: "desc" },
    });
  }

  @Get(":slug")
  async findOne(@Param("slug") slug: string) {
    const post = await this.postsService.findOne(slug);
    if (!post) throw new NotFoundException("Post not found");
    return post;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "EDITOR")
  @Post()
  create(@Request() req: any, @Body() data: CreatePostDto) {
    return this.postsService.create({
      ...data,
      author: { connect: { id: req.user.id } },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "EDITOR")
  @Put(":id")
  update(@Param("id") id: string, @Body() data: UpdatePostDto) {
    return this.postsService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "EDITOR")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.postsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "EDITOR")
  @Post("bulk-delete")
  removeMany(@Body() data: { ids: string[] }) {
    return this.postsService.removeMany(data.ids);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "EDITOR")
  @Post("bulk-dates")
  bulkUpdateDates(@Body() data: BulkUpdatePostDatesDto) {
    return this.postsService.bulkUpdateCreatedAt(data.updates);
  }
}
