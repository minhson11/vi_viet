import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import {
  orders_status,
  orders_payment_method,
  orders_payment_status,
  coupon_redemptions_status,
  payments_status,
  refunds_status,
  Prisma,
} from '@prisma/client';
import { isOrderTransitionAllowed } from '../domain/order-transition.policy.js';
import { EventsService } from '../../events/events.service.js';

@Injectable()
export class OrderStateMachineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  // Cập nhật trạng thái theo Máy trạng thái 9 bước (BR-22, BR-12)
  async transitionStatus(
    orderId: string,
    actorUserId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const oId = BigInt(orderId);
    let actorId: bigint | null = null;
    if (actorUserId) {
      try {
        const u = await this.prisma.users.findUnique({
          where: { id: BigInt(actorUserId) },
          select: { id: true },
        });
        if (u) actorId = u.id;
      } catch {
        actorId = null;
      }
    }

    const order = await this.prisma.orders.findUnique({
      where: { id: oId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng ID ${orderId}.`);
    }

    const currentStatus = order.status;
    const nextStatus = dto.status;

    // Kiểm tra tính hợp lệ của bước chuyển trạng thái (BR-22)
    if (!isOrderTransitionAllowed(currentStatus, nextStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ "${currentStatus}" sang "${nextStatus}".`,
      );
    }

    let finalPaymentStatus: string = order.payment_status;

    await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.ordersUpdateInput = {
        status: nextStatus,
      };

      if (nextStatus === orders_status.CANCELLED) {
        updateData.cancelled_at = new Date();
        updateData.cancel_reason =
          dto.cancel_reason || dto.note || 'Quán hủy đơn';

        // [BR-12] Hoàn trả mã ưu đãi nếu đang ở trạng thái RESERVED
        await tx.coupon_redemptions.updateMany({
          where: {
            order_id: oId,
            status: coupon_redemptions_status.RESERVED,
          },
          data: {
            status: coupon_redemptions_status.RELEASED,
            released_at: new Date(),
          },
        });

        // Tự động tạo yêu cầu hoàn tiền nếu đơn hàng đã được thanh toán thành công
        if (order.payment_status === orders_payment_status.PAID) {
          const payment = await tx.payments.findFirst({
            where: { order_id: oId, status: payments_status.SUCCEEDED },
            orderBy: { id: 'desc' },
          });

          if (payment) {
            const existingRefund = await tx.refunds.findFirst({
              where: { payment_id: payment.id },
            });
            if (!existingRefund) {
              const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
              await tx.refunds.create({
                data: {
                  payment_id: payment.id,
                  refund_reference: `VV-REF-${order.order_code}-${randomHex}`,
                  amount: payment.amount,
                  reason: dto.cancel_reason || dto.note || 'Hủy đơn hàng đã thanh toán',
                  status: refunds_status.REQUESTED,
                  requested_by: actorId || order.user_id,
                },
              });
            }
          }
        }
      }

      if (nextStatus === orders_status.CONFIRMED) {
        // [BR-12] Xác nhận đơn thành công -> Tiêu thụ mã ưu đãi (CONSUMED)
        await tx.coupon_redemptions.updateMany({
          where: {
            order_id: oId,
            status: coupon_redemptions_status.RESERVED,
          },
          data: {
            status: coupon_redemptions_status.CONSUMED,
          },
        });
      }

      if (nextStatus === orders_status.COMPLETED) {
        updateData.completed_at = new Date();
        if (order.payment_method === orders_payment_method.COD) {
          updateData.payment_status = orders_payment_status.PAID;
        }
      }

      if (updateData.payment_status) {
        finalPaymentStatus = updateData.payment_status as string;
      }

      // Cập nhật trạng thái kèm điều kiện lạc quan (Optimistic Concurrency - Issue 5)
      const updateResult = await tx.orders.updateMany({
        where: {
          id: oId,
          status: currentStatus,
        },
        data: updateData,
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Đơn hàng đã được cập nhật trạng thái bởi một thao tác khác. Vui lòng tải lại trang.',
        );
      }

      // Ghi nhận lịch sử luân chuyển
      await tx.order_events.create({
        data: {
          order_id: oId,
          actor_user_id: actorId,
          event_type: 'STATUS_TRANSITION',
          from_status: currentStatus,
          to_status: nextStatus,
          note: dto.note || null,
        },
      });
    });

    // Phát sự kiện SSE thời gian thực sau khi transaction commit thành công (API-54)
    this.eventsService.emitOrderUpdated({
      orderId: order.id.toString(),
      orderCode: order.order_code,
      status: nextStatus,
      paymentStatus: finalPaymentStatus,
      userId: order.user_id.toString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
