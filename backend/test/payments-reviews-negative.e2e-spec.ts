import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import * as crypto from 'crypto';
import { createE2eApp } from './setup/create-e2e-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import {
  dishes_availability,
  orders_status,
  orders_payment_status,
  payments_status,
  reviews_visibility,
} from '@prisma/client';

describe('Payments & Reviews Module Negative & Security E2E Testing (BR-14 to BR-20, BR-24, BR-25, AC-16)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const testEmailCustomer1 = `neg_cust1_${Date.now()}@viviet.test`;
  const testEmailCustomer2 = `neg_cust2_${Date.now()}@viviet.test`;
  let customer1Token: string;
  let customer1Id: string;
  let customer2Token: string;
  let customer2Id: string;

  let adminToken: string;
  let adminUserId: bigint;

  let testCategoryId: bigint;
  let testDishId: bigint;
  let testVariantId: bigint;

  let vnpayOrderId: bigint;
  let codOrderId: bigint;
  let paidOrderId: bigint;
  let preparingOrderId: bigint;

  let validPaymentId: bigint;
  let validMerchantRef: string;

  let orderItemIdPaidOrder: bigint;
  let orderItemIdPreparingOrder: bigint;

  const jwtSecret = 'vi_viet_super_secret_jwt_access_token_key_2026';
  const hashSecret = (
    process.env.VNP_HASH_SECRET ||
    process.env.VNPAY_HASH_SECRET ||
    'TEST_SECRET'
  ).trim();

  function generateVnpayHash(params: Record<string, any>): string {
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (
        k !== 'vnp_SecureHash' &&
        k !== 'vnp_SecureHashType' &&
        v !== undefined &&
        v !== null &&
        v !== ''
      ) {
        filtered[k] = String(v);
      }
    }
    const sortedKeys = Object.keys(filtered).sort();
    const signParts: string[] = [];
    for (const k of sortedKeys) {
      signParts.push(
        `${encodeURIComponent(k)}=${encodeURIComponent(filtered[k])}`,
      );
    }
    return crypto
      .createHmac('sha512', hashSecret)
      .update(Buffer.from(signParts.join('&'), 'utf-8'))
      .digest('hex');
  }

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // 1. Tạo Customer 1
    const cust1 = await prisma.users.create({
      data: {
        email: testEmailCustomer1,
        password_hash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
        full_name: 'Khách Tiêu Cực 1',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customer1Id = cust1.id.toString();
    customer1Token = await jwtService.signAsync(
      {
        sub: customer1Id,
        email: cust1.email,
        role: cust1.role,
        status: cust1.status,
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );

    // 2. Tạo Customer 2
    const cust2 = await prisma.users.create({
      data: {
        email: testEmailCustomer2,
        password_hash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
        full_name: 'Khách Tiêu Cực 2',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customer2Id = cust2.id.toString();
    customer2Token = await jwtService.signAsync(
      {
        sub: customer2Id,
        email: cust2.email,
        role: cust2.role,
        status: cust2.status,
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );

    // 3. Tạo Admin User
    const adminUser = await prisma.users.create({
      data: {
        email: `neg_admin_${Date.now()}@viviet.test`,
        password_hash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
        full_name: 'Quản Trị Tiêu Cực',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    adminUserId = adminUser.id;
    adminToken = await jwtService.signAsync(
      {
        sub: adminUserId.toString(),
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status,
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );

    // 4. Tạo Category, Dish, Variant
    const cat = await prisma.categories.create({
      data: {
        name: 'Negative Test Category',
        slug: `neg-cat-${Date.now()}`,
        is_active: true,
      },
    });
    testCategoryId = cat.id;

    const dish = await prisma.dishes.create({
      data: {
        category_id: testCategoryId,
        name: 'Món Test Negative',
        slug: `mon-neg-${Date.now()}`,
        availability: dishes_availability.AVAILABLE,
      },
    });
    testDishId = dish.id;

    const variant = await prisma.dish_variants.create({
      data: {
        dish_id: testDishId,
        name: 'Phần Tiêu Chuẩn',
        price: 45000,
        is_active: true,
      },
    });
    testVariantId = variant.id;

    // 5. Tạo các đơn hàng với các trạng thái khác nhau
    // Đơn 1: PENDING_PAYMENT (VNPAY)
    const o1 = await prisma.orders.create({
      data: {
        order_code: `VV-NEG-VNPAY-${Date.now()}`,
        checkout_key: `chk_neg_1_${Date.now()}`,
        user_id: cust1.id,
        fulfillment_type: 'PICKUP',
        payment_method: 'VNPAY',
        status: orders_status.PENDING_PAYMENT,
        payment_status: orders_payment_status.UNPAID,
        recipient_name: 'Khách 1',
        recipient_phone: '0901234567',
        subtotal: 45000,
        total_amount: 45000,
      },
    });
    vnpayOrderId = o1.id;

    // Đơn 2: COD (PENDING_CONFIRMATION)
    const o2 = await prisma.orders.create({
      data: {
        order_code: `VV-NEG-COD-${Date.now()}`,
        checkout_key: `chk_neg_2_${Date.now()}`,
        user_id: cust1.id,
        fulfillment_type: 'PICKUP',
        payment_method: 'COD',
        status: orders_status.PENDING_CONFIRMATION,
        payment_status: orders_payment_status.UNPAID,
        recipient_name: 'Khách 1',
        recipient_phone: '0901234567',
        subtotal: 45000,
        total_amount: 45000,
      },
    });
    codOrderId = o2.id;

    // Đơn 3: Đã thanh toán (CONFIRMED & PAID)
    const o3 = await prisma.orders.create({
      data: {
        order_code: `VV-NEG-PAID-${Date.now()}`,
        checkout_key: `chk_neg_3_${Date.now()}`,
        user_id: cust1.id,
        fulfillment_type: 'PICKUP',
        payment_method: 'VNPAY',
        status: orders_status.CONFIRMED,
        payment_status: orders_payment_status.PAID,
        recipient_name: 'Khách 1',
        recipient_phone: '0901234567',
        subtotal: 45000,
        total_amount: 45000,
      },
    });
    paidOrderId = o3.id;

    const item3 = await prisma.order_items.create({
      data: {
        order_id: paidOrderId,
        dish_id: testDishId,
        variant_id: testVariantId,
        dish_name: 'Món Test Negative',
        variant_name: 'Phần Tiêu Chuẩn',
        base_price: 45000,
        options_price: 0,
        quantity: 1,
        line_total: 45000,
      },
    });
    orderItemIdPaidOrder = item3.id;

    // Đơn 4: Đang nấu PREPARING (Chưa hoàn thành để test review)
    const o4 = await prisma.orders.create({
      data: {
        order_code: `VV-NEG-PREP-${Date.now()}`,
        checkout_key: `chk_neg_4_${Date.now()}`,
        user_id: cust1.id,
        fulfillment_type: 'PICKUP',
        payment_method: 'COD',
        status: orders_status.PREPARING,
        payment_status: orders_payment_status.UNPAID,
        recipient_name: 'Khách 1',
        recipient_phone: '0901234567',
        subtotal: 45000,
        total_amount: 45000,
      },
    });
    preparingOrderId = o4.id;

    const item4 = await prisma.order_items.create({
      data: {
        order_id: preparingOrderId,
        dish_id: testDishId,
        variant_id: testVariantId,
        dish_name: 'Món Test Negative',
        variant_name: 'Phần Tiêu Chuẩn',
        base_price: 45000,
        options_price: 0,
        quantity: 1,
        line_total: 45000,
      },
    });
    orderItemIdPreparingOrder = item4.id;

    // Tạo sẵn 1 payment hợp lệ cho vnpayOrderId
    validMerchantRef = `VV-PAY-NEG-${Date.now()}`;
    const p1 = await prisma.payments.create({
      data: {
        order_id: vnpayOrderId,
        provider: 'VNPAY',
        merchant_reference: validMerchantRef,
        amount: 45000,
        currency: 'VND',
        status: payments_status.PENDING,
      },
    });
    validPaymentId = p1.id;
  });

  afterAll(async () => {
    try {
      await prisma.order_events.deleteMany({
        where: {
          orders: {
            user_id: {
              in: [BigInt(customer1Id), BigInt(customer2Id), adminUserId],
            },
          },
        },
      });
      const testPaymentIds = await prisma.payments.findMany({
        where: {
          orders: {
            user_id: {
              in: [BigInt(customer1Id), BigInt(customer2Id), adminUserId],
            },
          },
        },
        select: { id: true },
      });
      await prisma.payment_events.deleteMany({
        where: {
          payment_id: { in: testPaymentIds.map((payment) => payment.id) },
        },
      });
      await prisma.refunds.deleteMany({ where: { requested_by: adminUserId } });
      await prisma.payments.deleteMany({
        where: {
          orders: {
            user_id: {
              in: [BigInt(customer1Id), BigInt(customer2Id), adminUserId],
            },
          },
        },
      });
      await prisma.reviews.deleteMany({
        where: { order_items: { dish_id: testDishId } },
      });
      await prisma.order_items.deleteMany({ where: { dish_id: testDishId } });
      await prisma.orders.deleteMany({
        where: {
          user_id: {
            in: [BigInt(customer1Id), BigInt(customer2Id), adminUserId],
          },
        },
      });
      await prisma.dish_variants.deleteMany({ where: { dish_id: testDishId } });
      await prisma.dishes.deleteMany({ where: { id: testDishId } });
      await prisma.categories.deleteMany({ where: { id: testCategoryId } });
      await prisma.users.deleteMany({
        where: {
          id: { in: [BigInt(customer1Id), BigInt(customer2Id), adminUserId] },
        },
      });
    } catch {
      // Bỏ qua lỗi cleanup
    }
    await app.close();
  });

  // =========================================================================
  // PHẦN 1: NEGATIVE TESTS CHO PAYMENT ATTEMPTS
  // =========================================================================
  describe('1. Kiểm thử tiêu cực cho Payment Attempts (API-42)', () => {
    it('1.1 Tạo payment attempt cho order ID không tồn tại -> 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders/999999999/payment-attempts')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ provider: 'VNPAY' });

      expect(res.status).toBe(404);
    });

    it('1.2 Tạo payment attempt với order ID sai định dạng số -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders/abc-invalid-id/payment-attempts')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ provider: 'VNPAY' });

      expect(res.status).toBe(400);
    });

    it('1.3 Customer 2 cố tạo payment attempt cho đơn của Customer 1 -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${vnpayOrderId}/payment-attempts`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ provider: 'VNPAY' });

      expect(res.status).toBe(403);
    });

    it('1.4 Cố tạo payment attempt cho đơn hàng COD -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${codOrderId}/payment-attempts`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ provider: 'VNPAY' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'không sử dụng phương thức thanh toán trực tuyến VNPay',
      );
    });

    it('1.5 Cố tạo payment attempt cho đơn hàng đã PAID -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${paidOrderId}/payment-attempts`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ provider: 'VNPAY' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('đã được thanh toán đầy đủ');
    });

    it('1.6 Gửi provider không hợp lệ (ví dụ: MOMO_UNSUPPORTED) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${vnpayOrderId}/payment-attempts`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ provider: 'MOMO_UNSUPPORTED' });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // PHẦN 2: NEGATIVE TESTS CHO VNPAY IPN WEBHOOK
  // =========================================================================
  describe('2. Kiểm thử bảo mật cho VNPay IPN Webhook (API-45)', () => {
    it('2.1 IPN không có chữ ký SecureHash -> Trả RspCode 97 (Invalid Checksum)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query({
          vnp_TxnRef: validMerchantRef,
          vnp_Amount: '4500000',
          vnp_ResponseCode: '00',
        });

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('97');
    });

    it('2.2 IPN bị giả mạo chữ ký (Tampered HMAC) -> Trả RspCode 97 (Invalid Checksum)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query({
          vnp_TxnRef: validMerchantRef,
          vnp_Amount: '4500000',
          vnp_ResponseCode: '00',
          vnp_SecureHash: 'c0ffeec0ffeec0ffeec0ffeec0ffeec0ffee123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('97');
    });

    it('2.3 IPN có chữ ký đúng nhưng TxnRef không tồn tại -> Trả RspCode 01 (Order not found)', async () => {
      const queryParams: Record<string, string> = {
        vnp_Amount: '4500000',
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'NON_EXISTENT_TXN_REF_99999',
      };
      queryParams['vnp_SecureHash'] = generateVnpayHash(queryParams);

      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query(queryParams);

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('01');
    });

    it('2.4 IPN có số tiền bị sửa đổi thấp hơn (Tampered Amount) -> Trả RspCode 04 (Invalid amount)', async () => {
      const queryParams: Record<string, string> = {
        vnp_Amount: '100000', // 1.000đ thay vì 45.000đ
        vnp_ResponseCode: '00',
        vnp_TxnRef: validMerchantRef,
      };
      queryParams['vnp_SecureHash'] = generateVnpayHash(queryParams);

      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query(queryParams);

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('04');
    });
  });

  // =========================================================================
  // PHẦN 3: NEGATIVE TESTS CHO HOÀN TIỀN (REFUNDS - BR-19, BR-20)
  // =========================================================================
  describe('3. Kiểm thử tiêu cực cho Hoàn tiền (BR-19, BR-20)', () => {
    it('3.1 Chặn hoàn tiền cho giao dịch còn ở trạng thái PENDING -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/payments/${validPaymentId}/refunds`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 20000,
          reason: 'Cố hoàn tiền khi giao dịch chưa thành công',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Chỉ có thể hoàn tiền cho các giao dịch thanh toán đã thành công',
      );
    });

    it('3.2 Hoàn tiền với số tiền âm hoặc 0đ -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/payments/${validPaymentId}/refunds`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: -50000,
          reason: 'Số tiền âm',
        });

      expect(res.status).toBe(400);
    });

    it('3.3 User thường (CUSTOMER) cố tạo yêu cầu hoàn tiền -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/payments/${validPaymentId}/refunds`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          amount: 20000,
          reason: 'Khách hack quyền hoàn',
        });

      expect(res.status).toBe(403);
    });

    it('3.4 [BR-20] Lệnh xác nhận hoàn thủ công thiếu providerReference -> 400 Bad Request', async () => {
      // 1. Tạo 1 payment SUCCEEDED để test lệnh hoàn
      const succeededPayment = await prisma.payments.create({
        data: {
          order_id: paidOrderId,
          provider: 'VNPAY',
          merchant_reference: `VV-PAY-SUCC-${Date.now()}`,
          amount: 45000,
          currency: 'VND',
          status: payments_status.SUCCEEDED,
        },
      });

      // 2. Tạo yêu cầu hoàn
      const refund = await prisma.refunds.create({
        data: {
          payment_id: succeededPayment.id,
          refund_reference: `VV-REF-TEST-${Date.now()}`,
          amount: 20000,
          reason: 'Test lý do thiếu mã chứng từ',
          requested_by: adminUserId,
        },
      });

      // 3. Thực thi CONFIRM_MANUAL_SUCCESS nhưng bỏ trống providerReference
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/refunds/${refund.id}/commands`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'CONFIRM_MANUAL_SUCCESS',
          commandKey: `cmd_neg_${Date.now()}`,
          reason: 'Xác nhận hoàn',
          providerReference: '   ', // Chỉ khoảng trắng
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'bắt buộc phải cung cấp mã chứng từ đối soát',
      );
    });
  });

  // =========================================================================
  // PHẦN 4: NEGATIVE TESTS CHO ĐÁNH GIÁ MÓN ĂN (REVIEWS - BR-24, BR-25, AC-16)
  // =========================================================================
  describe('4. Kiểm thử tiêu cực cho Đánh giá món ăn (BR-24, BR-25, AC-16)', () => {
    it('4.1 [AC-16] Chặn đánh giá món ăn từ đơn chưa COMPLETED (đơn PREPARING) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${orderItemIdPreparingOrder}/review`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          rating: 5,
          content: 'Món ăn đang nấu, chưa giao mà cố đánh giá',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Chỉ có thể đánh giá món ăn khi đơn hàng đã hoàn thành',
      );
    });

    it('4.2 Customer 2 cố đánh giá món ăn thuộc đơn của Customer 1 -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${orderItemIdPaidOrder}/review`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          rating: 5,
          content: 'Cố tình đánh giá trộm',
        });

      expect(res.status).toBe(403);
    });

    it('4.3 Gửi rating = 0 (dưới mức tối thiểu 1 sao) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${orderItemIdPaidOrder}/review`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          rating: 0,
        });

      expect(res.status).toBe(400);
    });

    it('4.4 Gửi rating = 7 (vượt quá mức tối đa 5 sao) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${orderItemIdPaidOrder}/review`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          rating: 7,
        });

      expect(res.status).toBe(400);
    });

    it('4.5 Gửi nội dung nhận xét vượt quá 2.000 ký tự -> 400 Bad Request', async () => {
      const longContent = 'A'.repeat(2005);
      const res = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${orderItemIdPaidOrder}/review`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          rating: 5,
          content: longContent,
        });

      expect(res.status).toBe(400);
    });

    it('4.6 [BR-25] Admin ẩn đánh giá nhưng gửi moderationReason chỉ gồm khoảng trắng -> 400 Bad Request', async () => {
      // 1. Chuyển đơn 3 sang COMPLETED để tạo được 1 review mẫu
      await prisma.orders.update({
        where: { id: paidOrderId },
        data: { status: orders_status.COMPLETED, completed_at: new Date() },
      });

      const reviewRes = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${orderItemIdPaidOrder}/review`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          rating: 4,
          content: 'Món ăn khá vừa miệng',
        });
      expect(reviewRes.status).toBe(200);
      const revId = reviewRes.body.data.id;

      // 2. Admin cố ẩn nhưng gửi moderationReason rỗng
      const hideRes = await request(app.getHttpServer())
        .patch(`/api/v1/admin/reviews/${revId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          visibility: reviews_visibility.HIDDEN,
          moderationReason: '     ', // Khoảng trắng
        });

      expect(hideRes.status).toBe(400);
      expect(hideRes.body.message).toContain(
        'bắt buộc phải cung cấp lý do kiểm duyệt',
      );
    });

    it('4.7 User thường (CUSTOMER) cố truy cập API Admin quản trị đánh giá -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(403);
    });
  });
});
