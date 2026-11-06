import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertSafeTestDatabaseUrl } from './database-test-safety.js';

function readEnvValue(filePath: string, key: string): string | undefined {
  if (!existsSync(filePath)) return undefined;

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = readFileSync(filePath, 'utf8').match(
    new RegExp(`^${escapedKey}=["']?([^"'\\r\\n]+)["']?`, 'm'),
  );

  return match?.[1]?.trim();
}

const backendRoot = process.cwd();
const testEnvPath = resolve(backendRoot, '.env.test');
const developmentEnvPath = resolve(backendRoot, '.env');

if (existsSync(testEnvPath)) {
  process.loadEnvFile(testEnvPath);
}

const developmentDatabaseUrl = readEnvValue(developmentEnvPath, 'DATABASE_URL');
const allowSharedDatabase = process.env.ALLOW_SHARED_DATABASE_E2E === 'true';
const targetDatabaseUrl =
  process.env.TEST_DATABASE_URL ||
  (allowSharedDatabase ? developmentDatabaseUrl : undefined);
const testDatabase = assertSafeTestDatabaseUrl(
  targetDatabaseUrl,
  [developmentDatabaseUrl],
  allowSharedDatabase,
);

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = targetDatabaseUrl!.trim();

console.info(
  `[E2E safety] Using dedicated test database ${testDatabase.host}/${testDatabase.database}`,
);
