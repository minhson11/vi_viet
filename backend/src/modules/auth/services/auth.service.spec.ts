import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

const customer = {
  id: 1n,
  full_name: 'Nguyễn Văn An',
  email: 'an@example.com',
  firebase_uid: 'firebase-user-1',
  phone: null,
  password_hash: 'hash',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  email_verified_at: new Date(),
  deactivated_at: null,
  created_at: new Date(),
  updated_at: new Date(),
};

function createService(existingUser: typeof customer | null = null) {
  const transactionUsers = {
    findUnique: vi
      .fn()
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(existingUser),
    update: vi.fn().mockResolvedValue(existingUser),
    create: vi.fn().mockResolvedValue(customer),
  };
  const prisma = {
    $transaction: vi.fn(async (callback) =>
      callback({ users: transactionUsers }),
    ),
    auth_sessions: { create: vi.fn().mockResolvedValue({}) },
    users: { findUnique: vi.fn() },
    auth_sessions_cleanup: undefined,
  };
  Object.assign(prisma.auth_sessions, {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  });
  const jwt = { signAsync: vi.fn().mockResolvedValue('access-token') };
  const config = {
    get: vi.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'a'.repeat(32);
      if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return undefined;
    }),
  };
  const firebase = {
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'firebase-user-1',
      email: 'an@example.com',
      emailVerified: true,
      displayName: 'Nguyễn Văn An',
      provider: 'google.com',
    }),
  };

  return {
    service: new AuthService(
      prisma as never,
      jwt as never,
      config as never,
      firebase as never,
    ),
    transactionUsers,
  };
}

describe('AuthService social login', () => {
  it('creates a customer and returns the existing SonLon session shape', async () => {
    const { service, transactionUsers } = createService();

    const result = await service.loginWithFirebase({ idToken: 'x'.repeat(100) });

    expect(transactionUsers.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'an@example.com',
        firebase_uid: 'firebase-user-1',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      }),
    });
    expect(result).toMatchObject({
      access_token: 'access-token',
      user: { email: 'an@example.com', role: 'CUSTOMER' },
    });
  });

  it('does not link social login to privileged accounts', async () => {
    const { service } = createService({
      ...customer,
      role: 'ADMIN',
    });

    await expect(
      service.loginWithFirebase({ idToken: 'x'.repeat(100) }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
