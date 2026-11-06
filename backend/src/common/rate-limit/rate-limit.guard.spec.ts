import { describe, expect, it } from 'vitest';
import { consumeRateLimit } from './rate-limit.guard.js';

describe('consumeRateLimit', () => {
  it('blocks requests over the limit until the window expires', () => {
    const key = `test-${Math.random()}`;
    expect(consumeRateLimit(key, 2, 1_000, 0)).toBe(0);
    expect(consumeRateLimit(key, 2, 1_000, 10)).toBe(0);
    expect(consumeRateLimit(key, 2, 1_000, 20)).toBe(980);
    expect(consumeRateLimit(key, 2, 1_000, 1_001)).toBe(0);
  });
});
