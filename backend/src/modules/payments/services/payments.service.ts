import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../../database/prisma.service.js';
import { VnpayService } from './vnpay.service.js';
import { PaymentMapper } from '../application/mappers/payment.mapper.js';
import { CreatePaymentAttemptDto } from '../dto/create-payment-attempt.dto.js';
import { QueryPaymentsDto } from '../dto/query-payments.dto.js';
import {
  payments_status,
  payments_provider,
  payment_events_processing_status,
  orders_status,
  orders_payment_status,
  orders_payment_method,
  coupon_redemptions_status,
  Prisma,
} from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vnpayService: VnpayService,
    private readonly configService: ConfigService,
  ) {}

  public serializePayment(p: any) {
    return PaymentMapper.toSerializedPayment(p);
  }

  // 1. Tạo hoặc tái sử dụng lần thử thanh toán trực tuyến (API-42)
  async createPaymentAttempt(
    userId: string,
    orderId: string,
    ipAddr: string,
    _dto: CreatePaymentAttemptDto,
  ) {
    const isNumeric = /^\d+$/.test(orderId);
    const order = await this.prisma.orders.findFirst({
      where: isNumeric
        ? { OR: [{ id: BigInt(orderId) }, { order_code: orderId }] }
        : { order_code: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng ID ${orderId}.`);
    }

    const oId = order.id;
    const uId = BigInt(userId);

    if (order.user_id !== uId) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện thanh toán cho đơn hàng này.',
      );
    }

    if (order.payment_method !== orders_payment_method.VNPAY) {
      throw new BadRequestException(
        'Đơn hàng này không sử dụng phương thức thanh toán trực tuyến VNPay.',
      );
    }

    if (order.payment_status === orders_payment_status.PAID) {
      throw new BadRequestException('Đơn hàng này đã được thanh toán đầy đủ.');
    }

    if (order.status === orders_status.CANCELLED) {
      throw new BadRequestException(
        'Đơn hàng này đã bị hủy, không thể thực hiện thanh toán.',
      );
    }

    if (order.status !== orders_status.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Trạng thái đơn hàng (${order.status}) hiện không cho phép tạo giao dịch thanh toán.`,
      );
    }

    const totalAmount = Number(order.total_amount);
    if (totalAmount <= 0) {
      throw new BadRequestException(
        'Đơn hàng có số tiền 0đ không cần thanh toán qua cổng trực tuyến (BR-15).',
      );
    }

    const now = new Date();
    const attempt = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${oId} FOR UPDATE`;

      const currentOrder = await tx.orders.findUnique({ where: { id: oId } });
      if (!currentOrder || currentOrder.user_id !== uId) {
        throw new ForbiddenException(
          'Bạn không có quyền thực hiện thanh toán cho đơn hàng này.',
        );
      }
      if (
        currentOrder.status !== orders_status.PENDING_PAYMENT ||
        currentOrder.payment_status === orders_payment_status.PAID
      ) {
        throw new BadRequestException(
          'Trạng thái đơn hàng hiện không cho phép tạo giao dịch thanh toán.',
        );
      }
      if (
        currentOrder.payment_deadline &&
        currentOrder.payment_deadline <= now
      ) {
        throw new BadRequestException('Đơn hàng đã hết thời hạn thanh toán.');
      }

      await tx.payments.updateMany({
        where: {
          order_id: oId,
          provider: payments_provider.VNPAY,
          status: payments_status.PENDING,
          expires_at: { lte: now },
        },
        data: { status: payments_status.EXPIRED },
      });

      const existingPending = await tx.payments.findFirst({
        where: {
          order_id: oId,
          provider: payments_provider.VNPAY,
          status: payments_status.PENDING,
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        },
        orderBy: { created_at: 'desc' },
      });

      if (existingPending) {
        return {
          payment: existingPending,
          orderCode: currentOrder.order_code,
          reused: true,
        };
      }

      const randomHex = randomBytes(3).toString('hex').toUpperCase();
      const merchantReference = `VV-PAY-${currentOrder.order_code}-${randomHex}`;
      const timeoutMinutes =
        Number(
          this.configService.get<string>('PAYMENT_TIMEOUT_MINUTES', '15'),
        ) || 15;
      const expiresAt =
        currentOrder.payment_deadline ||
        new Date(now.getTime() + timeoutMinutes * 60 * 1000);

      const payment = await tx.payments.create({
        data: {
          order_id: oId,
          provider: payments_provider.VNPAY,
          merchant_reference: merchantReference,
          amount: currentOrder.total_amount,
          currency: 'VND',
          status: payments_status.PENDING,
          expires_at: expiresAt,
        },
      });

      return { payment, orderCode: currentOrder.order_code, reused: false };
    });

    const payment = attempt.payment;

    const redirectUrl = this.vnpayService.buildPaymentUrl({
      merchantReference: payment.merchant_reference,
      amount: Number(payment.amount),
      orderInfo: `Thanh toan don hang ${attempt.orderCode}`,
      ipAddr,
      createDate: payment.created_at,
      expireDate: payment.expires_at || undefined,
    });

    return {
      paymentId: payment.id.toString(),
      merchantReference: payment.merchant_reference,
      status: payment.status,
      amount: Number(payment.amount),
      redirectUrl,
      expiresAt: payment.expires_at,
      reused: attempt.reused,
    };
  }

  // 2. Lấy danh sách thanh toán của một đơn hàng (API-43)
  async getPaymentsByOrder(userId: string, orderId: string, role: string) {
    const oId = BigInt(orderId);
    const order = await this.prisma.orders.findUnique({
      where: { id: oId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng ID ${orderId}.`);
    }

    if (
      role !== 'ADMIN' &&
      role !== 'OPERATOR' &&
      order.user_id !== BigInt(userId)
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xem thông tin thanh toán của đơn hàng này.',
      );
    }

    const payments = await this.prisma.payments.findMany({
      where: { order_id: oId },
      include: { refunds: true },
      orderBy: { created_at: 'desc' },
    });

    return payments.map((p) => this.serializePayment(p));
  }

  // 3. Xử lý xác nhận thanh toán VNPAY thành công (Idempotent - an toàn gọi từ cả Return URL và IPN Webhook)
  public async settleVnpaySuccess(
    merchantReference: string,
    vnpTransactionNo: string,
    vnpAmount: number,
    queryParams: Record<string, any>,
    source: 'RETURN_URL' | 'IPN_WEBHOOK',
  ): Promise<{ isSuccess: boolean; orderCode?: string }> {
    const payment = await this.prisma.payments.findUnique({
      where: { merchant_reference: merchantReference },
      include: { orders: true },
    });

    if (!payment) {
      this.logger.warn(
        `[VNPay ${source}] Không tìm thấy payment với Ref: ${merchantReference}`,
      );
      return { isSuccess: false };
    }

    const paymentAmount = Number(payment.amount);
    if (Math.round(paymentAmount) !== vnpAmount && vnpAmount > 0) {
      this.logger.warn(
        `[VNPay ${source}] Sai lệch số tiền: DB=${paymentAmount}, VNPay=${vnpAmount}`,
      );
      return { isSuccess: false };
    }

    // Nếu payment đã xử lý thành công rồi (Idempotency check)
    if (payment.status === payments_status.SUCCEEDED) {
      this.logger.log(
        `[VNPay ${source}] Giao dịch ${merchantReference} đã được xác nhận thành công trước đó.`,
      );
      return { isSuccess: true, orderCode: payment.orders?.order_code };
    }

    // Lưu / Cập nhật payment_events
    const eventKey = `${merchantReference}_${vnpTransactionNo || Date.now()}`;
    await this.prisma.payment_events.upsert({
      where: {
        provider_event_key: {
          provider: 'VNPAY',
          event_key: eventKey,
        },
      },
      update: {
        payload: queryParams,
        signature_valid: true,
      },
      create: {
        payment_id: payment.id,
        provider: 'VNPAY',
        event_key: eventKey,
        signature_valid: true,
        payload: queryParams,
        processing_status: payment_events_processing_status.RECEIVED,
      },
    });

    // Thực thi cập nhật trạng thái trong Transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${payment.order_id} FOR UPDATE`;
      const currentOrder = await tx.orders.findUnique({
        where: { id: payment.order_id },
      });
      if (!currentOrder) return;

      const updateResult = await tx.payments.updateMany({
        where: {
          id: payment.id,
          status: payments_status.PENDING,
        },
        data: {
          status: payments_status.SUCCEEDED,
          paid_at: new Date(),
          provider_transaction_id: vnpTransactionNo,
        },
      });

      if (updateResult.count === 0) {
        return; // Đã được xử lý bởi request đồng thời khác
      }

      if (currentOrder.status === orders_status.CANCELLED) {
        await tx.orders.update({
          where: { id: currentOrder.id },
          data: {
            payment_status: orders_payment_status.PAID,
          },
        });

        await tx.order_events.create({
          data: {
            order_id: currentOrder.id,
            actor_user_id: null,
            event_type: 'PAYMENT_RECEIVED_AFTER_CANCEL',
            from_status: currentOrder.status,
            to_status: currentOrder.status,
            note: JSON.stringify({
              source,
              reason:
                'Khách thanh toán trực tuyến thành công sau khi đơn đã hủy. Chờ đối soát và hoàn tiền.',
              transactionNo: vnpTransactionNo,
              amount: vnpAmount,
            }),
          },
        });
      } else {
        await tx.orders.update({
          where: { id: currentOrder.id },
          data: {
            payment_status: orders_payment_status.PAID,
            status: orders_status.PENDING_CONFIRMATION,
          },
        });

        await tx.order_events.create({
          data: {
            order_id: currentOrder.id,
            actor_user_id: null,
            event_type: 'PAYMENT_SUCCESS',
            from_status: currentOrder.status,
            to_status: orders_status.PENDING_CONFIRMATION,
            note: JSON.stringify({
              source,
              reason:
                'Thanh toán trực tuyến VNPay thành công. Đơn hàng chuyển sang chờ lễ tân/nhà hàng xác nhận.',
              transactionNo: vnpTransactionNo,
              amount: vnpAmount,
            }),
          },
        });
      }

      await tx.payment_events.updateMany({
        where: {
          provider: 'VNPAY',
          event_key: eventKey,
        },
        data: {
          processing_status: payment_events_processing_status.PROCESSED,
          processed_at: new Date(),
        },
      });
    });

    this.logger.log(
      `[VNPay ${source}] Đã xác nhận thành công thanh toán cho đơn #${payment.orders?.order_code}`,
    );

    return { isSuccess: true, orderCode: payment.orders?.order_code };
  }

  // 3. Tiếp nhận Return URL từ VNPay (API-44)
  async handleVnpayReturn(queryParams: Record<string, any>) {
    const isValid = this.vnpayService.verifySecureHash(queryParams);
    const merchantReference = String(queryParams['vnp_TxnRef'] || '');
    const responseCode = String(queryParams['vnp_ResponseCode'] || '');
    const transactionNo = String(queryParams['vnp_TransactionNo'] || '');
    const vnpAmountRaw = Number(queryParams['vnp_Amount']) || 0;
    const vnpAmount = Math.round(vnpAmountRaw / 100);

    let orderCode = '';
    const isSuccess = isValid && responseCode === '00';

    if (isSuccess) {
      // Cập nhật ngay lập tức vào database, không chờ IPN
      const settleResult = await this.settleVnpaySuccess(
        merchantReference,
        transactionNo,
        vnpAmount,
        queryParams,
        'RETURN_URL',
      );
      if (settleResult.orderCode) {
        orderCode = settleResult.orderCode;
      }
    }

    if (!orderCode) {
      const payment = await this.prisma.payments.findUnique({
        where: { merchant_reference: merchantReference },
        include: {
          orders: { select: { order_code: true } },
        },
      });
      orderCode = payment?.orders?.order_code || '';
    }

    let frontendBaseUrl =
      this.configService.get<string>('FRONTEND_PAYMENT_RESULT_URL') ||
      'https://vi-viet-1whr.vercel.app/thanh-toan/ket-qua';

    if (
      this.configService.get<string>('NODE_ENV') === 'production' &&
      frontendBaseUrl.includes('localhost')
    ) {
      frontendBaseUrl = 'https://vi-viet-1whr.vercel.app/thanh-toan/ket-qua';
    }

    const statusParam = isSuccess ? 'success' : 'failed';

    const targetUrl = `${frontendBaseUrl}?orderCode=${encodeURIComponent(
      orderCode,
    )}&merchantRef=${encodeURIComponent(
      merchantReference,
    )}&status=${statusParam}&responseCode=${encodeURIComponent(
      responseCode,
    )}&transactionNo=${encodeURIComponent(
      transactionNo,
    )}&validSignature=${isValid}`;

    return { redirectUrl: targetUrl };
  }

  // 4. Tiếp nhận IPN Webhook Server-to-Server từ VNPay (API-45)
  async handleVnpayIpn(queryParams: Record<string, any>) {
    // 4.1. Kiểm tra chữ ký số HMAC-SHA512
    const isValidSignature = this.vnpayService.verifySecureHash(queryParams);
    if (!isValidSignature) {
      this.logger.warn('[VNPay IPN] Chữ ký không hợp lệ (RspCode 97)');
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const merchantReference = String(queryParams['vnp_TxnRef'] || '');
    const vnpTransactionNo = String(queryParams['vnp_TransactionNo'] || '');
    const responseCode = String(queryParams['vnp_ResponseCode'] || '');
    const vnpAmountRaw = Number(queryParams['vnp_Amount']) || 0;
    const vnpAmount = Math.round(vnpAmountRaw / 100);

    // 4.2. Tìm bản ghi payment theo merchant_reference
    const payment = await this.prisma.payments.findUnique({
      where: { merchant_reference: merchantReference },
      include: { orders: true },
    });

    if (!payment) {
      this.logger.warn(
        `[VNPay IPN] Không tìm thấy payment với Ref: ${merchantReference} (RspCode 01)`,
      );
      return { RspCode: '01', Message: 'Order not found' };
    }

    // 4.3. Kiểm tra số tiền khớp với dữ liệu hệ thống
    const paymentAmount = Number(payment.amount);
    if (Math.round(paymentAmount) !== vnpAmount) {
      this.logger.warn(
        `[VNPay IPN] Sai lệch số tiền: DB=${paymentAmount}, VNPay=${vnpAmount} (RspCode 04)`,
      );
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    // 4.4. Kiểm tra xem giao dịch đã được xử lý trước đó chưa (Chống lặp IPN - AC-09)
    if (payment.status !== payments_status.PENDING) {
      this.logger.log(
        `[VNPay IPN] Giao dịch ${merchantReference} đã được xác nhận trước đó (RspCode 02)`,
      );
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // 4.5. Nếu thành công, gọi settleVnpaySuccess
    if (responseCode === '00') {
      await this.settleVnpaySuccess(
        merchantReference,
        vnpTransactionNo,
        vnpAmount,
        queryParams,
        'IPN_WEBHOOK',
      );
      return { RspCode: '00', Message: 'Confirm Success' };
    }

    // 4.6. Nếu thất bại / Khách hủy giao dịch tại cổng
    const eventKey = `${merchantReference}_${vnpTransactionNo || Date.now()}`;
    await this.prisma.payment_events.upsert({
      where: {
        provider_event_key: {
          provider: 'VNPAY',
          event_key: eventKey,
        },
      },
      update: { payload: queryParams, signature_valid: true },
      create: {
        payment_id: payment.id,
        provider: 'VNPAY',
        event_key: eventKey,
        signature_valid: true,
        payload: queryParams,
        processing_status: payment_events_processing_status.RECEIVED,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${payment.order_id} FOR UPDATE`;
      const currentOrder = await tx.orders.findUnique({
        where: { id: payment.order_id },
      });
      if (!currentOrder) return;

      const updateResult = await tx.payments.updateMany({
        where: {
          id: payment.id,
          status: payments_status.PENDING,
        },
        data: {
          status: payments_status.FAILED,
          provider_transaction_id: vnpTransactionNo,
        },
      });

      if (updateResult.count === 0) return;

      await tx.order_events.create({
        data: {
          order_id: payment.order_id,
          actor_user_id: null,
          event_type: 'PAYMENT_FAILED',
          from_status: currentOrder.status,
          to_status: currentOrder.status,
          note: JSON.stringify({
            reason: `Thanh toán qua cổng VNPay không thành công (ResponseCode: ${responseCode}).`,
            transactionNo: vnpTransactionNo,
          }),
        },
      });

      await tx.payment_events.updateMany({
        where: {
          provider: 'VNPAY',
          event_key: eventKey,
        },
        data: {
          processing_status: payment_events_processing_status.PROCESSED,
          processed_at: new Date(),
          error_note: `Giao dịch thất bại với mã lỗi ${responseCode}`,
        },
      });
    });

    this.logger.log(
      `[VNPay IPN] Đã ghi nhận giao dịch thất bại cho Ref: ${merchantReference} (RspCode 00)`,
    );
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  // 5. Admin tra cứu danh sách thanh toán (API-46)
  async findAllAdmin(query: QueryPaymentsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.paymentsWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.order_id) {
      where.order_id = BigInt(query.order_id);
    }

    if (query.merchant_reference) {
      where.merchant_reference = { contains: query.merchant_reference };
    }

    if (query.from || query.to) {
      where.created_at = {};
      if (query.from) {
        where.created_at.gte = new Date(query.from);
      }
      if (query.to) {
        where.created_at.lte = new Date(query.to);
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.payments.count({ where }),
      this.prisma.payments.findMany({
        where,
        skip,
        take: limit,
        include: {
          orders: {
            select: {
              id: true,
              order_code: true,
              status: true,
              payment_status: true,
              total_amount: true,
            },
          },
          refunds: true,
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      items: items.map((p) => this.serializePayment(p)),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  // 6. Admin đối soát giao dịch (API-47)
  async reconcilePayment(
    adminId: string,
    paymentId: string,
    commandKey: string,
    reason?: string,
  ) {
    const pId = BigInt(paymentId);
    const aId = BigInt(adminId);

    const payment = await this.prisma.payments.findUnique({
      where: { id: pId },
      include: { orders: true, refunds: true },
    });

    if (!payment) {
      throw new NotFoundException(`Không tìm thấy thanh toán ID ${paymentId}.`);
    }

    await this.prisma.order_events.create({
      data: {
        order_id: payment.order_id,
        actor_user_id: aId,
        event_type: 'RECONCILE_PAYMENT',
        from_status: payment.orders.status,
        to_status: payment.orders.status,
        note: JSON.stringify({
          action: 'RECONCILE_PAYMENT',
          paymentId: paymentId,
          commandKey,
          reason: reason || 'Admin đối soát giao dịch',
        }),
      },
    });

    return this.serializePayment(payment);
  }
}
