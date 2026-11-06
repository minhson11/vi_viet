import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';

const SUPPORTED_PROVIDERS = ['google.com', 'facebook.com'] as const;
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export interface FirebaseIdentity {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  provider: SupportedProvider;
}

@Injectable()
export class FirebaseIdentityService {
  private app?: App;

  constructor(private readonly config: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<FirebaseIdentity> {
    if (!this.config.get<boolean>('FIREBASE_ENABLED')) {
      throw new ServiceUnavailableException(
        'Đăng nhập mạng xã hội hiện chưa được cấu hình.',
      );
    }

    let app: App;
    try {
      app = await this.getApp();
    } catch {
      throw new ServiceUnavailableException(
        'Firebase Admin chưa sẵn sàng. Vui lòng kiểm tra service account.',
      );
    }

    try {
      const { getAuth } = await import('firebase-admin/auth');
      const token = await getAuth(app).verifyIdToken(idToken, true);
      const provider = token.firebase?.sign_in_provider;

      if (!this.isSupportedProvider(provider)) {
        throw new UnauthorizedException(
          'Nhà cung cấp đăng nhập không được hỗ trợ.',
        );
      }
      if (!token.email || token.email_verified !== true) {
        throw new UnauthorizedException(
          'Tài khoản mạng xã hội phải có email đã xác minh.',
        );
      }

      return {
        uid: token.uid,
        email: token.email,
        emailVerified: true,
        displayName: typeof token.name === 'string' ? token.name : undefined,
        provider,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException(
        'Phiên đăng nhập mạng xã hội không hợp lệ hoặc đã hết hạn.',
      );
    }
  }

  private isSupportedProvider(
    provider: string | undefined,
  ): provider is SupportedProvider {
    return SUPPORTED_PROVIDERS.some((value) => value === provider);
  }

  private async getApp(): Promise<App> {
    if (this.app) return this.app;

    const { applicationDefault, getApps, initializeApp } = await import(
      'firebase-admin/app'
    );
    this.app =
      getApps()[0] ??
      initializeApp({
        credential: applicationDefault(),
        projectId: this.config.getOrThrow<string>('FIREBASE_PROJECT_ID'),
      });
    return this.app;
  }
}
