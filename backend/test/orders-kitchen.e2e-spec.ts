import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { createE2eApp } from './setup/create-e2e-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import {
  dishes_availability,
  coupons_discount_type,
  orders_status,
  coupon_redemptions_status,
} from '@prisma/client';

describe('Orders & Kitchen Module E2E Testing (BR-05, BR-07, BR-08, BR-10, BR-12, BR-21, BR-22, KDS)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const testEmail = `order_test_${Date.now()}@viviet.test`;
  let customerToken: string;
  let customerId: string;

  let adminToken: string;
  let kitchenToken: string;

  let testCategoryId: bigint;
  let testDishId: bigint;
  let testVariantId: bigint;
  let testCouponCode: string;

  let createdOrderId: string;
  let secondOrderId: string;
  const checkoutKey1 = `chk_key_${Date.now()}_1`;
  const checkoutKey2 = `chk_key_${Date.now()}_2`;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // 1. Tạo Customer Token
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        full_name: 'Nguyễn Văn Đặt Hàng',
        phone: '0912345678',
      });
    customerToken = regRes.body.data.access_token;
    customerId = regRes.body.data.user.id;

    // 2. Tạo Admin Token & Kitchen Token
    const jwtSecret = 'vi_viet_super_secret_jwt_access_token_key_2026';
    adminToken = await jwtService.signAsync(
      {
        sub: '999902',
        email: 'admin_order_test@viviet.test',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );

    kitchenToken = await jwtService.signAsync(
      {
        sub: '999903',
        email: 'kitchen_order_test@viviet.test',
        role: 'KITCHEN',
        status: 'ACTIVE',
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );

    // 3. Tạo món ăn mẫu
    const cat = await prisma.categories.create({
      data: {
        name: `Danh mục Order ${Date.now()}`,
        slug: `danh-muc-order-${Date.now()}`,
      },
    });
    testCategoryId = cat.id;

    const dish = await prisma.dishes.create({
      data: {
        category_id: testCategoryId,
        name: 'Bún Chả Hà Nội Đặt Đơn',
        slug: `bun-cha-order-${Date.now()}`,
        availability: dishes_availability.AVAILABLE,
      },
    });
    testDishId = dish.id;

    const variant = await prisma.dish_variants.create({
      data: {
        dish_id: testDishId,
        name: 'Suất Đầy Đủ',
        price: 60000,
        is_active: true,
      },
    });
    testVariantId = variant.id;

    // 4. Tạo mã ưu đãi giảm 15.000đ cho đơn từ 50.000đ
    testCouponCode = `VVIET${Date.now()}`;
    await prisma.coupons.create({
      data: {
        code: testCouponCode,
        name: 'Giảm 15k đơn từ 50k',
        discount_type: coupons_discount_type.FIXED,
        discount_value: 15000,
        min_subtotal: 50000,
        starts_at: new Date(Date.now() - 3600000),
        ends_at: new Date(Date.now() + 86400000),
        per_user_limit: 2,
      },
    });
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu order
    const orderIds = [createdOrderId, secondOrderId]
      .filter(Boolean)
      .map((id) => BigInt(id));
    if (orderIds.length > 0) {
      await prisma.order_events.deleteMany({
        where: { order_id: { in: orderIds } },
      });
      await prisma.coupon_redemptions.deleteMany({
        where: { order_id: { in: orderIds } },
      });
      const oItems = await prisma.order_items.findMany({
        where: { order_id: { in: orderIds } },
      });
      const oItemIds = oItems.map((oi) => oi.id);
      await prisma.order_item_options.deleteMany({
        where: { order_item_id: { in: oItemIds } },
      });
      await prisma.order_items.deleteMany({
        where: { order_id: { in: orderIds } },
      });
      await prisma.orders.deleteMany({ where: { id: { in: orderIds } } });
    }

    if (testCouponCode) {
      await prisma.coupons.deleteMany({ where: { code: testCouponCode } });
    }

    if (testDishId) {
      await prisma.dish_variants.deleteMany({ where: { dish_id: testDishId } });
      await prisma.dishes.delete({ where: { id: testDishId } });
    }

    if (testCategoryId) {
      await prisma.categories.delete({ where: { id: testCategoryId } });
    }

    if (customerId) {
      const uId = BigInt(customerId);
      await prisma.order_events.deleteMany({
        where: { orders: { user_id: uId } },
      });
      await prisma.order_item_options.deleteMany({
        where: { order_items: { orders: { user_id: uId } } },
      });
      await prisma.order_items.deleteMany({
        where: { orders: { user_id: uId } },
      });
      await prisma.coupon_redemptions.deleteMany({ where: { user_id: uId } });
      await prisma.payments.deleteMany({ where: { orders: { user_id: uId } } });
      await prisma.orders.deleteMany({ where: { user_id: uId } });
      await prisma.cart_item_options.deleteMany({
        where: { cart_items: { carts: { user_id: uId } } },
      });
      await prisma.cart_items.deleteMany({
        where: { carts: { user_id: uId } },
      });
      await prisma.carts.deleteMany({ where: { user_id: uId } });
      await prisma.auth_sessions.deleteMany({ where: { user_id: uId } });
      await prisma.addresses.deleteMany({ where: { user_id: uId } });
      await prisma.users.delete({ where: { id: uId } }).catch(() => {});
    }

    await app.close();
  });

  // ==========================================
  // 1. QUY TRÌNH CHECKOUT VÀ SNAPSHOT (BR-07, BR-08, BR-12)
  // ==========================================

  it('1.1 Chặn checkout khi giỏ hàng đang rỗng -> 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        checkout_key: checkoutKey1,
        fulfillment_type: 'DELIVERY',
        payment_method: 'COD',
        recipient_name: 'Nguyễn Văn A',
        recipient_phone: '0912345678',
        delivery_address: '123 Đường Cầu Giấy, Hà Nội',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Giỏ hàng của bạn đang trống');
  });

  it('1.2 Thêm món vào giỏ và checkout thành công (Snapshots & Giữ chỗ coupon RESERVED - BR-07, BR-12) -> 201 Created', async () => {
    // Thêm món vào giỏ trước: 2 suất bún chả (60.000 * 2 = 120.000đ)
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        dish_id: testDishId.toString(),
        variant_id: testVariantId.toString(),
        quantity: 2,
        note: 'Nhiều dưa góp',
      });

    const res = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        checkout_key: checkoutKey1,
        fulfillment_type: 'DELIVERY',
        payment_method: 'COD',
        recipient_name: 'Nguyễn Văn Đặt Hàng',
        recipient_phone: '0912345678',
        delivery_address: '123 Đường Cầu Giấy, Hà Nội',
        coupon_code: testCouponCode,
      });

    expect(res.status).toBe(201);
    const order = res.body.data;
    createdOrderId = order.id;

    expect(order.status).toBe(orders_status.PENDING_CONFIRMATION);
    expect(order.subtotal).toBe(120000);
    expect(order.food_discount).toBe(15000); // Mã giảm 15.000đ
    expect(order.delivery_fee).toBe(20000); // Phí giao hàng tiêu chuẩn
    expect(order.total_amount).toBe(125000); // 120k - 15k + 20k = 125k

    // Kiểm tra snapshot
    expect(order.items.length).toBe(1);
    expect(order.items[0].dish_name).toBe('Bún Chả Hà Nội Đặt Đơn');
    expect(order.items[0].variant_name).toBe('Suất Đầy Đủ');
    expect(order.items[0].base_price).toBe(60000);
    expect(order.items[0].quantity).toBe(2);

    // Kiểm tra mã ưu đãi đã chuyển sang trạng thái RESERVED trong DB
    const redemption = await prisma.coupon_redemptions.findUnique({
      where: { order_id: BigInt(order.id) },
    });
    expect(redemption).toBeDefined();
    expect(redemption?.status).toBe(coupon_redemptions_status.RESERVED);

    // Kiểm tra giỏ hàng đã được dọn sạch
    const cartRes = await request(app.getHttpServer())
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cartRes.body.data.item_count).toBe(0);
  });

  it('1.3 [BR-08] Cơ chế Idempotency: Gửi lại cùng checkout_key -> Trả về đúng đơn hàng đã tạo, không tạo mới', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        checkout_key: checkoutKey1,
        fulfillment_type: 'DELIVERY',
        payment_method: 'COD',
        recipient_name: 'Nguyễn Văn Đặt Hàng',
        recipient_phone: '0912345678',
        delivery_address: '123 Đường Cầu Giấy, Hà Nội',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(createdOrderId);
  });

  // ==========================================
  // 2. KHÁCH HÀNG TỰ HỦY ĐƠN (BR-21, BR-12)
  // ==========================================

  it('2.1 [BR-21, BR-12] Khách hàng tự hủy đơn PENDING_CONFIRMATION -> Trạng thái CANCELLED, hoàn trả coupon về RELEASED', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/orders/${createdOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Đổi ý không ăn nữa' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(orders_status.CANCELLED);
    expect(res.body.data.cancel_reason).toBe('Đổi ý không ăn nữa');

    // Kiểm tra coupon redemption được trả về RELEASED
    const redemption = await prisma.coupon_redemptions.findUnique({
      where: { order_id: BigInt(createdOrderId) },
    });
    expect(redemption?.status).toBe(coupon_redemptions_status.RELEASED);
  });

  // ==========================================
  // 3. MÁY TRẠNG THÁI 9 BƯỚC & KITCHEN KDS (BR-22, KDS)
  // ==========================================

  it('3.1 Chuẩn bị đơn thứ hai để kiểm thử máy trạng thái và luồng Bếp', async () => {
    // Thêm món và checkout đơn 2
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        dish_id: testDishId.toString(),
        variant_id: testVariantId.toString(),
        quantity: 1,
      });

    const res = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        checkout_key: checkoutKey2,
        fulfillment_type: 'PICKUP',
        payment_method: 'COD',
        recipient_name: 'Khách Lấy Tại Quán',
        recipient_phone: '0987654321',
        coupon_code: testCouponCode,
      });

    expect(res.status).toBe(201);
    secondOrderId = res.body.data.id;
    expect(res.body.data.status).toBe(orders_status.PENDING_CONFIRMATION);
  });

  it('3.2 [Admin] Tiếp nhận đơn (PENDING_CONFIRMATION -> CONFIRMED) -> Tiêu thụ coupon (CONSUMED - BR-12)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/orders/${secondOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: orders_status.CONFIRMED,
        note: 'Quán đã nhận đơn và xác nhận với khách',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(orders_status.CONFIRMED);

    const redemption = await prisma.coupon_redemptions.findUnique({
      where: { order_id: BigInt(secondOrderId) },
    });
    expect(redemption?.status).toBe(coupon_redemptions_status.CONSUMED);
  });

  it('3.3 [BR-22] Chặn bước nhảy trạng thái trái phép (CONFIRMED -> COMPLETED trực tiếp) -> 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/orders/${secondOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: orders_status.COMPLETED,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Không thể chuyển trạng thái');
  });

  it('3.4 [Kitchen] Bếp xem hàng đợi chế biến (GET /kitchen/queue) -> Ẩn thông tin cá nhân khách hàng (PII)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/kitchen/queue')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(200);
    const queue = res.body.data;
    const target = queue.find((o: any) => o.id === secondOrderId);
    expect(target).toBeDefined();

    // Bảo mật PII: Không chứa số điện thoại hoặc địa chỉ cá nhân chi tiết
    expect((target as any).recipient_phone).toBeUndefined();
    expect((target as any).delivery_address).toBeUndefined();
    expect(target.items.length).toBeGreaterThan(0);
    expect(target.items[0].dish_name).toBe('Bún Chả Hà Nội Đặt Đơn');
  });

  it('3.5 [Kitchen] Bếp bắt đầu nấu (POST /kitchen/orders/:id/start) -> Chuyển sang PREPARING', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/kitchen/orders/${secondOrderId}/start`)
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(orders_status.PREPARING);
  });

  it('3.6 [Kitchen] Bếp hoàn thành nấu (POST /kitchen/orders/:id/finish) -> Chuyển sang READY', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/kitchen/orders/${secondOrderId}/finish`)
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(orders_status.READY);
  });

  it('3.7 [Admin] Đơn lấy tại quán (PICKUP) chuyển từ READY -> COMPLETED', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/orders/${secondOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: orders_status.COMPLETED,
        note: 'Khách đã tới lấy món và thanh toán xong',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(orders_status.COMPLETED);
    expect(res.body.data.payment_status).toBe('PAID');
    expect(res.body.data.completed_at).toBeDefined();
  });
});
