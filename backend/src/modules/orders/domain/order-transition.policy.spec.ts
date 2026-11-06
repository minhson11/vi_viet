import { describe, expect, it } from 'vitest';
import { isOrderTransitionAllowed } from './order-transition.policy.js';

describe('order transition policy', () => {
  it('allows valid fulfillment transitions', () => {
    expect(isOrderTransitionAllowed('PENDING_CONFIRMATION', 'CONFIRMED')).toBe(
      true,
    );
    expect(isOrderTransitionAllowed('CONFIRMED', 'PREPARING')).toBe(true);
    expect(isOrderTransitionAllowed('PREPARING', 'READY')).toBe(true);
    expect(isOrderTransitionAllowed('READY', 'DELIVERING')).toBe(true);
    expect(isOrderTransitionAllowed('DELIVERING', 'COMPLETED')).toBe(true);
  });

  it('rejects skipped, terminal, and unknown transitions', () => {
    expect(isOrderTransitionAllowed('PENDING_CONFIRMATION', 'READY')).toBe(
      false,
    );
    expect(isOrderTransitionAllowed('COMPLETED', 'CANCELLED')).toBe(false);
    expect(isOrderTransitionAllowed('CANCELLED', 'CONFIRMED')).toBe(false);
    expect(isOrderTransitionAllowed('UNKNOWN', 'CONFIRMED')).toBe(false);
  });
});
