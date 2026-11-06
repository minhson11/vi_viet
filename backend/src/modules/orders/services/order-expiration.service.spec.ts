import { describe, expect, it, vi } from 'vitest';
import { OrderExpirationService } from './order-expiration.service.js';

describe('OrderExpirationService', () => {
  it('returns zero without opening transactions when no order is due', async () => {
    const prisma = {
      orders: { findMany: vi.fn().mockResolvedValue([]) },
      $transaction: vi.fn(),
    };
    const service = new OrderExpirationService(prisma as never);

    await expect(service.expireDueOrders(new Date(0), 25)).resolves.toBe(0);
    expect(prisma.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 25 }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
