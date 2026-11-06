import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../../database/prisma.service.js';
import { PaymentMapper } from '../application/mappers/payment.mapper.js';
import { CreateRefundDto } from '../dto/create-refund.dto.js';
import {
  RefundCommandDto,
  RefundCommandType,
} from '../dto/refund-command.dto.js';
import {
  payments_status,
  refunds_status,
  orders_payment_status,
} from '@prisma/client';
import { VnpayService } from './vnpay.service.js';

@Injectable()
export class RefundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vnpayService: VnpayService,
  ) {}

  public serializeRefund(r: any) {
    return PaymentMapper.toSerializedRefund(r);
  }

  // 1. Admin tạo yêu cầu hoàn tiền cho một giao dịch (API-48)
  async createRefund(adminId: string, paymentId: string, dto: CreateRefundDto) {
    const pId = BigInt(paymentId);
    const aId = BigInt(adminId);

    const payment = await this.prisma.payments.findUnique({
      where: { id: pId },
      include: { orders: true },
    });

    if (!payment) {
      throw new NotFoundException(`Không tìm thấy thanh toán ID ${paymentId}.`);
    }

    if (payment.status !== payments_status.SUCCEEDED) {
      throw new BadRequestException(
        'Chỉ có thể hoàn tiền cho các giao dịch thanh toán đã thành công (SUCCEEDED).',
      );
    }

    const paymentAmount = Number(payment.amount);

    // [BR-19] Thực thi kiểm tra hạn mức và tạo refund trong Transaction chống Race Condition (Issue 3)
    const refund = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM payments WHERE id = ${pId} FOR UPDATE`;

      const currentPayment = await tx.payments.findUnique({
        where: { id: pId },
        include: { orders: true },
      });

      if (
        !currentPayment ||
        currentPayment.status !== payments_status.SUCCEEDED
      ) {
        throw new BadRequestException(
          'Trạng thái thanh toán không hợp lệ để thực hiện hoàn tiền.',
        );
      }

      const activeRefunds = await tx.refunds.findMany({
        where: {
          payment_id: pId,
          status: {
            in: [
              refunds_status.REQUESTED,
              refunds_status.PROCESSING,
              refunds_status.SUCCEEDED,
            ],
          },
        },
      });

      const currentTotalRefunded = activeRefunds.reduce(
        (sum, r) => sum + Number(r.amount),
        0,
      );

      const newTotal = currentTotalRefunded + dto.amount;
      if (newTotal > paymentAmount) {
        throw new BadRequestException(
          `Tổng số tiền hoàn (${newTotal.toLocaleString('vi-VN')}đ) vượt quá khoản thu gốc (${paymentAmount.toLocaleString('vi-VN')}đ) theo quy tắc BR-19! Số tiền còn có thể hoàn tối đa: ${(paymentAmount - currentTotalRefunded).toLocaleString('vi-VN')}đ.`,
        );
      }

      const randomHex = randomBytes(3).toString('hex').toUpperCase();
      const refundRef = `VV-REF-${currentPayment.orders.order_code}-${randomHex}`;

      const createdRefund = await tx.refunds.create({
        data: {
          payment_id: pId,
          refund_reference: refundRef,
          amount: dto.amount,
          reason: dto.reason,
          status: refunds_status.REQUESTED,
          requested_by: aId,
        },
        include: { payments: true },
      });

      // Cập nhật trạng thái thanh toán của đơn hàng sang REFUND_PENDING nếu đơn đang PAID
      if (currentPayment.orders.payment_status === orders_payment_status.PAID) {
        await tx.orders.update({
          where: { id: currentPayment.order_id },
          data: { payment_status: orders_payment_status.REFUND_PENDING },
        });
      }

      await tx.order_events.create({
        data: {
          order_id: currentPayment.order_id,
          actor_user_id: aId,
          event_type: 'CREATE_REFUND_REQUEST',
          from_status: currentPayment.orders.status,
          to_status: currentPayment.orders.status,
          note: JSON.stringify({
            action: 'CREATE_REFUND_REQUEST',
            refundReference: createdRefund.refund_reference,
            amount: dto.amount,
            reason: dto.reason,
          }),
        },
      });

      return createdRefund;
    });

    return this.serializeRefund(refund);
  }

  // 2. Admin thực thi lệnh trên yêu cầu hoàn tiền (API-49 - BR-20)
  async executeRefundCommand(
    adminId: string,
    refundId: string,
    dto: RefundCommandDto,
  ) {
    const rId = BigInt(refundId);
    const aId = BigInt(adminId);

    const refund = await this.prisma.refunds.findUnique({
      where: { id: rId },
      include: {
        payments: {
          include: { orders: true },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu hoàn tiền ID ${refundId}.`,
      );
    }

    const currentStatus = refund.status;

    if (dto.type === RefundCommandType.START_PROCESSING) {
      if (currentStatus !== refunds_status.REQUESTED) {
        throw new BadRequestException(
          `Không thể chuyển sang PROCESSING từ trạng thái hiện tại: "${currentStatus}".`,
        );
      }

      const transition = await this.prisma.refunds.updateMany({
        where: { id: rId, status: refunds_status.REQUESTED },
        data: { status: refunds_status.PROCESSING },
      });
      if (transition.count !== 1) {
        throw new ConflictException(
          'Yêu cầu hoàn tiền đã được xử lý bởi thao tác khác.',
        );
      }

      const updated = await this.prisma.refunds.findUniqueOrThrow({
        where: { id: rId },
        include: { payments: true },
      });

      return this.serializeRefund(updated);
    }

    if (dto.type === RefundCommandType.TRIGGER_VNPAY_REFUND) {
      if (
        currentStatus !== refunds_status.REQUESTED &&
        currentStatus !== refunds_status.PROCESSING
      ) {
        throw new BadRequestException(
          `Không thể thực hiện gọi hoàn tiền VNPAY từ trạng thái: "${currentStatus}".`,
        );
      }

      await this.prisma.refunds.update({
        where: { id: rId },
        data: { status: refunds_status.PROCESSING },
      });

      let vnpayRes;
      try {
        vnpayRes = await this.vnpayService.refundTransaction({
          merchantReference: refund.payments.merchant_reference,
          transactionNo: refund.payments.provider_transaction_id || undefined,
          amount: Number(refund.amount),
          transactionDate: refund.payments.paid_at || refund.payments.created_at,
          orderInfo:
            dto.reason ||
            refund.reason ||
            `Hoan tien don hang ${refund.payments.orders.order_code}`,
          createBy: adminId,
        });
      } catch (err: any) {
        // Rollback lại REQUESTED để Admin có thể thao tác lại
        await this.prisma.refunds.update({
          where: { id: rId },
          data: { status: refunds_status.REQUESTED },
        });
        throw err;
      }

      if (!vnpayRes.isSuccess) {
        // Rollback lại REQUESTED để Admin có thể thử lại hoặc dùng Bank chuyển khoản
        await this.prisma.refunds.update({
          where: { id: rId },
          data: { status: refunds_status.REQUESTED },
        });
        throw new BadRequestException(
          `Cổng VNPAY từ chối lệnh hoàn tiền (Mã: ${vnpayRes.responseCode}): ${vnpayRes.message}`,
        );
      }

      const updatedRefund = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM refunds WHERE id = ${rId} FOR UPDATE`;
        const lockedRefund = await tx.refunds.findUnique({
          where: { id: rId },
          include: { payments: { include: { orders: true } } },
        });

        await tx.refunds.update({
          where: { id: rId },
          data: {
            status: refunds_status.SUCCEEDED,
            provider_refund_id:
              vnpayRes.vnpTransactionNo ||
              dto.providerReference ||
              'VNPAY_API_REFUND',
            refunded_at: new Date(),
          },
        });

        const succeededRefunds = await tx.refunds.findMany({
          where: {
            payment_id: lockedRefund!.payment_id,
            status: refunds_status.SUCCEEDED,
          },
        });

        const totalSucceeded = succeededRefunds.reduce(
          (sum, r) => sum + Number(r.amount),
          0,
        );

        const originalAmount = Number(lockedRefund!.payments.amount);
        const finalPaymentStatus =
          totalSucceeded >= originalAmount
            ? orders_payment_status.REFUNDED
            : orders_payment_status.PARTIALLY_REFUNDED;

        await tx.orders.update({
          where: { id: lockedRefund!.payments.order_id },
          data: { payment_status: finalPaymentStatus },
        });

        await tx.order_events.create({
          data: {
            order_id: lockedRefund!.payments.order_id,
            actor_user_id: aId,
            event_type: 'REFUND_SUCCEEDED',
            from_status: lockedRefund!.payments.orders.status,
            to_status: lockedRefund!.payments.orders.status,
            note: JSON.stringify({
              action: 'VNPAY_REFUND_SUCCEEDED',
              refundId: refundId,
              amount: Number(lockedRefund!.amount),
              vnpResponse: vnpayRes,
            }),
          },
        });

        return tx.refunds.findUniqueOrThrow({
          where: { id: rId },
          include: { payments: true },
        });
      });

      return this.serializeRefund(updatedRefund);
    }

    if (dto.type === RefundCommandType.CONFIRM_MANUAL_SUCCESS) {
      // [BR-20] Hoàn thủ công bắt buộc có mã chứng từ và lý do đối soát
      if (!dto.providerReference || dto.providerReference.trim().length === 0) {
        throw new BadRequestException(
          'Xác nhận hoàn tiền thủ công bắt buộc phải cung cấp mã chứng từ đối soát (providerReference) theo quy tắc BR-20!',
        );
      }

      if (
        currentStatus !== refunds_status.REQUESTED &&
        currentStatus !== refunds_status.PROCESSING
      ) {
        throw new BadRequestException(
          `Không thể xác nhận hoàn tiền thành công từ trạng thái: "${currentStatus}".`,
        );
      }

      const updatedRefund = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM refunds WHERE id = ${rId} FOR UPDATE`;
        const lockedRefund = await tx.refunds.findUnique({
          where: { id: rId },
          include: { payments: { include: { orders: true } } },
        });
        if (
          !lockedRefund ||
          (lockedRefund.status !== refunds_status.REQUESTED &&
            lockedRefund.status !== refunds_status.PROCESSING)
        ) {
          throw new ConflictException(
            'Yêu cầu hoàn tiền đã được xử lý bởi thao tác khác.',
          );
        }

        const order = lockedRefund.payments.orders;
        const updateResult = await tx.refunds.updateMany({
          where: {
            id: rId,
            status: {
              in: [refunds_status.REQUESTED, refunds_status.PROCESSING],
            },
          },
          data: {
            status: refunds_status.SUCCEEDED,
            provider_refund_id: dto.providerReference,
            refunded_at: new Date(),
          },
        });

        if (updateResult.count !== 1) {
          throw new ConflictException(
            'Yêu cầu hoàn tiền đã được xử lý bởi thao tác khác.',
          );
        }

        const u = await tx.refunds.findUniqueOrThrow({
          where: { id: rId },
          include: { payments: true },
        });

        // Tính lại tổng số tiền đã hoàn thành công cho payment này
        const succeededRefunds = await tx.refunds.findMany({
          where: {
            payment_id: lockedRefund.payment_id,
            status: refunds_status.SUCCEEDED,
          },
        });

        const totalSucceeded = succeededRefunds.reduce(
          (sum, r) => sum + Number(r.amount),
          0,
        );
        const originalAmount = Number(lockedRefund.payments.amount);

        const newPaymentStatus =
          totalSucceeded >= originalAmount
            ? orders_payment_status.REFUNDED
            : orders_payment_status.PARTIALLY_REFUNDED;

        await tx.orders.update({
          where: { id: order.id },
          data: { payment_status: newPaymentStatus },
        });

        await tx.order_events.create({
          data: {
            order_id: order.id,
            actor_user_id: aId,
            event_type: 'REFUND_SUCCEEDED',
            from_status: order.status,
            to_status: order.status,
            note: JSON.stringify({
              action: 'REFUND_SUCCEEDED',
              refundId: refundId,
              amount: Number(lockedRefund.amount),
              providerReference: dto.providerReference,
              commandKey: dto.commandKey,
              reason: dto.reason || 'Xác nhận hoàn tiền thành công',
            }),
          },
        });

        return u;
      });

      return this.serializeRefund(updatedRefund);
    }

    if (dto.type === RefundCommandType.MARK_FAILED) {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM refunds WHERE id = ${rId} FOR UPDATE`;
        const transition = await tx.refunds.updateMany({
          where: {
            id: rId,
            status: {
              in: [refunds_status.REQUESTED, refunds_status.PROCESSING],
            },
          },
          data: { status: refunds_status.FAILED },
        });
        if (transition.count !== 1) {
          throw new ConflictException(
            'Yêu cầu hoàn tiền đã được xử lý bởi thao tác khác.',
          );
        }

        await tx.order_events.create({
          data: {
            order_id: refund.payments.order_id,
            actor_user_id: aId,
            event_type: 'REFUND_FAILED',
            from_status: refund.payments.orders.status,
            to_status: refund.payments.orders.status,
            note: JSON.stringify({
              action: 'REFUND_FAILED',
              refundId: refundId,
              commandKey: dto.commandKey,
              reason: dto.reason || 'Lệnh hoàn tiền thất bại',
            }),
          },
        });

        return tx.refunds.findUniqueOrThrow({
          where: { id: rId },
          include: { payments: true },
        });
      });

      return this.serializeRefund(updated);
    }

    throw new BadRequestException('Loại lệnh hoàn tiền không được hỗ trợ.');
  }
}
