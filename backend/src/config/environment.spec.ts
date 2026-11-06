import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment.js';

const validDevelopmentEnvironment = {
  NODE_ENV: 'development',
  PORT: '7000',
  DATABASE_URL: 'mysql://root:secret@localhost:3306/vi_viet',
  JWT_ACCESS_SECRET: 'a-secure-development-secret-with-32-characters',
};

describe('validateEnvironment', () => {
  it('normalizes a valid development environment', () => {
    expect(validateEnvironment(validDevelopmentEnvironment)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 7000,
    });
  });

  it('rejects missing core configuration', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'development' })).toThrow(
      'DATABASE_URL is required',
    );
  });

  it('rejects a weak JWT secret and an invalid port', () => {
    expect(() =>
      validateEnvironment({
        ...validDevelopmentEnvironment,
        JWT_ACCESS_SECRET: 'short',
        PORT: '70000',
      }),
    ).toThrow('JWT_ACCESS_SECRET must contain at least 32 characters');
  });

  it('requires payment and CORS configuration in production', () => {
    expect(() =>
      validateEnvironment({
        ...validDevelopmentEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow('CORS_ORIGIN is required');
  });

  it('rejects invalid operational numeric configuration', () => {
    expect(() =>
      validateEnvironment({
        ...validDevelopmentEnvironment,
        PAYMENT_TIMEOUT_MINUTES: '0',
      }),
    ).toThrow('PAYMENT_TIMEOUT_MINUTES must be a positive integer');
  });

  it('requires a Firebase project when social login is enabled', () => {
    expect(() =>
      validateEnvironment({
        ...validDevelopmentEnvironment,
        FIREBASE_ENABLED: 'true',
      }),
    ).toThrow('FIREBASE_PROJECT_ID is required');
  });

  it('requires Firebase Admin credentials when the emulator is not used', () => {
    expect(() =>
      validateEnvironment({
        ...validDevelopmentEnvironment,
        FIREBASE_ENABLED: 'true',
        FIREBASE_PROJECT_ID: 'lambe-f7213',
      }),
    ).toThrow('GOOGLE_APPLICATION_CREDENTIALS is required');
  });

  it('rejects sample secrets in production', () => {
    expect(() =>
      validateEnvironment({
        ...validDevelopmentEnvironment,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'dev_secret_key_change_in_production_12345678',
        CORS_ORIGIN: 'https://example.com',
        VNPAY_TMN_CODE: 'CODE',
        VNPAY_HASH_SECRET: 'secret',
        VNPAY_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        VNPAY_RETURN_URL: 'https://api.example.com/payments/vnpay/return',
        FRONTEND_PAYMENT_RESULT_URL: 'https://example.com/payment/result',
      }),
    ).toThrow(
      'JWT_ACCESS_SECRET must not use a sample/placeholder secret in production',
    );
  });

  it('accepts a complete production environment', () => {
    expect(
      validateEnvironment({
        ...validDevelopmentEnvironment,
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://example.com',
        VNPAY_TMN_CODE: 'CODE',
        VNPAY_HASH_SECRET: 'secret',
        VNPAY_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        VNPAY_RETURN_URL: 'https://api.example.com/payments/vnpay/return',
        FRONTEND_PAYMENT_RESULT_URL: 'https://example.com/payment/result',
      }),
    ).toMatchObject({ NODE_ENV: 'production' });
  });
});
