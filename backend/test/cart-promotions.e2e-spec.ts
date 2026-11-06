import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { createE2eApp } from './setup/create-e2e-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { dishes_availability, coupons_discount_type } from '@prisma/client';

describe('Cart & Promotions Module E2E Testing (BR-04, BR-06, BR-09, BR-10, BR-11, BR-13, ASM-04, ASM-06)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const testEmail = `cart_test_${Date.now()}@viviet.test`;
  let customerToken: string;
  let customerId: string;

  let adminToken: string;

  let testCategoryId: bigint;
  let testDishId: bigint;
  let testVariantId: bigint;
  let testVariant2Id: bigint;
  let testOptionGroupId: bigint;
  let testOptionValue1Id: bigint;

  let fixedCouponCode: string;
  let percentCouponCode: string;
  let createdCartItemId: string;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // 1. Tạo Customer tài khoản
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        full_name: 'Khách hàng Thử Giỏ hàng',
        phone: '0901234567',
      });
    customerToken = registerRes.body.data.access_token;
    customerId = registerRes.body.data.user.id;

    // 2. Tạo Admin Token
    adminToken = await jwtService.signAsync(
      {
        sub: '999901',
        email: 'admin_cart_test@viviet.test',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      {
        secret: 'vi_viet_super_secret_jwt_access_token_key_2026',
        expiresIn: '1h',
      },
    );

    // 3. Chuẩn bị món ăn và biến thể, tùy chọn để test giỏ hàng
    const category = await prisma.categories.create({
      data: {
        name: `Danh mục Cart ${Date.now()}`,
        slug: `danh-muc-cart-${Date.now()}`,
      },
    });
    testCategoryId = category.id;

    const dish = await prisma.dishes.create({
      data: {
        category_id: testCategoryId,
        name: 'Phở Bò Đặc Biệt Giỏ Hàng',
        slug: `pho-bo-cart-${Date.now()}`,
        availability: dishes_availability.AVAILABLE,
      },
    });
    testDishId = dish.id;

    const variant1 = await prisma.dish_variants.create({
      data: {
        dish_id: testDishId,
        name: 'Tô Tiêu Chuẩn',
        price: 55000,
        is_active: true,
      },
    });
    testVariantId = variant1.id;

    const variant2 = await prisma.dish_variants.create({
      data: {
        dish_id: testDishId,
        name: 'Tô Khổng Lồ',
        price: 75000,
        is_active: true,
      },
    });
    testVariant2Id = variant2.id;

    const group = await prisma.option_groups.create({
      data: {
        dish_id: testDishId,
        name: 'Thêm Topping',
        min_select: 0,
        max_select: 2,
        is_active: true,
      },
    });
    testOptionGroupId = group.id;

    const optVal1 = await prisma.option_values.create({
      data: {
        group_id: testOptionGroupId,
        dish_id: testDishId,
        name: 'Thêm Trứng Chần',
        extra_price: 10000,
        is_active: true,
      },
    });
    testOptionValue1Id = optVal1.id;

    await prisma.option_values.create({
      data: {
        group_id: testOptionGroupId,
        dish_id: testDishId,
        name: 'Thêm Tiết Hột Gà',
        extra_price: 15000,
        is_active: true,
      },
    });
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu test
    if (customerId) {
      const uId = BigInt(customerId);
      const cart = await prisma.carts.findUnique({ where: { user_id: uId } });
      if (cart) {
        const cItems = await prisma.cart_items.findMany({
          where: { cart_id: cart.id },
        });
        const cIds = cItems.map((ci) => ci.id);
        await prisma.cart_item_options.deleteMany({
          where: { cart_item_id: { in: cIds } },
        });
        await prisma.cart_items.deleteMany({ where: { cart_id: cart.id } });
        await prisma.carts.delete({ where: { id: cart.id } });
      }
      await prisma.auth_sessions.deleteMany({ where: { user_id: uId } });
      await prisma.users.delete({ where: { id: uId } });
    }

    if (testDishId) {
      await prisma.option_values.deleteMany({ where: { dish_id: testDishId } });
      await prisma.option_groups.deleteMany({ where: { dish_id: testDishId } });
      await prisma.dish_variants.deleteMany({ where: { dish_id: testDishId } });
      await prisma.dishes.delete({ where: { id: testDishId } });
    }

    if (testCategoryId) {
      await prisma.categories.delete({ where: { id: testCategoryId } });
    }

    if (fixedCouponCode) {
      await prisma.coupon_redemptions.deleteMany({
        where: { coupons: { code: fixedCouponCode } },
      });
      await prisma.coupons.deleteMany({ where: { code: fixedCouponCode } });
    }
    if (percentCouponCode) {
      await prisma.coupon_redemptions.deleteMany({
        where: { coupons: { code: percentCouponCode } },
      });
      await prisma.coupons.deleteMany({ where: { code: percentCouponCode } });
    }

    await app.close();
  });

  // ==========================================
  // PHÂN HỆ GIỎ HÀNG (SHOPPING CART)
  // ==========================================

  it('1.1 Xem giỏ hàng ban đầu (Rỗng) -> 200 OK với subtotal = 0', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.item_count).toBe(0);
    expect(res.body.data.subtotal).toBe(0);
    expect(res.body.data.items).toEqual([]);
  });

  it('1.2 [BR-04, BR-06] Thêm món có tùy chọn vào giỏ hàng -> 201/200 và tính giá động chuẩn xác', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        dish_id: testDishId.toString(),
        variant_id: testVariantId.toString(),
        option_value_ids: [testOptionValue1Id.toString()],
        quantity: 2,
        note: 'Ít hành, nước trong',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.item_count).toBe(1);
    expect(res.body.data.total_quantity).toBe(2);

    const item = res.body.data.items[0];
    createdCartItemId = item.id;
    expect(item.base_price).toBe(55000);
    expect(item.options_price).toBe(10000);
    expect(item.unit_price).toBe(65000);
    expect(item.line_total).toBe(130000); // 65.000 * 2
    expect(res.body.data.subtotal).toBe(130000);
    expect(item.is_available).toBe(true);
    expect(item.note).toBe('Ít hành, nước trong');
  });

  it('1.3 [BR-09] Thêm cùng món, cùng biến thể, cùng tùy chọn và cùng ghi chú -> Tăng số lượng cùng dòng', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        dish_id: testDishId.toString(),
        variant_id: testVariantId.toString(),
        option_value_ids: [testOptionValue1Id.toString()],
        quantity: 1,
        note: 'Ít hành, nước trong',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.item_count).toBe(1); // Vẫn là 1 dòng
    expect(res.body.data.total_quantity).toBe(3); // 2 + 1 = 3
    expect(res.body.data.items[0].line_total).toBe(195000); // 65.000 * 3
  });

  it('1.4 [BR-09] Thêm cùng món nhưng KHÁC biến thể -> Tách thành dòng giỏ hàng mới', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        dish_id: testDishId.toString(),
        variant_id: testVariant2Id.toString(), // Tô Khổng Lồ 75.000đ
        quantity: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.item_count).toBe(2); // Đã tách thành 2 dòng riêng biệt
    expect(res.body.data.total_quantity).toBe(4); // 3 + 1 = 4
  });

  it('1.5 [ASM-06] Chặn thêm số lượng vượt quá 99 phần -> 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        dish_id: testDishId.toString(),
        variant_id: testVariantId.toString(),
        quantity: 100, // Vượt quá 99
      });

    expect(res.status).toBe(400);
  });

  it('1.6 Cập nhật số lượng và ghi chú của dòng giỏ hàng -> 200 OK', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/cart/items/${createdCartItemId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        quantity: 1,
        note: 'Nhiều giá tươi',
      });

    expect(res.status).toBe(200);
    const updated = res.body.data.items.find(
      (i: any) => i.id === createdCartItemId,
    );
    expect(updated.quantity).toBe(1);
    expect(updated.note).toBe('Nhiều giá tươi');
  });

  it('1.7 Xóa một dòng món khỏi giỏ hàng -> 200 OK', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/v1/cart/items/${createdCartItemId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(
      res.body.data.items.find((i: any) => i.id === createdCartItemId),
    ).toBeUndefined();
    expect(res.body.data.item_count).toBe(1);
  });

  it('1.8 Hợp nhất giỏ hàng khách vãng lai sau đăng nhập (POST /cart/merge) -> 200/201 OK', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/cart/merge')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [
          {
            dish_id: testDishId.toString(),
            variant_id: testVariantId.toString(),
            quantity: 2,
            note: 'Khách vãng lai mang sang',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.item_count).toBe(2);
  });

  it('1.9 Làm rỗng giỏ hàng (DELETE /cart) -> 200 OK', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.item_count).toBe(0);
    expect(res.body.data.subtotal).toBe(0);
  });

  // ==========================================
  // PHÂN HỆ MÃ ƯU ĐÃI (PROMOTIONS / COUPONS)
  // ==========================================

  it('2.1 [Admin] Tạo mã giảm giá cố định (FIXED 20.000đ, min 50.000đ) -> 201 Created', async () => {
    fixedCouponCode = `FIXED${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: fixedCouponCode,
        name: 'Giảm ngay 20k cho đơn từ 50k',
        discount_type: coupons_discount_type.FIXED,
        discount_value: 20000,
        min_subtotal: 50000,
        starts_at: new Date(Date.now() - 3600000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
        per_user_limit: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.coupon.code).toBe(fixedCouponCode);
    expect(res.body.data.coupon.discount_value).toBe(20000);
  });

  it('2.2 [Admin] Tạo mã giảm phần trăm (PERCENT 10%, max 30.000đ, min 100.000đ) -> 201 Created', async () => {
    percentCouponCode = `PERCENT${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: percentCouponCode,
        name: 'Giảm 10% tối đa 30k',
        discount_type: coupons_discount_type.PERCENT,
        discount_value: 10,
        min_subtotal: 100000,
        max_discount: 30000,
        starts_at: new Date(Date.now() - 3600000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.coupon.code).toBe(percentCouponCode);
  });

  it('2.3 [BR-10] Kiểm tra điều kiện đơn hàng tối thiểu (min_subtotal chưa đạt) -> 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        code: fixedCouponCode,
        subtotal: 30000, // Thấp hơn 50.000đ
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('tối thiểu 50.000');
  });

  it('2.4 [BR-11] Tính toán giảm giá phần trăm có giới hạn max_discount -> Giảm đúng trần 30.000đ', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        code: percentCouponCode,
        subtotal: 500000, // 10% của 500k là 50k, nhưng bị chặn trần max_discount 30k
      });

    expect(res.status).toBe(201);
    expect(res.body.data.is_valid).toBe(true);
    expect(res.body.data.discount_amount).toBe(30000);
  });

  it('2.5 Khách hàng xem danh sách mã ưu đãi có sẵn (GET /coupons/available) -> 200 OK', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/coupons/available')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((c: any) => c.code === fixedCouponCode);
    expect(found).toBeDefined();
    expect(found.can_use).toBe(true);
  });
});
