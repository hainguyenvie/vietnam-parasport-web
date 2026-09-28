import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  Login2FADto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  OAuthLoginDto,
} from "./dto/auth.dto";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { TokenBlacklistService } from "./token-blacklist.service";

@Controller("auth")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenBlacklistService: TokenBlacklistService
  ) {}

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (user.isTwoFactorEnabled) {
      return {
        twoFactorRequired: true,
        email: user.email,
      };
    }
    return this.authService.login(user);
  }

  @Post("login/2fa")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login2FA(@Body() body: Login2FADto) {
    const user = await this.authService.verifyLogin2FA(body.email, body.token);
    if (!user) {
      throw new UnauthorizedException("Invalid 2FA code");
    }
    return this.authService.login(user);
  }

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post("forgot-password")
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const origin = process.env.FRONTEND_URL || "http://localhost:3000";
    return this.authService.forgotPassword(body.email, origin);
  }

  @Post("reset-password")
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post("oauth-login")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async oauthLogin(@Body() body: OAuthLoginDto) {
    return this.authService.oauthLogin(body);
  }

  @Post("refresh")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Body("refresh_token") refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("Thiếu refresh token");
    }
    return this.authService.refreshAccessToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Request() req: any) {
    const jti = req.user?.jti;
    if (jti) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await this.tokenBlacklistService.blacklist(jti, expiresAt);
    }
    return { message: "Đăng xuất thành công" };
  }
}
