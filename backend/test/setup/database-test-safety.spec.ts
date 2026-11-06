import { describe, expect, it } from 'vitest';
import {
  assertSafeTestDatabaseUrl,
  getTestDatabaseIdentity,
} from './database-test-safety.js';

describe('database test safety', () => {
  it('accepts a dedicated test database', () => {
    expect(
      assertSafeTestDatabaseUrl(
        'mysql://tester:secret@127.0.0.1:3306/vi_viet_test?ssl=false',
      ),
    ).toMatchObject({
      host: '127.0.0.1',
      database: 'vi_viet_test',
      identity: '127.0.0.1:3306/vi_viet_test',
    });
  });

  it('rejects a missing test database URL', () => {
    expect(() => assertSafeTestDatabaseUrl(undefined)).toThrow(
      'set TEST_DATABASE_URL',
    );
  });

  it('rejects a database without a test suffix', () => {
    expect(() =>
      assertSafeTestDatabaseUrl('mysql://root:secret@localhost:3306/vi_viet'),
    ).toThrow('must end with');
  });

  it('rejects the development database even when credentials differ', () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        'mysql://test-user:secret@db.example.com:4000/vi_viet_test',
        ['mysql://prod-user:secret@db.example.com:4000/vi_viet_test?ssl=true'],
      ),
    ).toThrow('development/production database');
  });

  it('allows a shared development database only with an explicit opt-in', () => {
    const sharedUrl = 'mysql://user:secret@db.example.com:4000/vi_viet';
    expect(
      assertSafeTestDatabaseUrl(sharedUrl, [sharedUrl], true),
    ).toMatchObject({
      database: 'vi_viet',
    });
  });

  it('rejects an invalid URL and a URL without a database name', () => {
    expect(() => getTestDatabaseIdentity('not-a-url')).toThrow('not a valid');
    expect(() => getTestDatabaseIdentity('mysql://localhost:3306')).toThrow(
      'include a database name',
    );
  });
});
