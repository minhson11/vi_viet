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
  refunds_status,
} from '@prisma/client';

describe('Payments & VNPay & Refunds Module E2E Testing (BR-14 to BR-21, AC-09, AC-10)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const testEmailCustomer1 = `pay_cust1_${Date.now()}@viviet.test`;
  const testEmailCustomer2 = `pay_cust2_${Date.now()}@viviet.test`;
  let customer1Token: string;
  let customer1Id: string;
  let customer2Token: string;
  let customer2Id: string;

  let adminToken: string;
  let adminUserId: bigint;

  let testCategoryId: bigint;
  let testDishId: bigint;
  let testVariantId: bigint;

  let vnpayOrderId: string;
  let vnpayOrderCode: string;
  let codOrderId: string;
  let cancelledOrderId: string;

  let testMerchantRef: string;
  let testPaymentId: string;

  const hashSecret = (
    process.env.VNP_HASH_SECRET ||
    process.env.VNPAY_HASH_SECRET ||
    'TEST_SECRET'
  ).trim();

  // Helper tính chữ ký HMAC-SHA512 cho mock VNPay callback
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
    const signData = signParts.join('&');
    return crypto
      .createHmac('sha512', hashSecret)
      .update(Buffer.from(signData, 'utf-8'))
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
        full_name: 'Khách Thanh Toán 1',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    const jwtSecret = 'vi_viet_super_secret_jwt_access_token_key_2026';
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
        full_name: 'Khách Thanh Toán 2',
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
        email: `pay_admin_${Date.now()}@viviet.test`,
        password_hash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
        full_name: 'Quản Trị Viên Payments',
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

    // 4. Tạo Danh mục, Món ăn và Biến thể test
    const cat = await prisma.categories.create({
      data: {
        name: 'Thanh Toán Test Category',
        slug: `pay-cat-${Date.now()}`,
        is_active: true,
      },
    });
    testCategoryId = cat.id;

    const dish = await prisma.dishes.create({
      data: {
        category_id: testCategoryId,
        name: 'Món Thử Nghiệm Thanh Toán',
        slug: `mon-pay-test-${Date.now()}`,
        availability: dishes_availability.AVAILABLE,
      },
    });
    testDishId = dish.id;

    const variant = await prisma.dish_variants.create({
      data: {
        dish_id: testDishId,
        name: 'Phần Thường',
        price: 50000,
        is_active: true,
      },
    });
    testVariantId = variant.id;

    // 5. Chuẩn bị đơn hàng VNPAY (100.000đ)
    const cart1 = await prisma.carts.create({
      data: { user_id: cust1.id },
    });
    await prisma.cart_items.create({
      data: {
        cart_id: cart1.id,
        dish_id: testDishId,
        variant_id: testVariantId,
        quantity: 2,
      },
    });

    const vnpayCheckoutRes = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        checkout_key: `chk_pay_${Date.now()}_vnpay`,
        fulfillment_type: 'PICKUP',
        payment_method: 'VNPAY',
        recipient_name: 'Khách 1',
        recipient_phone: '0901234567',
      });
    expect(vnpayCheckoutRes.status).toBe(201);
    vnpayOrderId = vnpayCheckoutRes.body.data.id;
    vnpayOrderCode = vnpayCheckoutRes.body.data.order_code;

    // 6. Chuẩn bị đơn hàng COD
    await prisma.cart_items.create({
      data: {
        cart_id: cart1.id,
        dish_id: testDishId,
        variant_id: testVariantId,
        quantity: 1,
      },
    });

    const codCheckoutRes = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        checkout_key: `chk_pay_${Date.now()}_cod`,
        fulfillment_type: 'PICKUP',
        payment_method: 'COD',
        recipient_name: 'Khách 1',
        recipient_phone: '0901234567',
      });
    expect(codCheckoutRes.status).toBe(201);
    codOrderId = codCheckoutRes.body.data.id;

    // 7. Chuẩn bị đơn hàng VNPAY thứ hai rồi hủy (để test tiền về sau khi đơn đã hủy - AC-10)
    await prisma.cart_items.create({
      data: {
        cart_id: cart1.id,
        dish_id: testDishId,
        variant_id: testVariantId,
        quantity: 1,
      },
    });

    const cancelCheckoutRes = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        checkout_key: `chk_pay_${Date.now()}_cancel`,
        fulfillment_type: 'PICKUP',
        payment_method: 'VNPAY',
        recipient_name: 'Khách 1',
        recipient_phone: '0901234567',
      });
    cancelledOrderId = cancelCheckoutRes.body.data.id;

    // Khách hàng hủy đơn này
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${cancelledOrderId}/cancel`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ reason: 'Khách đổi ý hủy đơn' });
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu test
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
      await prisma.refunds.deleteMany({
        where: { requested_by: adminUserId },
      });
      await prisma.payments.deleteMany({
        where: {
          orders: {
            user_id: {
              in: [BigInt(customer1Id), BigInt(customer2Id), adminUserId],
            },
          },
        },
      });
      await prisma.order_item_options.deleteMany({
        where: { order_items: { dish_id: testDishId } },
      });
      await prisma.order_items.deleteMany({
        where: { dish_id: testDishId },
      });
      await prisma.orders.deleteMany({
        where: {
          user_id: {
            in: [BigInt(customer1Id), BigInt(customer2Id), adminUserId],
          },
        },
      });
      await prisma.cart_item_options.deleteMany({
        where: { cart_items: { dish_id: testDishId } },
      });
      await prisma.cart_items.deleteMany({
        where: { dish_id: testDishId },
      });
      await prisma.carts.deleteMany({
        where: { user_id: { in: [BigInt(customer1Id), BigInt(customer2Id)] } },
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
  // PHẦN 1: KHÁCH HÀNG TẠO LẦN THỬ THANH TOÁN (PAYMENT ATTEMPTS - API-42)
  // =========================================================================
  describe('1. Khách hàng tạo lần thử thanh toán trực tuyến (API-42)', () => {
    it('1.1 Chặn tạo payment attempt cho đơn hàng COD -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${codOrderId}/payment-attempts`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ provider: 'VNPAY' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'không sử dụng phương thức thanh toán trực tuyến VNPay',
      );
    });

    it('1.2 [Bảo mật] Customer 2 cố tạo payment attempt cho đơn của Customer 1 -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${vnpayOrderId}/payment-attempts`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ provider: 'VNPAY' });

      expect(res.status).toBe(403);
    });

    it('1.3 Khách tạo payment attempt hợp lệ cho đơn VNPAY -> 201 Created & Trả URL VNPay chuẩn', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${vnpayOrderId}/payment-attempts`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ provider: 'VNPAY' });

      expect(res.status).toBe(201);
      expect(res.body.data.redirectUrl).toBeDefined();
      expect(res.body.data.redirectUrl).toContain(
        'https://sandbox.vnpayment.vn',
      );
      expect(res.body.data.redirectUrl).toContain('vnp_SecureHash=');
      expect(res.body.data.merchantReference).toBeDefined();
      expect(res.body.data.reused).toBe(false);

      testMerchantRef = res.body.data.merchantReference;
      testPaymentId = res.body.data.paymentId;

      // Kiểm tra trong CSDL
      const p = await prisma.payments.findUnique({
        where: { id: BigInt(testPaymentId) },
      });
      expect(p).not.toBeNull();
      expect(p!.status).toBe(payments_status.PENDING);
      expect(Number(p!.amount)).toBe(100000);
    });

    it('1.4 [Chống Double-Click] Gọi lại ngay lần 2 khi attempt chưa hết hạn -> Tái sử dụng phiên cũ (reused: true)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${vnpayOrderId}/payment-attempts`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ provider: 'VNPAY' });

      expect(res.status).toBe(201);
      expect(res.body.data.reused).toBe(true);
      expect(res.body.data.merchantReference).toBe(testMerchantRef);
      expect(res.body.data.paymentId).toBe(testPaymentId);
    });
  });

  // =========================================================================
  // PHẦN 2: XEM DANH SÁCH THANH TOÁN (API-43)
  // =========================================================================
  describe('2. Xem danh sách thanh toán của đơn hàng (API-43)', () => {
    it('2.1 Chủ đơn hàng xem danh sách thanh toán của mình -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${vnpayOrderId}/payments`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].merchant_reference).toBe(testMerchantRef);
    });

    it('2.2 Khách hàng khác cố xem thanh toán của đơn không thuộc về mình -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${vnpayOrderId}/payments`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // PHẦN 3: TIẾP NHẬN RETURN URL (API-44 - BR-16)
  // =========================================================================
  describe('3. VNPay Return URL (API-44 & BR-16: Không tự ý đổi trạng thái từ redirect)', () => {
    it('3.1 Return URL hợp lệ -> Chuyển hướng 303 và KHÔNG đổi trạng thái đơn sang PAID', async () => {
      const queryParams: Record<string, string> = {
        vnp_Amount: '10000000',
        vnp_BankCode: 'NCB',
        vnp_CardType: 'ATM',
        vnp_OrderInfo: `Thanh toan don hang ${vnpayOrderCode}`,
        vnp_PayDate: '20261104200000',
        vnp_ResponseCode: '00',
        vnp_TmnCode: 'O7KX0BBT',
        vnp_TransactionNo: '14888888',
        vnp_TransactionStatus: '00',
        vnp_TxnRef: testMerchantRef,
      };
      queryParams['vnp_SecureHash'] = generateVnpayHash(queryParams);

      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/return')
        .query(queryParams);

      // Phản hồi 303 hoặc 302 Redirect
      expect(res.status).toBe(303);
      expect(res.headers.location).toContain('/thanh-toan/ket-qua');
      expect(res.headers.location).toContain('status=success');

      // [BR-16] Kiểm tra chắc chắn đơn hàng VẪN Ở PENDING_PAYMENT và UNPAID
      const order = await prisma.orders.findUnique({
        where: { id: BigInt(vnpayOrderId) },
      });
      expect(order!.status).toBe(orders_status.PENDING_PAYMENT);
      expect(order!.payment_status).toBe(orders_payment_status.UNPAID);
    });
  });

  // =========================================================================
  // PHẦN 4: VNPAY IPN WEBHOOK SERVER-TO-SERVER (API-45 & AC-09, AC-10)
  // =========================================================================
  describe('4. VNPay IPN Webhook Server-to-Server (API-45 & AC-09, AC-10)', () => {
    it('4.1 Chữ ký HMAC-SHA512 sai lệch -> Trả { RspCode: "97", Message: "Invalid Checksum" }', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query({
          vnp_TxnRef: testMerchantRef,
          vnp_Amount: '10000000',
          vnp_ResponseCode: '00',
          vnp_SecureHash: 'WRONG_HASH_123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('97');
      expect(res.body.Message).toBe('Invalid Checksum');
    });

    it('4.2 Mã tham chiếu vnp_TxnRef không tồn tại -> Trả { RspCode: "01", Message: "Order not found" }', async () => {
      const queryParams: Record<string, string> = {
        vnp_Amount: '10000000',
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'VV-PAY-NONEXISTENT-999',
      };
      queryParams['vnp_SecureHash'] = generateVnpayHash(queryParams);

      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query(queryParams);

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('01');
      expect(res.body.Message).toBe('Order not found');
    });

    it('4.3 Sai lệch số tiền thanh toán so với CSDL -> Trả { RspCode: "04", Message: "Invalid amount" }', async () => {
      const queryParams: Record<string, string> = {
        vnp_Amount: '5000000', // 50.000đ thay vì 100.000đ
        vnp_ResponseCode: '00',
        vnp_TxnRef: testMerchantRef,
      };
      queryParams['vnp_SecureHash'] = generateVnpayHash(queryParams);

      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query(queryParams);

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('04');
      expect(res.body.Message).toBe('Invalid amount');
    });

    it('4.4 IPN hợp lệ (RspCode 00) -> Xác nhận thanh toán thành công, đơn chuyển CONFIRMED & PAID', async () => {
      const queryParams: Record<string, string> = {
        vnp_Amount: '10000000', // 100.000đ * 100
        vnp_BankCode: 'NCB',
        vnp_CardType: 'ATM',
        vnp_OrderInfo: `Thanh toan don hang ${vnpayOrderCode}`,
        vnp_PayDate: '20261104200500',
        vnp_ResponseCode: '00',
        vnp_TmnCode: 'O7KX0BBT',
        vnp_TransactionNo: '14999999',
        vnp_TransactionStatus: '00',
        vnp_TxnRef: testMerchantRef,
      };
      queryParams['vnp_SecureHash'] = generateVnpayHash(queryParams);

      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query(queryParams);

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('00');
      expect(res.body.Message).toBe('Confirm Success');

      // Kiểm tra Payment đã SUCCEEDED
      const p = await prisma.payments.findUnique({
        where: { id: BigInt(testPaymentId) },
      });
      expect(p!.status).toBe(payments_status.SUCCEEDED);
      expect(p!.paid_at).not.toBeNull();
      expect(p!.provider_transaction_id).toBe('14999999');

      // Kiểm tra Order đã tự động xác nhận và PAID
      const o = await prisma.orders.findUnique({
        where: { id: BigInt(vnpayOrderId) },
      });
      expect(o!.status).toBe(orders_status.CONFIRMED);
      expect(o!.payment_status).toBe(orders_payment_status.PAID);
    });

    it('4.5 [AC-09] Gửi lại IPN lần 2 (thông báo lặp) -> Trả { RspCode: "02", Message: "Order already confirmed" }', async () => {
      const queryParams: Record<string, string> = {
        vnp_Amount: '10000000',
        vnp_BankCode: 'NCB',
        vnp_CardType: 'ATM',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: '14999999',
        vnp_TxnRef: testMerchantRef,
      };
      queryParams['vnp_SecureHash'] = generateVnpayHash(queryParams);

      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query(queryParams);

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('02');
      expect(res.body.Message).toBe('Order already confirmed');
    });

    it('4.6 [AC-10 / BR-18] Tiền tới sau khi đơn đã hủy -> Ghi thu, giữ CANCELLED (không cho nấu), chờ hoàn', async () => {
      // 1. Tạo attempt cho đơn bị hủy
      await request(app.getHttpServer())
        .post(`/api/v1/orders/${cancelledOrderId}/payment-attempts`)
        .set('Authorization', `Bearer ${customer1Token}`);
      // Lưu ý: Đơn đã hủy thì attempt bị chặn theo rule, nên ta tạo sẵn payment attempt ở trạng thái PENDING trước
      const cancelPayment = await prisma.payments.create({
        data: {
          order_id: BigInt(cancelledOrderId),
          provider: 'VNPAY',
          merchant_reference: `VV-PAY-CANCEL-${Date.now()}`,
          amount: 50000,
          currency: 'VND',
          status: payments_status.PENDING,
        },
      });

      const cancelQueryParams: Record<string, string> = {
        vnp_Amount: '5000000',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: '14777777',
        vnp_TxnRef: cancelPayment.merchant_reference,
      };
      cancelQueryParams['vnp_SecureHash'] =
        generateVnpayHash(cancelQueryParams);

      const ipnRes = await request(app.getHttpServer())
        .get('/api/v1/payments/vnpay/ipn')
        .query(cancelQueryParams);

      expect(ipnRes.status).toBe(200);
      expect(ipnRes.body.RspCode).toBe('00');

      // Kiểm tra Order: Giữ nguyên CANCELLED, nhưng payment_status chuyển PAID!
      const o = await prisma.orders.findUnique({
        where: { id: BigInt(cancelledOrderId) },
      });
      expect(o!.status).toBe(orders_status.CANCELLED);
      expect(o!.payment_status).toBe(orders_payment_status.PAID);
    });
  });

  // =========================================================================
  // PHẦN 5: ADMIN QUẢN TRỊ THANH TOÁN & ĐỐI SOÁT (API-46, API-47)
  // =========================================================================
  describe('5. Admin quản lý thanh toán & Đối soát (API-46, API-47)', () => {
    it('5.1 Admin xem danh sách thanh toán phân trang -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('5.2 Admin đối soát giao dịch -> 201 Created & Ghi event đối soát', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/payments/${testPaymentId}/reconcile`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          commandKey: `rec_cmd_${Date.now()}`,
          reason: 'Kiểm tra đối soát sao kê ngân hàng',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(testPaymentId);
    });
  });

  // =========================================================================
  // PHẦN 6: HOÀN TIỀN (REFUNDS - API-48, API-49, BR-19, BR-20)
  // =========================================================================
  describe('6. Quy trình hoàn tiền & Khống chế hạn mức (BR-19, BR-20)', () => {
    let refundId: string;

    it('6.1 [BR-19] Chặn hoàn tiền vượt quá số tiền của giao dịch gốc (Gốc 100k, yêu cầu 150k) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/payments/${testPaymentId}/refunds`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 150000,
          reason: 'Hoàn vượt hạn mức',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('vượt quá khoản thu gốc');
    });

    it('6.2 Admin tạo yêu cầu hoàn tiền hợp lệ từng phần (40.000đ) -> 201 Created (REQUESTED)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/payments/${testPaymentId}/refunds`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 40000,
          reason: 'Khách yêu cầu hoàn một phần do món giao thiếu',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(40000);
      expect(res.body.data.status).toBe(refunds_status.REQUESTED);
      refundId = res.body.data.id;
    });

    it('6.3 Admin chuyển trạng thái hoàn sang PROCESSING -> 201 Created', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/refunds/${refundId}/commands`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'START_PROCESSING',
          commandKey: `ref_cmd_${Date.now()}_1`,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(refunds_status.PROCESSING);
    });

    it('6.4 [BR-20] Xác nhận hoàn thủ công thiếu providerReference -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/refunds/${refundId}/commands`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'CONFIRM_MANUAL_SUCCESS',
          commandKey: `ref_cmd_${Date.now()}_2`,
          reason: 'Xác nhận chuyển khoản hoàn',
          // Thiếu providerReference
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'bắt buộc phải cung cấp mã chứng từ đối soát',
      );
    });

    it('6.5 Xác nhận hoàn thủ công hợp lệ -> 201 Created & Đơn chuyển PARTIALLY_REFUNDED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/refunds/${refundId}/commands`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'CONFIRM_MANUAL_SUCCESS',
          commandKey: `ref_cmd_${Date.now()}_3`,
          providerReference: 'VNPAY-REFUND-DOC-123456',
          reason: 'Đã chuyển tiền hoàn qua cổng ngân hàng',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(refunds_status.SUCCEEDED);
      expect(res.body.data.provider_refund_id).toBe('VNPAY-REFUND-DOC-123456');

      // Đơn hàng chuyển sang PARTIALLY_REFUNDED
      const o = await prisma.orders.findUnique({
        where: { id: BigInt(vnpayOrderId) },
      });
      expect(o!.payment_status).toBe(orders_payment_status.PARTIALLY_REFUNDED);
    });

    it('6.6 Hoàn nốt 60.000đ còn lại -> Đơn hàng cập nhật sang REFUNDED toàn bộ', async () => {
      // 1. Tạo yêu cầu hoàn phần còn lại
      const createRes = await request(app.getHttpServer())
        .post(`/api/v1/admin/payments/${testPaymentId}/refunds`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 60000,
          reason: 'Hoàn nốt phần còn lại của đơn hàng',
        });
      expect(createRes.status).toBe(201);
      const secondRefundId = createRes.body.data.id;

      // 2. Xác nhận thành công
      const confirmRes = await request(app.getHttpServer())
        .post(`/api/v1/admin/refunds/${secondRefundId}/commands`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'CONFIRM_MANUAL_SUCCESS',
          commandKey: `ref_cmd_${Date.now()}_final`,
          providerReference: 'VNPAY-REFUND-DOC-FINAL',
          reason: 'Hoàn tất cả',
        });
      expect(confirmRes.status).toBe(201);

      // 3. Đơn hàng cập nhật sang REFUNDED
      const o = await prisma.orders.findUnique({
        where: { id: BigInt(vnpayOrderId) },
      });
      expect(o!.payment_status).toBe(orders_payment_status.REFUNDED);
    });
  });
});
