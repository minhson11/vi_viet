import { describe, expect, it } from 'vitest';
import { calculateCouponDiscount } from './coupon-discount.policy.js';

describe('coupon discount policy', () => {
  it('caps a fixed discount at the food subtotal', () => {
    expect(
      calculateCouponDiscount(
        { type: 'FIXED', value: 80_000, maxDiscount: null },
        50_000,
        20_000,
      ),
    ).toEqual({ amount: 50_000, appliedTo: 'FOOD' });
  });

  it('rounds and caps a percent discount', () => {
    expect(
      calculateCouponDiscount(
        { type: 'PERCENT', value: 15, maxDiscount: 20_000 },
        200_001,
        20_000,
      ),
    ).toEqual({ amount: 20_000, appliedTo: 'FOOD' });
  });

  it('caps free shipping at the actual shipping fee', () => {
    expect(
      calculateCouponDiscount(
        { type: 'FREE_SHIPPING', value: 50_000, maxDiscount: null },
        100_000,
        20_000,
      ),
    ).toEqual({ amount: 20_000, appliedTo: 'SHIPPING' });
  });
});
