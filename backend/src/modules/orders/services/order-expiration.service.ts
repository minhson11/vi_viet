import { Injectable } from '@nestjs/common';
import {
  coupon_redemptions_status,
  orders_status,
  payments_status,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class OrderExpirationService {
  constructor(private readonly prisma: PrismaService) {}

  async expireDueOrders(now = new Date(), batchSize = 100): Promise<number> {
    const dueOrders = await this.prisma.orders.findMany({
      where: {
        status: orders_status.PENDING_PAYMENT,
        payment_deadline: { lte: now },
      },
      select: { id: true },
      orderBy: { payment_deadline: 'asc' },
      take: batchSize,
    });

    let expiredCount = 0;
    for (const { id } of dueOrders) {
      const expired = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`;

        const updated = await tx.orders.updateMany({
          where: {
            id,
            status: orders_status.PENDING_PAYMENT,
            payment_deadline: { lte: now },
          },
          data: {
            status: orders_status.CANCELLED,
            cancelled_at: now,
            cancel_reason: 'Hết thời hạn thanh toán',
          },
        });
        if (updated.count !== 1) return false;

        await tx.payments.updateMany({
          where: { order_id: id, status: payments_status.PENDING },
          data: { status: payments_status.EXPIRED },
        });
        await tx.coupon_redemptions.updateMany({
          where: {
            order_id: id,
            status: coupon_redemptions_status.RESERVED,
          },
          data: {
            status: coupon_redemptions_status.RELEASED,
            released_at: now,
          },
        });
        await tx.order_events.create({
          data: {
            order_id: id,
            actor_user_id: null,
            event_type: 'PAYMENT_EXPIRED',
            from_status: orders_status.PENDING_PAYMENT,
            to_status: orders_status.CANCELLED,
            note: 'Đơn hàng tự động hủy do hết thời hạn thanh toán.',
          },
        });

        return true;
      });

      if (expired) expiredCount += 1;
    }

    return expiredCount;
  }
}
