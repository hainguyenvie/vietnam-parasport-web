import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Param,
  Post,
  Query,
  ForbiddenException,
  UsePipes,
  ValidationPipe,
  Logger,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import * as bcrypt from "bcrypt";
import { Totp } from "../auth/totp";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateAthleteProfileDto } from "./dto/update-athlete-profile.dto";
import { UpdateCoachProfileDto } from "./dto/update-coach-profile.dto";
import { UpdateAssistantProfileDto } from "./dto/update-assistant-profile.dto";
import { ChangePasswordDto, Verify2FADto } from "./dto/change-password.dto";
import { BulkCreateAdminUsersDto, CreateAdminUserDto } from "./dto/create-admin-user.dto";
import { BulkUpdateAdminUserDatesDto, UpdateAdminUserDto } from "./dto/update-admin-user.dto";

// Temporary storage for pending 2FA secrets (5 min expiry)
const pending2FASecrets = new Map<string, { secret: string; expiresAt: number }>();

@Controller("users")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me/stats")
  async getMyStats(@Request() req: any) {
    return this.usersService.getMyStats(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me/activity")
  async getMyActivity(@Request() req: any, @Query("limit") limit?: string) {
    return this.usersService.getMyActivity(req.user.id, limit ? Number(limit) : 10);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Put("me")
  async updateProfile(@Request() req: any, @Body() data: UpdateUserDto) {
    const parsedData: any = { ...data };
    if (data.dob) {
      parsedData.dob = new Date(data.dob);
    }
    const result = await this.usersService.updateProfile(req.user.id, parsedData);
    await this.usersService.createAuditLog(req.user.id, "UPDATE_PROFILE", req.user.id, {
      fullName: data.fullName,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  @Put("me/password")
  async updatePassword(@Request() req: any, @Body() data: ChangePasswordDto) {
    // We need to fetch the full user to get passwordHash
    const user = await this.usersService.findByEmail(req.user.email);
    if (!user || !user.passwordHash) {
      throw new BadRequestException("Invalid user");
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException("Current password does not match");
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);
    await this.usersService.updatePassword(user.id, newHash);
    await this.usersService.createAuditLog(user.id, "CHANGE_PASSWORD", user.id, {});
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("me/2fa/generate")
  async generate2FA(@Request() req: any) {
    const secret = Totp.generateSecret();
    const otpauthUrl = `otpauth://totp/Vietnam%20ParaSports:${encodeURIComponent(req.user.email)}?secret=${secret}&issuer=Vietnam%2520ParaSports`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    // Store secret server-side only (not returned to client)
    pending2FASecrets.set(req.user.id, {
      secret,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    return { qrCodeUrl };
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("me/2fa/verify")
  async verify2FA(@Request() req: any, @Body() body: Verify2FADto) {
    // Retrieve secret from pending store
    const pending = pending2FASecrets.get(req.user.id);
    if (!pending || Date.now() > pending.expiresAt) {
      pending2FASecrets.delete(req.user.id);
      throw new BadRequestException("Mã xác thực đã hết hạn. Vui lòng tạo lại mã.");
    }

    const isValid = Totp.verify(body.token, pending.secret);
    if (!isValid) {
      throw new BadRequestException("Mã xác thực không chính xác.");
    }

    await this.usersService.enable2FA(req.user.id, pending.secret);
    pending2FASecrets.delete(req.user.id);

    await this.usersService.createAuditLog(req.user.id, "ENABLE_2FA", req.user.id, {
      email: req.user.email,
    });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("me/2fa/disable")
  async disable2FA(@Request() req: any) {
    await this.usersService.disable2FA(req.user.id);
    await this.usersService.createAuditLog(req.user.id, "DISABLE_2FA", req.user.id, {
      email: req.user.email,
    });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("me/upgrade-athlete")
  async upgradeToAthlete(
    @Request() req: any,
    @Body("sportId") sportId?: string,
    @Body("organizationId") organizationId?: string
  ) {
    return this.usersService.upgradeToAthlete(req.user.id, sportId, organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("me/upgrade-coach")
  async upgradeToCoach(@Request() req: any) {
    return this.usersService.upgradeToCoach(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Get()
  async findAll(@Query("page") page?: string, @Query("limit") limit?: string) {
    const pageNumber = Math.max(1, parseInt(page || "1", 10));
    const limitNumber = Math.min(500, Math.max(1, parseInt(limit || "20", 10)));
    return this.usersService.findAll(pageNumber, limitNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  @Get("roles")
  getRoles() {
    return this.usersService.getRoles();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @Post("admin")
  async createAdminUser(@Body() data: CreateAdminUserDto) {
    return this.usersService.createAdminUser({
      email: data.email,
      fullName: data.fullName,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @Post("admin/bulk")
  async createAdminUsers(@Body() data: BulkCreateAdminUsersDto) {
    return this.usersService.createAdminUsers(data.users);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @Put(":id")
  async updateAdminUser(@Param("id") id: string, @Body() data: UpdateAdminUserDto) {
    return this.usersService.updateCreatedAt(id, new Date(data.createdAt));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @Post("admin/bulk-dates")
  async bulkUpdateAdminUserDates(@Body() data: BulkUpdateAdminUserDatesDto) {
    return this.usersService.bulkUpdateCreatedAt(data.updates);
  }

  // Profiles
  @Get("athletes/all")
  getAllAthletes(@Query("page") page?: string, @Query("limit") limit?: string) {
    const pageNumber = Math.max(1, parseInt(page || "1", 10));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit || "20", 10)));
    return this.usersService.getAllAthletes(pageNumber, limitNumber);
  }

  // === Public Profile endpoints (no auth) ===

  @Get(":id/profile")
  async getPublicProfile(@Param("id") id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Get(":id/achievements")
  async getUserAchievements(
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.usersService.getUserAchievements(id, page, limit);
  }

  @Get(":id/tournaments")
  async getUserTournaments(@Param("id") id: string) {
    return this.usersService.getUserTournaments(id);
  }

  @Get(":id/clubs")
  async getUserClubs(@Param("id") id: string) {
    return this.usersService.getUserClubs(id);
  }

  @Get(":id/companions")
  async getUserCompanions(@Param("id") id: string) {
    return this.usersService.getUserCompanions(id);
  }

  @Get(":id/sponsors")
  async getUserSponsors(@Param("id") id: string) {
    return this.usersService.getUserSponsors(id);
  }

  // === Auth-guarded profile endpoints ===

  @UseGuards(JwtAuthGuard)
  @Get(":id/athlete-profile")
  async getAthleteProfile(@Request() req: any, @Param("id") id: string) {
    const isAdmin =
      req.user.role === "ADMIN" ||
      req.user.role === "SUPER_ADMIN" ||
      req.user.role?.name === "ADMIN" ||
      req.user.role?.name === "SUPER_ADMIN";
    if (req.user.id !== id && !isAdmin) {
      throw new ForbiddenException("Forbidden profile access");
    }
    return this.usersService.getAthleteProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id/athlete-profile")
  async updateAthleteProfile(
    @Request() req: any,
    @Param("id") id: string,
    @Body() data: UpdateAthleteProfileDto & { profileId?: string }
  ) {
    const isAdmin =
      req.user.role === "ADMIN" ||
      req.user.role === "SUPER_ADMIN" ||
      req.user.role?.name === "ADMIN" ||
      req.user.role?.name === "SUPER_ADMIN";
    if (req.user.id !== id && !isAdmin) {
      throw new ForbiddenException("Forbidden profile update");
    }
    const profileId = data.profileId;
    if (!profileId) {
      throw new BadRequestException("profileId is required");
    }
    const { profileId: _, ...profileData } = data;
    return this.usersService.upsertAthleteProfile(profileId, id, profileData);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/coach-profile")
  async getCoachProfile(@Request() req: any, @Param("id") id: string) {
    const isAdmin =
      req.user.role === "ADMIN" ||
      req.user.role === "SUPER_ADMIN" ||
      req.user.role?.name === "ADMIN" ||
      req.user.role?.name === "SUPER_ADMIN";
    if (req.user.id !== id && !isAdmin) {
      throw new ForbiddenException("Forbidden profile access");
    }
    return this.usersService.getCoachProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id/coach-profile")
  async updateCoachProfile(
    @Request() req: any,
    @Param("id") id: string,
    @Body() data: UpdateCoachProfileDto
  ) {
    const isAdmin =
      req.user.role === "ADMIN" ||
      req.user.role === "SUPER_ADMIN" ||
      req.user.role?.name === "ADMIN" ||
      req.user.role?.name === "SUPER_ADMIN";
    if (req.user.id !== id && !isAdmin) {
      throw new ForbiddenException("Forbidden profile update");
    }
    if (!isAdmin) {
      delete data.isVerified;
    }
    return this.usersService.upsertCoachProfile(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/assistant-profile")
  async getAssistantProfile(@Request() req: any, @Param("id") id: string) {
    const isAdmin =
      req.user.role === "ADMIN" ||
      req.user.role === "SUPER_ADMIN" ||
      req.user.role?.name === "ADMIN" ||
      req.user.role?.name === "SUPER_ADMIN";
    if (req.user.id !== id && !isAdmin) {
      throw new ForbiddenException("Forbidden profile access");
    }
    return this.usersService.getAssistantProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id/assistant-profile")
  async updateAssistantProfile(
    @Request() req: any,
    @Param("id") id: string,
    @Body() data: UpdateAssistantProfileDto
  ) {
    const isAdmin =
      req.user.role === "ADMIN" ||
      req.user.role === "SUPER_ADMIN" ||
      req.user.role?.name === "ADMIN" ||
      req.user.role?.name === "SUPER_ADMIN";
    if (req.user.id !== id && !isAdmin) {
      throw new ForbiddenException("Forbidden profile update");
    }
    if (!isAdmin) {
      delete data.isVerified;
    }
    return this.usersService.upsertAssistantProfile(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Put(":id/role")
  async updateRole(@Request() req: any, @Param("id") id: string, @Body("roleId") roleId: string) {
    const result = await this.usersService.updateRole(id, roleId);
    await this.usersService.createAuditLog(req.user.id, "CHANGE_ROLE", id, {
      roleId,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @Get("admin/stats")
  async getAdminStats(@Request() req: any) {
    this.logger.debug("AdminStats requested by:", req.user?.email);
    try {
      const stats = await this.usersService.getAdminStats();
      return stats;
    } catch (e) {
      this.logger.error("AdminStats Error:", e);
      throw e;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Get("admin/audits")
  async getRecentAudits() {
    return this.usersService.getRecentAudits();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Get("admin/audits/all")
  async getAllAudits(@Query("page") page?: string, @Query("limit") limit?: string) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    return this.usersService.getAllAudits(pageNumber, limitNumber);
  }
}
