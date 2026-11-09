import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service.js';
import { RegisterDto } from '../dto/register.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { RefreshTokenDto } from '../dto/refresh-token.dto.js';
import { FirebaseLoginDto } from '../dto/firebase-login.dto.js';
import { ForgotPasswordDto } from '../dto/forgot-password.dto.js';
import { ResetPasswordDto } from '../dto/reset-password.dto.js';
import { VerifyEmailDto } from '../dto/verify-email.dto.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { RateLimit } from '../../../common/rate-limit/rate-limit.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @RateLimit(5, 10 * 60 * 1000)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.register(dto, userAgent);
  }

  @Public()
  @RateLimit(10, 60 * 1000)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.login(dto, userAgent);
  }

  @Public()
  @RateLimit(10, 60 * 1000)
  @HttpCode(HttpStatus.OK)
  @Post('firebase')
  async loginWithFirebase(
    @Body() dto: FirebaseLoginDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.loginWithFirebase(dto, userAgent);
  }

  @Public()
  @RateLimit(30, 60 * 1000)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.refreshToken(dto.refresh_token, userAgent);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() dto?: RefreshTokenDto) {
    return this.authService.logout(dto?.refresh_token);
  }

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Public()
  @RateLimit(3, 15 * 60 * 1000)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @RateLimit(5, 15 * 60 * 1000)
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @RateLimit(10, 60 * 1000)
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @RateLimit(5, 60 * 1000)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('resend-verification')
  async resendVerification(@CurrentUser('id') userId: string) {
    return this.authService.resendVerification(userId);
  }
}
