import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AffiliateService } from "./affiliate.service";
import { CreateAffiliateLinkDto } from "./dto/create-affiliate-link.dto";
import { UpdateAffiliateLinkDto } from "./dto/update-affiliate-link.dto";

// ──────────────────────────────────────────────
// Protected affiliate management endpoints
// ──────────────────────────────────────────────
@Controller("affiliate")
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  // ── Links ──

  @UseGuards(JwtAuthGuard)
  @Get("links")
  findMyLinks(
    @Request() req: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("platform") platform?: string,
    @Query("isActive") isActive?: string
  ) {
    return this.affiliateService.findMyLinks(req.user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      platform,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post("links")
  createLink(@Request() req: any, @Body() dto: CreateAffiliateLinkDto) {
    return this.affiliateService.createLink(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("links/:id/stats")
  getLinkStats(@Request() req: any, @Param("id") id: string) {
    return this.affiliateService.getLinkStats(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put("links/:id")
  updateLink(@Request() req: any, @Param("id") id: string, @Body() dto: UpdateAffiliateLinkDto) {
    return this.affiliateService.updateLink(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("links/:id")
  @HttpCode(HttpStatus.OK)
  deleteLink(@Request() req: any, @Param("id") id: string) {
    return this.affiliateService.deleteLink(id, req.user.id);
  }

  // ── Earnings ──

  @UseGuards(JwtAuthGuard)
  @Get("earnings")
  getMyEarnings(@Request() req: any) {
    return this.affiliateService.getMyEarnings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("earnings/details")
  getMyEarningsDetail(
    @Request() req: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string
  ) {
    return this.affiliateService.getMyEarningsDetail(req.user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  // ── Admin: list all links across users ──

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Get("admin/links")
  findAllLinks(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("platform") platform?: string,
    @Query("isActive") isActive?: string,
    @Query("search") search?: string
  ) {
    return this.affiliateService.findAllLinks({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      platform,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
      search,
    });
  }

  // ── Payouts ──

  @UseGuards(JwtAuthGuard)
  @Post("payouts/request")
  requestPayout(
    @Request() req: any,
    @Body()
    body: {
      amount: number;
      paymentMethod?: string;
      paymentInfo?: Record<string, any>;
    }
  ) {
    return this.affiliateService.requestPayout(req.user.id, body);
  }
}

// ──────────────────────────────────────────────
// Public redirect endpoint (no auth)
// ──────────────────────────────────────────────
@Controller()
export class AffiliateGoController {
  private readonly logger = new Logger(AffiliateGoController.name);

  constructor(private readonly affiliateService: AffiliateService) {}

  @Get("go/:shortCode")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async goRedirect(
    @Param("shortCode") shortCode: string,
    @Request() req: any,
    @Res() res: Response
  ) {
    const link = await this.affiliateService.getLinkByShortCode(shortCode);

    // Track the click asynchronously (don't block the redirect)
    this.affiliateService.trackClick(link.id, req).catch((err) => {
      this.logger.error(
        `Failed to track click for link ${link.shortCode}: ${err.message}`,
        err.stack
      );
    });

    // Preserve UTM params from the redirect URL query
    const targetUrl = new URL(link.originalUrl);
    const utmParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    for (const param of utmParams) {
      const value = req.query[param];
      if (value) {
        targetUrl.searchParams.set(param, String(value));
      }
    }

    // Also forward the affiliate shortCode as a custom parameter
    targetUrl.searchParams.set("ref", shortCode);

    return res.redirect(HttpStatus.FOUND, targetUrl.toString());
  }
}
