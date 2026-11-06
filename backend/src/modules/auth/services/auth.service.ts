import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../database/prisma.service.js';
import { RegisterDto } from '../dto/register.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { FirebaseLoginDto } from '../dto/firebase-login.dto.js';
import { Prisma, users } from '@prisma/client';
import { FirebaseIdentityService } from './firebase-identity.service.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly firebaseIdentity: FirebaseIdentityService,
  ) {}

  // Helper chuyển đổi user an toàn (ẩn password_hash, BigInt -> string)
  toSafeUser(user: users) {
    return {
      id: user.id.toString(),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      email_verified_at: user.email_verified_at,
      created_at: user.created_at,
    };
  }

  // Băm SHA-256 cho refresh token trước khi lưu CSDL
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Sinh cặp Access Token và Refresh Token
  private async generateTokens(
    user: users,
    userAgent?: string,
    database: Pick<Prisma.TransactionClient, 'auth_sessions'> = this.prisma,
  ) {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is missing!');
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
        '15m') as any,
    });

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);

    const refreshDaysStr =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const refreshDays = parseInt(refreshDaysStr, 10) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    await database.auth_sessions.create({
      data: {
        user_id: user.id,
        refresh_token_hash: refreshTokenHash,
        expires_at: expiresAt,
        user_agent: userAgent || null,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
    };
  }

  // Dọn dẹp các phiên đăng nhập hết hạn hoặc đã thu hồi để tránh phình to CSDL (Issue 8, BE-03.24)
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();
      await this.prisma.auth_sessions.deleteMany({
        where: {
          OR: [
            { expires_at: { lt: now } },
            {
              revoked_at: {
                lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
      });
    } catch (err: any) {
      this.logger.warn(
        `Failed to cleanup expired sessions: ${err?.message || err}`,
      );
    }
  }

  // 1. Đăng ký tài khoản
  async register(dto: RegisterDto, userAgent?: string) {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng.');
    }

    const passwordHash = await argon2.hash(dto.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email,
          password_hash: passwordHash,
          full_name: dto.full_name.trim(),
          phone: dto.phone?.trim() || null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });

      const tokens = await this.generateTokens(user, userAgent, tx);

      return {
        message: 'Đăng ký tài khoản thành công',
        user: this.toSafeUser(user),
        ...tokens,
      };
    });

    void this.cleanupExpiredSessions();
    return result;
  }

  // 2. Đăng nhập
  async login(dto: LoginDto, userAgent?: string) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isPasswordValid = await argon2.verify(
      user.password_hash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // BR-02: Chặn tài khoản LOCKED hoặc DEACTIVATED
    if (user.status === 'LOCKED') {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.',
      );
    }
    if (user.status === 'DEACTIVATED') {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa.');
    }

    const tokens = await this.generateTokens(user, userAgent);
    void this.cleanupExpiredSessions();

    return {
      message: 'Đăng nhập thành công',
      user: this.toSafeUser(user),
      ...tokens,
    };
  }

  // 3. Làm mới token (Refresh Token Rotation)
  async loginWithFirebase(dto: FirebaseLoginDto, userAgent?: string) {
    const identity = await this.firebaseIdentity.verifyIdToken(dto.idToken);
    const email = identity.email.toLowerCase().trim();

    const user = await this.prisma.$transaction(async (tx) => {
      let matched = await tx.users.findUnique({
        where: { firebase_uid: identity.uid },
      });

      if (!matched) {
        matched = await tx.users.findUnique({ where: { email } });
      }

      if (matched) {
        if (matched.role !== 'CUSTOMER') {
          throw new ForbiddenException(
            'Đăng nhập mạng xã hội chỉ dành cho tài khoản khách hàng.',
          );
        }
        if (matched.firebase_uid && matched.firebase_uid !== identity.uid) {
          throw new UnauthorizedException(
            'Email này đã liên kết với một tài khoản mạng xã hội khác.',
          );
        }
        if (!matched.firebase_uid || !matched.email_verified_at) {
          matched = await tx.users.update({
            where: { id: matched.id },
            data: {
              firebase_uid: identity.uid,
              email_verified_at: matched.email_verified_at ?? new Date(),
            },
          });
        }
        return matched;
      }

      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await argon2.hash(randomPassword);
      const fullName =
        identity.displayName?.trim().slice(0, 120) ||
        email.split('@')[0]?.slice(0, 120) ||
        'Khách hàng';

      return tx.users.create({
        data: {
          email,
          firebase_uid: identity.uid,
          password_hash: passwordHash,
          full_name: fullName,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          email_verified_at: new Date(),
        },
      });
    });

    if (user.status === 'LOCKED') {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.',
      );
    }
    if (user.status === 'DEACTIVATED') {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa.');
    }

    const tokens = await this.generateTokens(user, userAgent);
    void this.cleanupExpiredSessions();
    return {
      message: 'Đăng nhập mạng xã hội thành công',
      user: this.toSafeUser(user),
      ...tokens,
    };
  }

  async refreshToken(rawRefreshToken: string, userAgent?: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const now = new Date();

    const tokens = await this.prisma.$transaction(async (tx) => {
      const session = await tx.auth_sessions.findUnique({
        where: { refresh_token_hash: tokenHash },
        include: { users: true },
      });

      if (!session || session.revoked_at || session.expires_at <= now) {
        throw new UnauthorizedException(
          'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
        );
      }

      const user = session.users;
      if (user.status !== 'ACTIVE') {
        throw new ForbiddenException('Tài khoản không ở trạng thái hoạt động.');
      }

      const revoked = await tx.auth_sessions.updateMany({
        where: {
          id: session.id,
          revoked_at: null,
          expires_at: { gt: now },
        },
        data: { revoked_at: now },
      });

      if (revoked.count !== 1) {
        throw new UnauthorizedException(
          'Phiên đăng nhập đã được sử dụng hoặc thu hồi.',
        );
      }

      return this.generateTokens(user, userAgent, tx);
    });

    void this.cleanupExpiredSessions();
    return tokens;
  }

  // 4. Đăng xuất (Thu hồi phiên)
  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.auth_sessions.updateMany({
        where: {
          refresh_token_hash: tokenHash,
          revoked_at: null,
        },
        data: {
          revoked_at: new Date(),
        },
      });
    }

    return {
      message: 'Đăng xuất thành công',
    };
  }

  // 5. Lấy thông tin user hiện tại
  async getMe(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    return this.toSafeUser(user);
  }
}
