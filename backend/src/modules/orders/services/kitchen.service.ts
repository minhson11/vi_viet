import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { OrderStateMachineService } from './order-state-machine.service.js';
import { orders_status } from '@prisma/client';

@Injectable()
export class KitchenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: OrderStateMachineService,
  ) {}

  // Lấy danh sách hàng đợi chế biến (CONFIRMED & PREPARING)
  // [Bảo mật PII] Ẩn thông tin cá nhân khách hàng (số điện thoại, địa chỉ chi tiết)
  async getKitchenQueue() {
    const orders = await this.prisma.orders.findMany({
      where: {
        status: {
          in: [orders_status.CONFIRMED, orders_status.PREPARING],
        },
      },
      orderBy: { created_at: 'asc' },
      include: {
        order_items: {
          include: { order_item_options: true },
        },
      },
    });

    return orders.map((o) => ({
      id: o.id.toString(),
      order_code: o.order_code,
      status: o.status,
      fulfillment_type: o.fulfillment_type,
      customer_note: o.customer_note,
      created_at: o.created_at,
      items: o.order_items.map((item) => ({
        dish_name: item.dish_name,
        variant_name: item.variant_name,
        quantity: item.quantity,
        note: item.note,
        options: item.order_item_options.map((opt) => ({
          group_name: opt.group_name,
          option_name: opt.option_name,
        })),
      })),
    }));
  }

  // Bếp bắt đầu chế biến (CONFIRMED -> PREPARING)
  async startCooking(orderId: string, kitchenUserId: string) {
    await this.stateMachine.transitionStatus(orderId, kitchenUserId, {
      status: orders_status.PREPARING,
      note: 'Bếp bắt đầu chế biến',
    });
    return this.prisma.orders.findUnique({
      where: { id: BigInt(orderId) },
      select: { id: true, order_code: true, status: true },
    });
  }

  // Bếp hoàn thành món ăn (PREPARING -> READY)
  async finishCooking(orderId: string, kitchenUserId: string) {
    await this.stateMachine.transitionStatus(orderId, kitchenUserId, {
      status: orders_status.READY,
      note: 'Món ăn đã sẵn sàng phục vụ/giao hàng',
    });
    return this.prisma.orders.findUnique({
      where: { id: BigInt(orderId) },
      select: { id: true, order_code: true, status: true },
    });
  }
}
