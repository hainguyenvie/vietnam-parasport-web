import { Injectable, UnauthorizedException, BadRequestException, Logger } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { Totp } from "./totp";
import { MailService } from "../mail/mail.service";
import * as crypto from "crypto";
import * as handlebars from "handlebars";

// In-memory refresh token store (fallback when Redis unavailable)
const refreshTokens = new Map<
  string,
  { userId: string; email: string; expiresAt: number; role?: string }
>();

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(48).toString("hex");
  }

  private storeRefreshToken(refreshToken: string, userId: string, email: string, role?: string) {
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    refreshTokens.set(refreshToken, { userId, email, expiresAt, role });
    // Cleanup expired tokens periodically
    if (refreshTokens.size > 10000) {
      const now = Date.now();
      for (const [key, val] of refreshTokens) {
        if (val.expiresAt < now) refreshTokens.delete(key);
      }
    }
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role?.name,
      jti: crypto.randomUUID(),
    };

    const refreshToken = this.generateRefreshToken();
    this.storeRefreshToken(refreshToken, user.id, user.email, user.role?.name);

    return {
      access_token: this.jwtService.sign(payload), // 15min TTL
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role?.name,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const stored = refreshTokens.get(refreshToken);
    if (!stored || stored.expiresAt < Date.now()) {
      refreshTokens.delete(refreshToken);
      throw new UnauthorizedException("Refresh token hết hạn hoặc không hợp lệ");
    }

    // Rotation: invalidate old token, issue new pair
    refreshTokens.delete(refreshToken);

    const payload = {
      email: stored.email,
      sub: stored.userId,
      role: stored.role,
      jti: crypto.randomUUID(),
    };

    const newRefreshToken = this.generateRefreshToken();
    this.storeRefreshToken(newRefreshToken, stored.userId, stored.email, stored.role);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: newRefreshToken,
      expires_in: 900,
    };
  }

  async verifyLogin2FA(email: string, token: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
      return null;
    }
    const isVerified = Totp.verify(token, user.twoFactorSecret);
    if (isVerified) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async register(data: any) {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    let roleName = "USER";
    if (data.role === "COACH") {
      roleName = "INSTRUCTOR";
    }

    const userRole = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!userRole) {
      throw new BadRequestException(`Role ${roleName} not found`);
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          fullName: data.fullName,
          passwordHash: hashedPassword,
          phoneNumber: data.phoneNumber || null,
          dob: data.dob ? new Date(data.dob) : null,
          gender: data.gender || null,
          role: { connect: { id: userRole.id } },
        },
      });

      if (data.role === "ATHLETE") {
        const defaultSport = await tx.sport.findFirst();
        const defaultDisability = await tx.disabilityType.findFirst();
        if (defaultSport && defaultDisability) {
          await tx.athleteProfile.create({
            data: {
              userId: newUser.id,
              sportId: defaultSport.id,
              disabilityId: defaultDisability.id,
            },
          });
        }
      } else if (data.role === "COACH") {
        const defaultSport = await tx.sport.findFirst();
        if (defaultSport) {
          await tx.coachProfile.create({
            data: {
              userId: newUser.id,
              sportId: defaultSport.id,
            },
          });
        }
      } else if (data.role === "ASSISTANT") {
        await tx.assistantProfile.create({
          data: {
            userId: newUser.id,
          },
        });
      }

      return newUser;
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async forgotPassword(email: string, origin: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    // Secure design: return success message even if email is not found to prevent email enumeration
    if (!user) {
      return {
        message: "Nếu email tồn tại trong hệ thống, link khôi phục đã được gửi.",
      };
    }

    // 1. Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 2. Save token to DB
    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        email,
        expiresAt,
      },
    });

    // 3. Load forgot-password email template
    const template = await this.prisma.emailTemplate.findUnique({
      where: { key: "forgot-password" },
    });

    const resetLink = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    let subject = "[Vietnam ParaSports] Khôi phục mật khẩu tài khoản của bạn";
    let htmlContent = `Vui lòng click vào liên kết sau để reset mật khẩu: <a href="${resetLink}">${resetLink}</a>`;

    if (template) {
      const subjectTemplate = handlebars.compile(template.subject);
      const contentTemplate = handlebars.compile(template.content);
      const variables = { fullName: user.fullName, resetLink };
      subject = subjectTemplate(variables);
      htmlContent = contentTemplate(variables);
    }

    // 4. Send email
    await this.mailService.sendMail(email, subject, htmlContent);

    return {
      message: "Nếu email tồn tại trong hệ thống, link khôi phục đã được gửi.",
    };
  }

  async resetPassword(data: any): Promise<{ message: string }> {
    const { email, token, newPassword } = data;

    // 1. Hash incoming token to match with DB stored hashed token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Find valid token
    const storedToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        email,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      throw new BadRequestException("Mã xác thực không hợp lệ hoặc đã hết hạn.");
    }

    // 3. Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 4. Update password
    await this.prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // 5. Delete all reset tokens for this email to prevent reuse
    await this.prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    return { message: "Mật khẩu của bạn đã được thay đổi thành công." };
  }

  private async verifyOAuthToken(provider: string, idToken: string, email: string) {
    if (provider === "google") {
      try {
        const res = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
        );
        if (!res.ok) {
          throw new UnauthorizedException("Google token verification failed");
        }
        const payload = await res.json();
        if (payload.email !== email) {
          throw new UnauthorizedException("Token email does not match provided email");
        }
      } catch (err) {
        if (err instanceof UnauthorizedException) throw err;
        this.logger.error("Google token verification error", err);
        throw new UnauthorizedException("Không thể xác thực token Google");
      }
    } else {
      throw new UnauthorizedException(`Unsupported OAuth provider: ${provider}`);
    }
  }

  async oauthLogin(data: {
    email: string;
    fullName: string;
    avatarUrl?: string;
    provider: string;
    providerAccountId: string;
    idToken: string;
  }) {
    const { email, fullName, avatarUrl, provider, providerAccountId, idToken } = data;
    this.logger.debug(`oauthLogin request for email=${email}, provider=${provider}`);

    // Verify the ID token with the provider before trusting credentials
    await this.verifyOAuthToken(provider, idToken, email);

    try {
      let user = await this.prisma.user.findUnique({
        where: { email },
        include: { role: true },
      });

      if (user) {
        const existingAccount = await this.prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId,
            },
          },
        });

        if (!existingAccount) {
          this.logger.debug(`Linking ${provider} account to existing user ${user.id}`);
          await this.prisma.account.create({
            data: {
              userId: user.id,
              provider,
              providerAccountId,
            },
          });
        }
      } else {
        this.logger.debug(`Creating new user for OAuth ${provider} login: ${email}`);
        const userRole = await this.prisma.role.findUnique({
          where: { name: "USER" },
        });

        if (!userRole) {
          this.logger.error("USER role not found in database");
          throw new BadRequestException("Vai trò USER không tồn tại trong hệ thống.");
        }

        user = await this.prisma.user.create({
          data: {
            email,
            fullName,
            avatarUrl,
            provider,
            isActive: true,
            roleId: userRole.id,
          },
          include: { role: true },
        });

        await this.prisma.account.create({
          data: {
            userId: user.id,
            provider,
            providerAccountId,
          },
        });

        try {
          const welcomeTemplate = await this.prisma.emailTemplate.findUnique({
            where: { key: "welcome" },
          });
          if (welcomeTemplate) {
            const subjectTemplate = handlebars.compile(welcomeTemplate.subject);
            const contentTemplate = handlebars.compile(welcomeTemplate.content);
            const variables = { fullName: user.fullName };
            const subject = subjectTemplate(variables);
            const htmlContent = contentTemplate(variables);
            await this.mailService.sendMail(email, subject, htmlContent);
          }
        } catch (err) {
          this.logger.error("Failed to send welcome email for oauth user:", err);
        }
      }

      return this.login(user);
    } catch (dbError) {
      this.logger.error("oauthLogin exception", dbError);
      throw dbError;
    }
  }
}
