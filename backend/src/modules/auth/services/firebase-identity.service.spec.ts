import { describe, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { FirebaseIdentityService } from './firebase-identity.service.js';

describe('FirebaseIdentityService initialization', () => {
  it('thử khởi tạo Firebase Admin', async () => {
    const config = new ConfigService({
      FIREBASE_ENABLED: true,
      FIREBASE_PROJECT_ID: 'lambe-f7213',
    });
    const service = new FirebaseIdentityService(config);
    try {
      const app = await (service as any).getApp();
      console.log('Firebase getApp succeeded! App name:', app.name);
    } catch (err: any) {
      console.error('Firebase getApp error message:', err?.message);
      console.error('Firebase getApp full error:', err);
      throw err;
    }
  });
});
