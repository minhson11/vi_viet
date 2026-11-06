export const ORDER_TRANSITIONS = {
  PENDING_PAYMENT: ['PENDING_CONFIRMATION', 'CANCELLED'],
  PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DELIVERING', 'COMPLETED', 'CANCELLED'],
  DELIVERING: ['COMPLETED', 'DELIVERY_FAILED'],
  DELIVERY_FAILED: ['DELIVERING', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
} as const;

export type OrderStatus = keyof typeof ORDER_TRANSITIONS;

export function isOrderTransitionAllowed(from: string, to: string): boolean {
  if (!(from in ORDER_TRANSITIONS)) return false;
  return (ORDER_TRANSITIONS[from as OrderStatus] as readonly string[]).includes(
    to,
  );
}
