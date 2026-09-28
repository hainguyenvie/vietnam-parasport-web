import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items.length) {
      throw new BadRequestException("Đơn hàng phải có ít nhất một sản phẩm.");
    }

    // Fetch all products and validate
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, price: true, salePrice: true, stock: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException("Một hoặc nhiều sản phẩm không tồn tại hoặc đã ngừng bán.");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate totals and validate stock
    let totalAmount = 0;
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (item.quantity < 1) {
        throw new BadRequestException(`Số lượng sản phẩm "${product.name}" phải lớn hơn 0.`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm trong kho.`
        );
      }
      const price = product.salePrice ?? product.price;
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      return {
        productId: product.id,
        productName: product.name,
        productPrice: price,
        quantity: item.quantity,
        subtotal,
      };
    });

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddress: dto.shippingAddress,
          phoneNumber: dto.phoneNumber,
          notes: dto.notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: true, slug: true },
              },
            },
          },
        },
      });

      // Decrement stock
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    this.logger.log(
      `Người dùng ${userId} đã tạo đơn hàng #${order.id}: ${totalAmount.toLocaleString("vi-VN")} VNĐ`
    );
    return order;
  }

  async findMyOrders(userId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, images: true, slug: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: true, slug: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Không tìm thấy đơn hàng.");
    }
    if (order.userId !== userId) {
      throw new NotFoundException("Không tìm thấy đơn hàng.");
    }

    return order;
  }
}
