const REQUIRED_PRODUCTION_VALUES = [
  'CORS_ORIGIN',
  'VNPAY_TMN_CODE',
  'VNPAY_HASH_SECRET',
  'VNPAY_URL',
  'VNPAY_RETURN_URL',
  'FRONTEND_PAYMENT_RESULT_URL',
] as const;

function requireValue(
  environment: Record<string, unknown>,
  key: string,
  errors: string[],
): string | undefined {
  const value =
    typeof environment[key] === 'string' ? environment[key].trim() : '';
  if (!value) {
    errors.push(`${key} is required`);
    return undefined;
  }
  return value;
}

function requireUrl(
  value: string | undefined,
  key: string,
  errors: string[],
): void {
  if (!value) return;
  try {
    new URL(value);
  } catch {
    errors.push(`${key} must be a valid URL`);
  }
}

function validatePositiveInteger(
  environment: Record<string, unknown>,
  key: string,
  errors: string[],
): void {
  if (environment[key] === undefined || environment[key] === '') return;
  const value = Number(environment[key]);
  if (!Number.isInteger(value) || value < 1) {
    errors.push(`${key} must be a positive integer`);
  }
}

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const errors: string[] = [];
  const nodeEnv = String(environment.NODE_ENV || 'development');

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be development, test, or production');
  }

  const databaseUrl = requireValue(environment, 'DATABASE_URL', errors);
  const jwtAccessSecret = requireValue(
    environment,
    'JWT_ACCESS_SECRET',
    errors,
  );
  requireUrl(databaseUrl, 'DATABASE_URL', errors);

  if (jwtAccessSecret && jwtAccessSecret.length < 32) {
    errors.push('JWT_ACCESS_SECRET must contain at least 32 characters');
  }

  const port = Number(environment.PORT || 7000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('PORT must be an integer between 1 and 65535');
  }

  validatePositiveInteger(environment, 'DEFAULT_DELIVERY_FEE', errors);
  validatePositiveInteger(environment, 'PAYMENT_TIMEOUT_MINUTES', errors);
  validatePositiveInteger(
    environment,
    'PAYMENT_EXPIRATION_INTERVAL_MS',
    errors,
  );

  const firebaseEnabled =
    String(environment.FIREBASE_ENABLED || 'false').toLowerCase() === 'true';
  if (firebaseEnabled) {
    requireValue(environment, 'FIREBASE_PROJECT_ID', errors);
    if (!environment.FIREBASE_AUTH_EMULATOR_HOST) {
      requireValue(environment, 'GOOGLE_APPLICATION_CREDENTIALS', errors);
    }
  }

  if (nodeEnv === 'production') {
    for (const key of REQUIRED_PRODUCTION_VALUES) {
      requireValue(environment, key, errors);
    }

    requireUrl(
      environment.VNPAY_URL as string | undefined,
      'VNPAY_URL',
      errors,
    );
    requireUrl(
      environment.VNPAY_RETURN_URL as string | undefined,
      'VNPAY_RETURN_URL',
      errors,
    );
    requireUrl(
      environment.FRONTEND_PAYMENT_RESULT_URL as string | undefined,
      'FRONTEND_PAYMENT_RESULT_URL',
      errors,
    );

    if (
      jwtAccessSecret &&
      (jwtAccessSecret.toLowerCase().includes('sample') ||
        jwtAccessSecret.toLowerCase().includes('placeholder') ||
        jwtAccessSecret.toLowerCase().includes('change_in_production'))
    ) {
      errors.push(
        'JWT_ACCESS_SECRET must not use a sample/placeholder secret in production',
      );
    }

    const corsOrigins = String(environment.CORS_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    for (const origin of corsOrigins) {
      requireUrl(origin, 'CORS_ORIGIN', errors);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n- ${errors.join('\n- ')}`,
    );
  }

  return {
    ...environment,
    NODE_ENV: nodeEnv,
    PORT: port,
    FIREBASE_ENABLED: firebaseEnabled,
  };
}
