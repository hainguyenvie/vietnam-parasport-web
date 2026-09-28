import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { Request } from "express";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAffiliateLinkDto } from "./dto/create-affiliate-link.dto";
import { UpdateAffiliateLinkDto } from "./dto/update-affiliate-link.dto";
import { CommissionStatus } from "@prisma/client";

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Helper: resolve athleteId from JWT userId
  // ──────────────────────────────────────────────
  private async getAthleteIdByUserId(userId: string): Promise<string> {
    const athlete = await this.prisma.athleteProfile.findFirst({
      where: { userId },
    });
    if (!athlete) {
      throw new NotFoundException(
        "Không tìm thấy hồ sơ vận động viên. Vui lòng tạo hồ sơ VĐV trước."
      );
    }
    return athlete.id;
  }

  // ──────────────────────────────────────────────
  // Helper: generate random shortCode
  // ──────────────────────────────────────────────
  private generateShortCode(): string {
    return crypto.randomBytes(6).toString("base64url").substring(0, 8);
  }

  // ──────────────────────────────────────────────
  // Helper: detect device from user-agent string
  // ──────────────────────────────────────────────
  private detectDevice(userAgent: string): string {
    if (!userAgent) return "unknown";
    const ua = userAgent.toLowerCase();

    // Tablet detection first (tablets often have both mobile and tablet keywords)
    if (/ipad|tablet|playbook|silk|kindle/.test(ua)) {
      return "tablet";
    }

    // Mobile detection
    if (/mobi|android(?!.*tablet)|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/.test(ua)) {
      return "mobile";
    }

    // Desktop / bots
    return "desktop";
  }

  // ──────────────────────────────────────────────
  // findMyLinks
  // ──────────────────────────────────────────────
  async findMyLinks(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      platform?: string;
      isActive?: boolean;
    }
  ) {
    const athleteId = await this.getAthleteIdByUserId(userId);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = { athleteId };

    if (query.platform) {
      where.platform = query.platform;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.affiliateLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          clicks: {
            select: {
              id: true,
              createdAt: true,
              isConverted: true,
              device: true,
              country: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          commissions: {
            select: {
              id: true,
              commissionAmount: true,
              status: true,
              createdAt: true,
              orderAmount: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      }),
      this.prisma.affiliateLink.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ──────────────────────────────────────────────
  // createLink
  // ──────────────────────────────────────────────
  async createLink(userId: string, dto: CreateAffiliateLinkDto) {
    const athleteId = await this.getAthleteIdByUserId(userId);

    // Generate unique shortCode
    let shortCode: string;
    let exists: boolean;
    do {
      shortCode = this.generateShortCode();
      const existing = await this.prisma.affiliateLink.findUnique({
        where: { shortCode },
      });
      exists = !!existing;
    } while (exists);

    const trackingUrl = `/go/${shortCode}`;

    const link = await this.prisma.affiliateLink.create({
      data: {
        athleteId,
        platform: dto.platform,
        originalUrl: dto.originalUrl,
        title: dto.title,
        description: dto.description,
        affiliateCode: dto.affiliateCode,
        commissionRate: dto.commissionRate ?? 0,
        thumbnailUrl: dto.thumbnailUrl,
        productId: dto.productId,
        shortCode,
        trackingUrl,
      },
    });

    this.logger.log(
      `Vận động viên ${athleteId} đã tạo liên kết affiliate: ${shortCode} (${dto.platform})`
    );

    return link;
  }

  // ──────────────────────────────────────────────
  // updateLink
  // ──────────────────────────────────────────────
  async updateLink(id: string, userId: string, dto: UpdateAffiliateLinkDto) {
    const athleteId = await this.getAthleteIdByUserId(userId);

    const link = await this.prisma.affiliateLink.findUnique({
      where: { id },
    });
    if (!link) {
      throw new NotFoundException("Không tìm thấy liên kết affiliate");
    }
    if (link.athleteId !== athleteId) {
      throw new ForbiddenException("Bạn không có quyền chỉnh sửa liên kết này");
    }

    const updated = await this.prisma.affiliateLink.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Vận động viên ${athleteId} đã cập nhật liên kết affiliate: ${link.shortCode}`);

    return updated;
  }

  // ──────────────────────────────────────────────
  // deleteLink
  // ──────────────────────────────────────────────
  async deleteLink(id: string, userId: string) {
    const athleteId = await this.getAthleteIdByUserId(userId);

    const link = await this.prisma.affiliateLink.findUnique({
      where: { id },
    });
    if (!link) {
      throw new NotFoundException("Không tìm thấy liên kết affiliate");
    }
    if (link.athleteId !== athleteId) {
      throw new ForbiddenException("Bạn không có quyền xoá liên kết này");
    }

    await this.prisma.affiliateLink.delete({ where: { id } });

    this.logger.log(`Vận động viên ${athleteId} đã xoá liên kết affiliate: ${link.shortCode}`);

    return { message: "Đã xoá liên kết affiliate thành công" };
  }

  // ──────────────────────────────────────────────
  // getLinkStats
  // ──────────────────────────────────────────────
  async getLinkStats(id: string, userId: string) {
    const athleteId = await this.getAthleteIdByUserId(userId);

    const link = await this.prisma.affiliateLink.findUnique({
      where: { id },
      include: {
        clicks: {
          orderBy: { createdAt: "desc" },
        },
        commissions: {
          orderBy: { createdAt: "desc" },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            salePrice: true,
            currency: true,
            images: true,
          },
        },
      },
    });

    if (!link) {
      throw new NotFoundException("Không tìm thấy liên kết affiliate");
    }
    if (link.athleteId !== athleteId) {
      throw new ForbiddenException("Bạn không có quyền xem thống kê của liên kết này");
    }

    const totalClicks = link.clicks.length;
    const convertedClicks = link.clicks.filter((c) => c.isConverted).length;
    const conversionRate =
      totalClicks > 0 ? Math.round((convertedClicks / totalClicks) * 10000) / 100 : 0;

    const totalCommissionEarned = link.commissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    const clicksByDevice = {
      mobile: link.clicks.filter((c) => c.device === "mobile").length,
      desktop: link.clicks.filter((c) => c.device === "desktop").length,
      tablet: link.clicks.filter((c) => c.device === "tablet").length,
      unknown: link.clicks.filter((c) => c.device === "unknown").length,
    };

    const commissionsByStatus = {
      PENDING: link.commissions.filter((c) => c.status === "PENDING").length,
      CONFIRMED: link.commissions.filter((c) => c.status === "CONFIRMED").length,
      APPROVED: link.commissions.filter((c) => c.status === "APPROVED").length,
      REJECTED: link.commissions.filter((c) => c.status === "REJECTED").length,
      PAID: link.commissions.filter((c) => c.status === "PAID").length,
    };

    return {
      ...link,
      stats: {
        totalClicks,
        convertedClicks,
        conversionRate,
        totalCommissionEarned,
        clicksByDevice,
        commissionsByStatus,
      },
    };
  }

  // ──────────────────────────────────────────────
  // getLinkByShortCode
  // ──────────────────────────────────────────────
  async getLinkByShortCode(shortCode: string) {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { shortCode },
    });
    if (!link) {
      throw new NotFoundException(
        "Không tìm thấy liên kết rút gọn. Vui lòng kiểm tra lại đường dẫn."
      );
    }
    if (!link.isActive) {
      throw new NotFoundException("Liên kết tiếp thị này hiện không hoạt động.");
    }
    return link;
  }

  // ──────────────────────────────────────────────
  // trackClick
  // ──────────────────────────────────────────────
  async trackClick(linkId: string, req: Request) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.ip ??
      req.socket?.remoteAddress ??
      null;

    const userAgent = (req.headers["user-agent"] as string) ?? null;
    const referer = (req.headers["referer"] as string) ?? null;
    const utmSource = (req.query.utm_source as string) ?? null;
    const utmMedium = (req.query.utm_medium as string) ?? null;
    const utmCampaign = (req.query.utm_campaign as string) ?? null;
    const device = this.detectDevice(userAgent ?? "");

    const [click] = await this.prisma.$transaction([
      this.prisma.affiliateClick.create({
        data: {
          linkId,
          ipAddress,
          userAgent,
          referer,
          utmSource,
          utmMedium,
          utmCampaign,
          device,
        },
      }),
      this.prisma.affiliateLink.update({
        where: { id: linkId },
        data: { clickCount: { increment: 1 } },
      }),
    ]);

    this.logger.log(`Click được ghi nhận cho liên kết ${linkId} (device: ${device})`);

    return click;
  }

  // ──────────────────────────────────────────────
  // getMyEarnings
  // ──────────────────────────────────────────────
  async getMyEarnings(userId: string) {
    const athleteId = await this.getAthleteIdByUserId(userId);

    const aggregations = await this.prisma.commission.groupBy({
      by: ["status"],
      where: { athleteId },
      _sum: { commissionAmount: true },
      _count: { id: true },
    });

    const getAmount = (status: string) =>
      aggregations.find((a) => a.status === status)?._sum.commissionAmount ?? 0;

    const totalEarnings = aggregations.reduce((sum, a) => sum + (a._sum.commissionAmount ?? 0), 0);
    const commissionCount = aggregations.reduce((sum, a) => sum + a._count.id, 0);

    return {
      totalEarnings,
      pendingAmount: getAmount("PENDING"),
      approvedAmount: getAmount("APPROVED"),
      paidAmount: getAmount("PAID"),
      commissionCount,
    };
  }

  // ──────────────────────────────────────────────
  // getMyEarningsDetail
  // ──────────────────────────────────────────────
  async getMyEarningsDetail(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ) {
    const athleteId = await this.getAthleteIdByUserId(userId);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = { athleteId };
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          link: {
            select: {
              id: true,
              title: true,
              shortCode: true,
              platform: true,
              thumbnailUrl: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
          payout: {
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.commission.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ──────────────────────────────────────────────
  // requestPayout
  // ──────────────────────────────────────────────
  async requestPayout(
    userId: string,
    data: {
      amount: number;
      paymentMethod?: string;
      paymentInfo?: Record<string, any>;
    }
  ) {
    const athleteId = await this.getAthleteIdByUserId(userId);

    // Ensure there are APPROVED commissions to pay out
    const approvedCommissions = await this.prisma.commission.findMany({
      where: {
        athleteId,
        status: CommissionStatus.APPROVED,
      },
    });

    if (approvedCommissions.length === 0) {
      throw new ConflictException("Bạn chưa có hoa hồng nào được duyệt để yêu cầu thanh toán.");
    }

    const totalApproved = approvedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    const MIN_PAYOUT_AMOUNT = 100_000;
    if (data.amount < MIN_PAYOUT_AMOUNT) {
      throw new ConflictException(
        `Số tiền yêu cầu tối thiểu là ${MIN_PAYOUT_AMOUNT.toLocaleString("vi-VN")} VNĐ.`
      );
    }

    if (data.amount > totalApproved) {
      throw new ConflictException(
        `Số tiền yêu cầu không được vượt quá ${totalApproved.toLocaleString("vi-VN")} VNĐ (tổng hoa hồng đã duyệt).`
      );
    }

    // Check for existing pending payouts
    const pendingPayout = await this.prisma.payout.findFirst({
      where: {
        athleteId,
        status: "PENDING",
      },
    });

    if (pendingPayout) {
      throw new ConflictException(
        "Bạn đã có một yêu cầu thanh toán đang chờ xử lý. Vui lòng chờ kết quả trước khi tạo yêu cầu mới."
      );
    }

    // Calculate commissions to link within the transaction
    let remainingAmount = data.amount;
    const commissionsToLink: string[] = [];

    for (const commission of approvedCommissions) {
      if (remainingAmount <= 0) break;
      remainingAmount -= commission.commissionAmount;
      commissionsToLink.push(commission.id);
    }

    const [payout] = await this.prisma.$transaction(async (tx) => {
      const newPayout = await tx.payout.create({
        data: {
          athleteId,
          amount: data.amount,
          status: "PENDING",
          paymentMethod: data.paymentMethod ?? null,
          paymentInfo: data.paymentInfo ?? undefined,
        },
      });

      await tx.commission.updateMany({
        where: { id: { in: commissionsToLink } },
        data: { payoutId: newPayout.id },
      });

      return [newPayout];
    });

    this.logger.log(
      `Vận động viên ${athleteId} đã yêu cầu thanh toán: ${data.amount.toLocaleString("vi-VN")} VNĐ (${commissionsToLink.length} hoa hồng)`
    );

    return payout;
  }

  // ──────────────────────────────────────────────
  // Admin: findAllLinks (all users)
  // ──────────────────────────────────────────────
  async findAllLinks(query: {
    page?: number;
    limit?: number;
    platform?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.platform) where.platform = query.platform;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      const s = query.search.toLowerCase();
      where.OR = [
        { athlete: { user: { fullName: { contains: s, mode: "insensitive" } } } },
        { athlete: { user: { email: { contains: s, mode: "insensitive" } } } },
        { title: { contains: s, mode: "insensitive" } },
        { shortCode: { contains: s, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.affiliateLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          athlete: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: { select: { clicks: true } },
        },
      }),
      this.prisma.affiliateLink.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
