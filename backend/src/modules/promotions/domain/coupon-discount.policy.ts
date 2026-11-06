export type CouponDiscountType = 'FIXED' | 'PERCENT' | 'FREE_SHIPPING';

export interface CouponDiscountTerms {
  type: CouponDiscountType;
  value: number;
  maxDiscount: number | null;
}

export interface CouponDiscountResult {
  amount: number;
  appliedTo: 'FOOD' | 'SHIPPING';
}

export function calculateCouponDiscount(
  terms: CouponDiscountTerms,
  subtotal: number,
  shippingFee: number,
): CouponDiscountResult {
  const safeSubtotal = Math.max(0, Math.round(subtotal));
  const safeShippingFee = Math.max(0, Math.round(shippingFee));
  const value = Math.max(0, terms.value);

  if (terms.type === 'FREE_SHIPPING') {
    const limit = value > 0 ? value : safeShippingFee;
    return {
      amount: Math.min(limit, safeShippingFee),
      appliedTo: 'SHIPPING',
    };
  }

  if (terms.type === 'PERCENT') {
    const calculated = Math.round((safeSubtotal * value) / 100);
    return {
      amount: Math.min(
        calculated,
        terms.maxDiscount ?? safeSubtotal,
        safeSubtotal,
      ),
      appliedTo: 'FOOD',
    };
  }

  return {
    amount: Math.min(value, safeSubtotal),
    appliedTo: 'FOOD',
  };
}
