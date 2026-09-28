import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { CreateCommissionDto } from "./dto/create-commission.dto";
import { ProcessPayoutDto } from "./dto/process-payout.dto";

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; status?: string; search?: string }) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionWhereInput = {};
    if (status) {
      where.status = status as any;
    }
    if (search) {
      where.athlete = {
        user: { fullName: { contains: search, mode: "insensitive" } },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          athlete: {
            include: {
              user: { select: { fullName: true, id: true } },
            },
          },
          link: { select: { title: true, id: true } },
        },
      }),
      this.prisma.commission.count({ where }),
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

  async findByAthlete(athleteId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionWhereInput = { athleteId };

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          athlete: {
            include: {
              user: { select: { fullName: true, id: true } },
            },
          },
          link: { select: { title: true, id: true } },
        },
      }),
      this.prisma.commission.count({ where }),
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

  async create(data: CreateCommissionDto) {
    // Validate athlete exists
    const athlete = await this.prisma.athleteProfile.findUnique({
      where: { id: data.athleteId },
    });
    if (!athlete) {
      throw new NotFoundException(`Không tìm thấy vận động viên với ID ${data.athleteId}`);
    }

    // Validate link if provided
    if (data.linkId) {
      const link = await this.prisma.affiliateLink.findUnique({
        where: { id: data.linkId },
      });
      if (!link) {
        throw new NotFoundException(`Không tìm thấy liên kết tiếp thị với ID ${data.linkId}`);
      }
    }

    // Validate product if provided
    if (data.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: data.productId },
      });
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID ${data.productId}`);
      }
    }

    const commission = await this.prisma.commission.create({
      data: {
        athleteId: data.athleteId,
        linkId: data.linkId,
        productId: data.productId,
        platform: data.platform,
        orderId: data.orderId,
        orderAmount: data.orderAmount,
        commissionRate: data.commissionRate,
        commissionAmount: data.commissionAmount,
        status: data.status || "PENDING",
        notes: data.notes,
      },
      include: {
        athlete: {
          include: {
            user: { select: { fullName: true, id: true } },
          },
        },
        link: { select: { title: true, id: true } },
      },
    });

    this.logger.log(`Đã tạo hoa hồng #${commission.id} cho vận động viên ${data.athleteId}`);

    return commission;
  }

  async approve(id: string) {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
    });
    if (!commission) {
      throw new NotFoundException(`Không tìm thấy hoa hồng với ID ${id}`);
    }

    const updated = await this.prisma.commission.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
      include: {
        athlete: {
          include: {
            user: { select: { fullName: true, id: true } },
          },
        },
        link: { select: { title: true, id: true } },
      },
    });

    this.logger.log(`Đã duyệt hoa hồng #${id}`);
    return updated;
  }

  async reject(id: string, notes?: string) {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
    });
    if (!commission) {
      throw new NotFoundException(`Không tìm thấy hoa hồng với ID ${id}`);
    }

    const updated = await this.prisma.commission.update({
      where: { id },
      data: {
        status: "REJECTED",
        notes: notes || commission.notes,
      },
      include: {
        athlete: {
          include: {
            user: { select: { fullName: true, id: true } },
          },
        },
        link: { select: { title: true, id: true } },
      },
    });

    this.logger.log(`Đã từ chối hoa hồng #${id}`);
    return updated;
  }

  // ===== PAYOUTS =====

  async getAllPayouts(query: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PayoutWhereInput = {};
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          athlete: {
            include: {
              user: { select: { fullName: true, id: true } },
            },
          },
          commissions: {
            select: {
              id: true,
              orderAmount: true,
              commissionAmount: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.payout.count({ where }),
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

  async getAthletePayouts(athleteId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PayoutWhereInput = { athleteId };

    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          athlete: {
            include: {
              user: { select: { fullName: true, id: true } },
            },
          },
          commissions: {
            select: {
              id: true,
              orderAmount: true,
              commissionAmount: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.payout.count({ where }),
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

  async processPayout(id: string, data: ProcessPayoutDto) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
    });
    if (!payout) {
      throw new NotFoundException(`Không tìm thấy khoản thanh toán với ID ${id}`);
    }

    const validStatuses = ["PROCESSING", "COMPLETED", "FAILED"];
    if (!validStatuses.includes(data.status)) {
      throw new BadRequestException(
        `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(", ")}`
      );
    }

    const updated = await this.prisma.payout.update({
      where: { id },
      data: {
        status: data.status,
        referenceId: data.referenceId ?? payout.referenceId,
        processedAt: data.status === "COMPLETED" ? new Date() : payout.processedAt,
      },
      include: {
        athlete: {
          include: {
            user: { select: { fullName: true, id: true } },
          },
        },
        commissions: {
          select: {
            id: true,
            orderAmount: true,
            commissionAmount: true,
            status: true,
          },
        },
      },
    });

    // Auto-update linked commissions to PAID when payout is completed
    if (data.status === "COMPLETED") {
      await this.prisma.commission.updateMany({
        where: { payoutId: id },
        data: { status: "PAID" },
      });
    }

    this.logger.log(`Đã xử lý khoản thanh toán #${id} với trạng thái ${data.status}`);
    return updated;
  }
}
