export interface TestDatabaseIdentity {
  host: string;
  database: string;
  identity: string;
}

export function getTestDatabaseIdentity(
  databaseUrl: string,
): TestDatabaseIdentity {
  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('TEST_DATABASE_URL is not a valid database URL.');
  }

  const database = decodeURIComponent(
    parsed.pathname.replace(/^\//, ''),
  ).trim();
  if (!database) {
    throw new Error('TEST_DATABASE_URL must include a database name.');
  }

  const host = parsed.hostname.toLowerCase();
  const port = parsed.port || (parsed.protocol === 'mysql:' ? '3306' : '');

  return {
    host,
    database,
    identity: `${host}:${port}/${database.toLowerCase()}`,
  };
}

export function assertSafeTestDatabaseUrl(
  testDatabaseUrl: string | undefined,
  forbiddenDatabaseUrls: Array<string | undefined> = [],
  allowSharedDatabase = false,
): TestDatabaseIdentity {
  if (!testDatabaseUrl?.trim()) {
    throw new Error(
      'E2E tests are blocked: set TEST_DATABASE_URL to a dedicated test database.',
    );
  }

  const testDatabase = getTestDatabaseIdentity(testDatabaseUrl.trim());
  const normalizedName = testDatabase.database.toLowerCase();

  if (
    !allowSharedDatabase &&
    !normalizedName.endsWith('_test') &&
    !normalizedName.endsWith('-test')
  ) {
    throw new Error(
      `E2E tests are blocked: database "${testDatabase.database}" must end with "_test" or "-test".`,
    );
  }

  for (const forbiddenUrl of forbiddenDatabaseUrls) {
    if (!forbiddenUrl?.trim()) continue;

    const forbiddenDatabase = getTestDatabaseIdentity(forbiddenUrl.trim());
    if (
      !allowSharedDatabase &&
      forbiddenDatabase.identity === testDatabase.identity
    ) {
      throw new Error(
        'E2E tests are blocked: TEST_DATABASE_URL points to the development/production database.',
      );
    }
  }

  return testDatabase;
}
