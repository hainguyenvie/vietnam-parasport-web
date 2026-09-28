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
  UsePipes,
  ValidationPipe,
  Logger,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreateStoreDto } from "./dto/create-store.dto";

@Controller("products")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  // ── Public product routes ───────────────────────────────────────────

  @Get()
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("categoryId") categoryId?: string,
    @Query("storeId") storeId?: string,
    @Query("search") search?: string,
    @Query("isFeatured") isFeatured?: string,
    @Query("minCommissionRate") minCommissionRate?: string
  ) {
    this.logger.log(
      `GET /products — page=${page}, limit=${limit}, categoryId=${categoryId}, search=${search}`
    );
    return this.productsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      categoryId,
      storeId,
      search,
      isFeatured,
      minCommissionRate: minCommissionRate ? Number(minCommissionRate) : undefined,
    });
  }

  @Get("categories")
  findAllCategories() {
    this.logger.log("GET /products/categories");
    return this.productsService.findAllCategories();
  }

  @Get("categories/:id")
  async findCategoryById(@Param("id") id: string) {
    this.logger.log(`GET /products/categories/${id}`);
    return this.productsService.findCategoryById(id);
  }

  @Get(":id/related")
  findRelated(@Param("id") id: string, @Query("limit") limit?: string) {
    return this.productsService.findRelated(id, limit ? Number(limit) : undefined);
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    this.logger.log(`GET /products/${slug}`);
    return this.productsService.findBySlug(slug);
  }

  // ── Admin product routes ────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post()
  create(@Body() data: CreateProductDto) {
    this.logger.log("POST /products — tạo sản phẩm mới");
    return this.productsService.create(data as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Put(":id")
  update(@Param("id") id: string, @Body() data: UpdateProductDto) {
    this.logger.log(`PUT /products/${id}`);
    return this.productsService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    this.logger.log(`DELETE /products/${id}`);
    return this.productsService.remove(id);
  }

  // ── Admin category routes ───────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post("categories")
  createCategory(@Body() data: CreateCategoryDto) {
    this.logger.log("POST /products/categories");
    return this.productsService.createCategory(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Put("categories/:id")
  updateCategory(@Param("id") id: string, @Body() data: CreateCategoryDto) {
    this.logger.log(`PUT /products/categories/${id}`);
    return this.productsService.updateCategory(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete("categories/:id")
  removeCategory(@Param("id") id: string) {
    this.logger.log(`DELETE /products/categories/${id}`);
    return this.productsService.removeCategory(id);
  }
}

// ── Stores Controller (base path: /stores) ──────────────────────────────

@Controller("stores")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class StoresController {
  private readonly logger = new Logger(StoresController.name);

  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAllStores() {
    this.logger.log("GET /stores");
    return this.productsService.findAllStores();
  }

  @Get(":slug")
  findStoreBySlug(@Param("slug") slug: string) {
    this.logger.log(`GET /stores/${slug}`);
    return this.productsService.findStoreBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post()
  createStore(@Body() data: CreateStoreDto) {
    this.logger.log("POST /stores");
    return this.productsService.createStore(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Put(":id")
  updateStore(@Param("id") id: string, @Body() data: CreateStoreDto) {
    this.logger.log(`PUT /stores/${id}`);
    return this.productsService.updateStore(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id")
  removeStore(@Param("id") id: string) {
    this.logger.log(`DELETE /stores/${id}`);
    return this.productsService.removeStore(id);
  }
}
