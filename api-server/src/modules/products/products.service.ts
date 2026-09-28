import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

function toSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) {}

  // ── Products ────────────────────────────────────────────────────────

  async findAll(query: {
    page?: number;
    limit?: number;
    categoryId?: string;
    storeId?: string;
    search?: string;
    isFeatured?: string;
    minCommissionRate?: number;
  }) {
    const {
      page = 1,
      limit = 12,
      categoryId,
      storeId,
      search,
      isFeatured,
      minCommissionRate,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (storeId) where.storeId = storeId;
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === "true";
    }
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (minCommissionRate !== undefined && minCommissionRate > 0) {
      where.commissionRate = { gte: minCommissionRate };
    }

    this.logger.log(`Đang truy vấn sản phẩm: page=${page}, limit=${limit}`);

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          store: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
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

  async findBySlug(slug: string) {
    this.logger.log(`Đang tìm sản phẩm theo slug: ${slug}`);
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logoUrl: true,
            bannerUrl: true,
            partnerId: true,
          },
        },
        category: {
          select: { id: true, name: true, slug: true, description: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException("Không tìm thấy sản phẩm");
    }

    return product;
  }

  async create(data: Prisma.ProductCreateInput) {
    const slug = toSlug(data.name);
    const uniqueSlug = await this.generateUniqueProductSlug(slug);

    this.logger.log(`Đang tạo sản phẩm: ${data.name}`);
    return this.prisma.product.create({
      data: { ...data, slug: uniqueSlug },
      include: {
        store: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Không tìm thấy sản phẩm");
    }

    if (typeof data.name === "string" && data.name !== existing.name) {
      const newSlug = toSlug(data.name);
      (data as any).slug = await this.generateUniqueProductSlug(newSlug, id);
    }

    this.logger.log(`Đang cập nhật sản phẩm: ${id}`);
    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        store: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Không tìm thấy sản phẩm");
    }

    this.logger.log(`Đang xoá sản phẩm: ${id}`);
    return this.prisma.product.delete({ where: { id } });
  }

  async findRelated(productId: string, limit: number = 4) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, storeId: true },
    });
    if (!product) return [];

    return this.prisma.product.findMany({
      where: {
        id: { not: productId },
        isActive: true,
        OR: [
          product.categoryId ? { categoryId: product.categoryId } : {},
          { storeId: product.storeId },
        ].filter((c) => Object.keys(c).length > 0),
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  // ── Categories ──────────────────────────────────────────────────────

  async findAllCategories() {
    this.logger.log("Đang truy vấn tất cả danh mục sản phẩm");
    return this.prisma.productCategory.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) {
      throw new NotFoundException("Không tìm thấy danh mục");
    }
    return category;
  }

  async createCategory(data: { name: string; description?: string; imageUrl?: string }) {
    const slug = toSlug(data.name);
    const uniqueSlug = await this.generateUniqueCategorySlug(slug);

    this.logger.log(`Đang tạo danh mục: ${data.name}`);
    return this.prisma.productCategory.create({
      data: { ...data, slug: uniqueSlug },
    });
  }

  async updateCategory(
    id: string,
    data: { name?: string; description?: string; imageUrl?: string }
  ) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException("Không tìm thấy danh mục");
    }

    if (data.name && data.name !== existing.name) {
      const newSlug = toSlug(data.name);
      (data as any).slug = await this.generateUniqueCategorySlug(newSlug, id);
    }

    this.logger.log(`Đang cập nhật danh mục: ${id}`);
    return this.prisma.productCategory.update({ where: { id }, data });
  }

  async removeCategory(id: string) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException("Không tìm thấy danh mục");
    }

    this.logger.log(`Đang xoá danh mục: ${id}`);
    return this.prisma.productCategory.delete({ where: { id } });
  }

  // ── Stores ──────────────────────────────────────────────────────────

  async findAllStores() {
    this.logger.log("Đang truy vấn tất cả cửa hàng");
    return this.prisma.sponsorStore.findMany({
      orderBy: { createdAt: "desc" },
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
    });
  }

  async findStoreBySlug(slug: string) {
    this.logger.log(`Đang tìm cửa hàng theo slug: ${slug}`);
    const store = await this.prisma.sponsorStore.findUnique({
      where: { slug },
      include: {
        partner: { select: { id: true, name: true, logoUrl: true } },
        products: {
          where: { isActive: true },
          take: 12,
          orderBy: { createdAt: "desc" },
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException("Không tìm thấy cửa hàng");
    }

    return store;
  }

  async createStore(data: {
    partnerId: string;
    name: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
  }) {
    const slug = toSlug(data.name);
    const uniqueSlug = await this.generateUniqueStoreSlug(slug);

    this.logger.log(`Đang tạo cửa hàng: ${data.name}`);
    return this.prisma.sponsorStore.create({
      data: { ...data, slug: uniqueSlug },
    });
  }

  async updateStore(
    id: string,
    data: {
      name?: string;
      description?: string;
      logoUrl?: string;
      bannerUrl?: string;
    }
  ) {
    const existing = await this.prisma.sponsorStore.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException("Không tìm thấy cửa hàng");
    }

    if (data.name && data.name !== existing.name) {
      const newSlug = toSlug(data.name);
      (data as any).slug = await this.generateUniqueStoreSlug(newSlug, id);
    }

    this.logger.log(`Đang cập nhật cửa hàng: ${id}`);
    return this.prisma.sponsorStore.update({ where: { id }, data });
  }

  async removeStore(id: string) {
    const existing = await this.prisma.sponsorStore.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException("Không tìm thấy cửa hàng");
    }

    this.logger.log(`Đang xoá cửa hàng: ${id}`);
    return this.prisma.sponsorStore.delete({ where: { id } });
  }

  // ── Slug helpers ────────────────────────────────────────────────────

  private async generateUniqueProductSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await this.prisma.product.findUnique({
        where: { slug },
      });
      if (!existing || (excludeId && existing.id === excludeId)) return slug;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private async generateUniqueCategorySlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await this.prisma.productCategory.findUnique({
        where: { slug },
      });
      if (!existing || (excludeId && existing.id === excludeId)) return slug;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private async generateUniqueStoreSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await this.prisma.sponsorStore.findUnique({
        where: { slug },
      });
      if (!existing || (excludeId && existing.id === excludeId)) return slug;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}
