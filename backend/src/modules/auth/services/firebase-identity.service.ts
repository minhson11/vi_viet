import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

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
  private readonly logger = new Logger(FirebaseIdentityService.name);
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
    } catch (err: any) {
      this.logger.error(
        `Firebase Admin chưa sẵn sàng: ${err?.message || err}`,
        err?.stack,
      );
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
          `Nhà cung cấp đăng nhập "${provider}" không được hỗ trợ.`,
        );
      }

      if (!token.email) {
        throw new UnauthorizedException(
          'Tài khoản mạng xã hội không cung cấp địa chỉ email. Vui lòng cấp quyền truy cập email hoặc dùng phương thức đăng nhập khác.',
        );
      }

      // Google cung cấp cờ email_verified đáng tin cậy
      // Facebook không trả về cờ email_verified trong ID Token của Firebase
      if (provider === 'google.com' && token.email_verified !== true) {
        throw new UnauthorizedException('Email Google chưa được xác minh.');
      }

      return {
        uid: token.uid,
        email: token.email,
        emailVerified: token.email_verified === true,
        displayName: typeof token.name === 'string' ? token.name : undefined,
        provider,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(
        `Xác thực Firebase ID Token thất bại: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
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

    const { getApps, initializeApp, cert, applicationDefault } = await import(
      'firebase-admin/app'
    );

    const existingApp = getApps()[0];
    if (existingApp) {
      this.app = existingApp;
      return this.app;
    }

    const projectId = this.config.getOrThrow<string>('FIREBASE_PROJECT_ID');
    const rawCred = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    const cleanedCred = rawCred ? rawCred.trim().replace(/^["']|["']$/g, '') : '';

    let currentDir = '';
    try {
      currentDir = path.dirname(fileURLToPath(import.meta.url));
    } catch {
      // ignore
    }

    let credentialObj: any = null;

    // 1. Kiểm tra nếu GOOGLE_APPLICATION_CREDENTIALS chứa chuỗi JSON trực tiếp
    if (cleanedCred.startsWith('{') && cleanedCred.endsWith('}')) {
      try {
        const json = JSON.parse(cleanedCred);
        if (json.project_id && json.private_key) {
          this.logger.log('Firebase Admin loaded service account directly from environment JSON string');
          credentialObj = cert(json);
        }
      } catch {
        // bỏ qua nếu parse lỗi
      }
    }

    // 2. Quét file từ các đường dẫn khả dĩ (local dev, repo, Render Secret Files)
    if (!credentialObj) {
      const candidatePaths = [
        cleanedCred,
        cleanedCred ? path.resolve(process.cwd(), cleanedCred) : '',
        cleanedCred ? path.resolve(process.cwd(), 'backend', cleanedCred) : '',
        '/etc/secrets/firebase-service-account.json', // Đường dẫn Render Secret File
        path.resolve(process.cwd(), 'secrets/firebase-service-account.json'),
        path.resolve(process.cwd(), 'backend/secrets/firebase-service-account.json'),
        currentDir ? path.resolve(currentDir, '../../../../secrets/firebase-service-account.json') : '',
        currentDir ? path.resolve(currentDir, '../../../../../secrets/firebase-service-account.json') : '',
      ].filter(Boolean);

      for (const p of candidatePaths) {
        try {
          if (p && fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf8');
            const json = JSON.parse(raw);
            if (json.project_id && json.private_key) {
              this.logger.log(`Firebase Admin loaded service account from: ${p}`);
              credentialObj = cert(json);
              break;
            }
          }
        } catch {
          // thử tiếp đường dẫn khác
        }
      }
    }

    this.app = initializeApp({
      credential: credentialObj || applicationDefault(),
      projectId,
    });

    return this.app;
  }
}
