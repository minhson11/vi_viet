import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { createE2eApp } from './setup/create-e2e-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { dishes_availability, orders_status } from '@prisma/client';

describe('Comprehensive Negative & Edge-case E2E Testing (Cart, Promotions, Orders, KDS, RBAC, BR-04..22)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Users
  let customer1Token: string;
  let customer1Id: string;
  let customer2Token: string;
  let customer2Id: string;
  let adminToken: string;
  let adminUserId: bigint;
  let kitchenToken: string;
  let kitchenUserId: bigint;

  // Dishes & Variants
  let testCategoryId: bigint;
  let activeDishId: bigint;
  let soldOutDishId: bigint;
  let hiddenDishId: bigint;
  let activeVariantId: bigint;
  let inactiveVariantId: bigint;
  let otherDishVariantId: bigint;

  // Option groups & values
  let requiredGroupId: bigint; // min_select = 1, max_select = 2
  let requiredOption1Id: bigint;
  let requiredOption2Id: bigint;
  let requiredOption3Id: bigint;
  let inactiveOptionId: bigint;

  // Coupons
  let expiredCouponCode: string;
  let futureCouponCode: string;
  let disabledCouponCode: string;
  let limitedCouponCode: string; // total_limit = 1
  let userLimitedCouponCode: string; // per_user_limit = 1
  let minSubtotalCouponCode: string; // min 100k

  // Created IDs for testing cross-ownership
  let customer1CartItemId: string;
  let customer1OrderId: string;
  let confirmedOrderId: string;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    const jwtSecret = 'vi_viet_super_secret_jwt_access_token_key_2026';

    // 1. Tạo 2 tài khoản Customer
    const reg1 = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `c1_neg_${Date.now()}@viviet.test`,
        password: 'Password123!',
        full_name: 'Customer One Neg',
        phone: '0901111111',
      });
    customer1Token = reg1.body.data.access_token;
    customer1Id = reg1.body.data.user.id;

    const reg2 = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `c2_neg_${Date.now()}@viviet.test`,
        password: 'Password123!',
        full_name: 'Customer Two Neg',
        phone: '0902222222',
      });
    customer2Token = reg2.body.data.access_token;
    customer2Id = reg2.body.data.user.id;

    // 2. Tạo Admin User & Kitchen User
    const adminUser = await prisma.users.create({
      data: {
        email: `admin_neg_${Date.now()}@viviet.test`,
        password_hash: 'dummy_hash',
        full_name: 'Admin User Neg',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    adminUserId = adminUser.id;
    adminToken = await jwtService.signAsync(
      {
        sub: adminUserId.toString(),
        email: adminUser.email,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );

    const kitchenUser = await prisma.users.create({
      data: {
        email: `kitchen_neg_${Date.now()}@viviet.test`,
        password_hash: 'dummy_hash',
        full_name: 'Kitchen User Neg',
        role: 'KITCHEN',
        status: 'ACTIVE',
      },
    });
    kitchenUserId = kitchenUser.id;
    kitchenToken = await jwtService.signAsync(
      {
        sub: kitchenUserId.toString(),
        email: kitchenUser.email,
        role: 'KITCHEN',
        status: 'ACTIVE',
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );

    // 3. Chuẩn bị Danh mục & Món ăn đa dạng trạng thái
    const cat = await prisma.categories.create({
      data: {
        name: `Danh mục Neg ${Date.now()}`,
        slug: `dm-neg-${Date.now()}`,
      },
    });
    testCategoryId = cat.id;

    // Món đang mở bán (AVAILABLE)
    const dish1 = await prisma.dishes.create({
      data: {
        category_id: testCategoryId,
        name: 'Món Hoạt Động',
        slug: `mon-hd-${Date.now()}`,
        availability: dishes_availability.AVAILABLE,
      },
    });
    activeDishId = dish1.id;

    // Món hết hàng (SOLD_OUT)
    const dish2 = await prisma.dishes.create({
      data: {
        category_id: testCategoryId,
        name: 'Món Đã Hết Hàng',
        slug: `mon-soldout-${Date.now()}`,
        availability: dishes_availability.SOLD_OUT,
      },
    });
    soldOutDishId = dish2.id;

    // Món bị ẩn (HIDDEN)
    const dish3 = await prisma.dishes.create({
      data: {
        category_id: testCategoryId,
        name: 'Món Tạm Ẩn',
        slug: `mon-hidden-${Date.now()}`,
        availability: dishes_availability.HIDDEN,
      },
    });
    hiddenDishId = dish3.id;

    // Biến thể hoạt động và biến thể vô hiệu hóa
    const vActive = await prisma.dish_variants.create({
      data: {
        dish_id: activeDishId,
        name: 'Phần Tiêu Chuẩn',
        price: 60000,
        is_active: true,
      },
    });
    activeVariantId = vActive.id;

    const vInactive = await prisma.dish_variants.create({
      data: {
        dish_id: activeDishId,
        name: 'Phần Tạm Khóa',
        price: 80000,
        is_active: false,
      },
    });
    inactiveVariantId = vInactive.id;

    const vOther = await prisma.dish_variants.create({
      data: {
        dish_id: soldOutDishId,
        name: 'Phần Món Khác',
        price: 50000,
        is_active: true,
      },
    });
    otherDishVariantId = vOther.id;

    // Nhóm tùy chọn bắt buộc (min_select: 1, max_select: 2)
    const groupReq = await prisma.option_groups.create({
      data: {
        dish_id: activeDishId,
        name: 'Chọn Độ Ngọt (Bắt buộc)',
        min_select: 1,
        max_select: 2,
        is_active: true,
      },
    });
    requiredGroupId = groupReq.id;

    const opt1 = await prisma.option_values.create({
      data: {
        group_id: requiredGroupId,
        dish_id: activeDishId,
        name: '50% Ngọt',
        extra_price: 0,
        is_active: true,
      },
    });
    requiredOption1Id = opt1.id;

    const opt2 = await prisma.option_values.create({
      data: {
        group_id: requiredGroupId,
        dish_id: activeDishId,
        name: '100% Ngọt',
        extra_price: 0,
        is_active: true,
      },
    });
    requiredOption2Id = opt2.id;

    const opt3 = await prisma.option_values.create({
      data: {
        group_id: requiredGroupId,
        dish_id: activeDishId,
        name: '120% Ngọt',
        extra_price: 5000,
        is_active: true,
      },
    });
    requiredOption3Id = opt3.id;

    const optInactive = await prisma.option_values.create({
      data: {
        group_id: requiredGroupId,
        dish_id: activeDishId,
        name: 'Tùy chọn Khóa',
        extra_price: 0,
        is_active: false,
      },
    });
    inactiveOptionId = optInactive.id;

    // 4. Chuẩn bị các mã ưu đãi cho các trường hợp biên
    expiredCouponCode = `EXP${Date.now()}`;
    await prisma.coupons.create({
      data: {
        code: expiredCouponCode,
        name: 'Mã đã hết hạn',
        discount_value: 10000,
        starts_at: new Date(Date.now() - 86400000 * 2),
        ends_at: new Date(Date.now() - 3600000), // Kết thúc 1 tiếng trước
        is_active: true,
      },
    });

    futureCouponCode = `FUT${Date.now()}`;
    await prisma.coupons.create({
      data: {
        code: futureCouponCode,
        name: 'Mã tương lai chưa tới ngày',
        discount_value: 10000,
        starts_at: new Date(Date.now() + 3600000), // Bắt đầu sau 1 tiếng
        ends_at: new Date(Date.now() + 86400000),
        is_active: true,
      },
    });

    disabledCouponCode = `DIS${Date.now()}`;
    await prisma.coupons.create({
      data: {
        code: disabledCouponCode,
        name: 'Mã bị tạm khóa',
        discount_value: 10000,
        starts_at: new Date(Date.now() - 3600000),
        ends_at: new Date(Date.now() + 86400000),
        is_active: false, // Bị khóa
      },
    });

    limitedCouponCode = `LMT${Date.now()}`;
    await prisma.coupons.create({
      data: {
        code: limitedCouponCode,
        name: 'Mã chỉ có 1 lượt duy nhất toàn hệ thống',
        discount_value: 10000,
        starts_at: new Date(Date.now() - 3600000),
        ends_at: new Date(Date.now() + 86400000),
        total_limit: 1,
        per_user_limit: 1,
        is_active: true,
      },
    });

    userLimitedCouponCode = `USRLMT${Date.now()}`;
    await prisma.coupons.create({
      data: {
        code: userLimitedCouponCode,
        name: 'Mã giới hạn 1 lượt/khách',
        discount_value: 10000,
        starts_at: new Date(Date.now() - 3600000),
        ends_at: new Date(Date.now() + 86400000),
        total_limit: 100,
        per_user_limit: 1,
        is_active: true,
      },
    });

    minSubtotalCouponCode = `MIN100K${Date.now()}`;
    await prisma.coupons.create({
      data: {
        code: minSubtotalCouponCode,
        name: 'Mã yêu cầu đơn từ 100k',
        discount_value: 20000,
        min_subtotal: 100000,
        starts_at: new Date(Date.now() - 3600000),
        ends_at: new Date(Date.now() + 86400000),
        is_active: true,
      },
    });
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu test
    const userIds = [
      customer1Id,
      customer2Id,
      adminUserId?.toString(),
      kitchenUserId?.toString(),
    ]
      .filter(Boolean)
      .map((id) => BigInt(id));

    if (userIds.length > 0) {
      const orders = await prisma.orders.findMany({
        where: { user_id: { in: userIds } },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length > 0) {
        await prisma.order_events.deleteMany({
          where: { order_id: { in: orderIds } },
        });
        await prisma.coupon_redemptions.deleteMany({
          where: { order_id: { in: orderIds } },
        });
        const oItems = await prisma.order_items.findMany({
          where: { order_id: { in: orderIds } },
          select: { id: true },
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

      const carts = await prisma.carts.findMany({
        where: { user_id: { in: userIds } },
        select: { id: true },
      });
      const cartIds = carts.map((c) => c.id);
      if (cartIds.length > 0) {
        const cItems = await prisma.cart_items.findMany({
          where: { cart_id: { in: cartIds } },
          select: { id: true },
        });
        const cItemIds = cItems.map((ci) => ci.id);
        await prisma.cart_item_options.deleteMany({
          where: { cart_item_id: { in: cItemIds } },
        });
        await prisma.cart_items.deleteMany({
          where: { cart_id: { in: cartIds } },
        });
        await prisma.carts.deleteMany({ where: { id: { in: cartIds } } });
      }

      await prisma.auth_sessions.deleteMany({
        where: { user_id: { in: userIds } },
      });
      await prisma.users.deleteMany({ where: { id: { in: userIds } } });
    }

    const dishIds = [activeDishId, soldOutDishId, hiddenDishId].filter(Boolean);
    if (dishIds.length > 0) {
      await prisma.option_values.deleteMany({
        where: { dish_id: { in: dishIds } },
      });
      await prisma.option_groups.deleteMany({
        where: { dish_id: { in: dishIds } },
      });
      await prisma.dish_variants.deleteMany({
        where: { dish_id: { in: dishIds } },
      });
      await prisma.dishes.deleteMany({ where: { id: { in: dishIds } } });
    }

    if (testCategoryId) {
      await prisma.categories.delete({ where: { id: testCategoryId } });
    }

    const couponCodes = [
      expiredCouponCode,
      futureCouponCode,
      disabledCouponCode,
      limitedCouponCode,
      userLimitedCouponCode,
      minSubtotalCouponCode,
    ].filter(Boolean);
    if (couponCodes.length > 0) {
      await prisma.coupon_redemptions.deleteMany({
        where: { coupons: { code: { in: couponCodes } } },
      });
      await prisma.coupons.deleteMany({ where: { code: { in: couponCodes } } });
    }

    await app.close();
  });

  // ==========================================
  // 1. KIỂM THỬ GIỎ HÀNG: CÁC TRƯỜNG HỢP BIÊN & DỮ LIỆU SAI (BR-04, ASM-06)
  // ==========================================
  describe('1. Kiểm thử Tiêu cực Giỏ hàng (Cart Edge Cases & Constraints)', () => {
    it('1.1 Chặn thêm món ăn với ID không tồn tại -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: '999999999',
          variant_id: activeVariantId.toString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('không khả dụng');
    });

    it('1.2 [BR-04] Chặn thêm món ăn đã hết hàng (SOLD_OUT) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: soldOutDishId.toString(),
          variant_id: otherDishVariantId.toString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('không khả dụng');
    });

    it('1.3 [BR-04] Chặn thêm món ăn đang bị ẩn (HIDDEN) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: hiddenDishId.toString(),
          variant_id: activeVariantId.toString(),
        });

      expect(res.status).toBe(400);
    });

    it('1.4 [BR-04] Chặn thêm biến thể bị vô hiệu hóa (is_active = false) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: inactiveVariantId.toString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Biến thể món ăn không tồn tại hoặc đã ngưng bán',
      );
    });

    it('1.5 [BR-04] Chặn biến thể thuộc món khác (râu ông nọ cắm cằm bà kia) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: otherDishVariantId.toString(), // Variant của món soldOutDishId
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Biến thể món ăn không tồn tại hoặc đã ngưng bán',
      );
    });

    it('1.6 [BR-04] Thiếu tùy chọn bắt buộc (min_select = 1 nhưng không gửi option nào) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: activeVariantId.toString(),
          option_value_ids: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ít nhất 1 lựa chọn');
    });

    it('1.7 [BR-04] Chọn vượt quá max_select (max_select = 2 nhưng gửi 3 options) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: activeVariantId.toString(),
          option_value_ids: [
            requiredOption1Id.toString(),
            requiredOption2Id.toString(),
            requiredOption3Id.toString(),
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('tối đa 2 lựa chọn');
    });

    it('1.8 [BR-04] Chọn tùy chọn đã bị vô hiệu hóa (is_active = false) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: activeVariantId.toString(),
          option_value_ids: [inactiveOptionId.toString()],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'không hợp lệ hoặc đã ngừng hoạt động',
      );
    });

    it('1.9 [ASM-06] Chặn số lượng âm hoặc bằng 0 -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: activeVariantId.toString(),
          quantity: 0,
        });

      expect(res.status).toBe(400);
    });

    it('1.10 [ASM-06] Chặn số lượng không phải số nguyên -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: activeVariantId.toString(),
          quantity: 2.5,
        });

      expect(res.status).toBe(400);
    });

    it('1.11 [ASM-06] Chặn ghi chú vượt quá 500 ký tự -> 400 Bad Request', async () => {
      const longNote = 'A'.repeat(501);
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: activeVariantId.toString(),
          option_value_ids: [requiredOption1Id.toString()],
          note: longNote,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Ghi chú tối đa 500 ký tự');
    });

    it('1.12 Thêm món hợp lệ ban đầu cho Customer 1 -> 201 Created', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: activeVariantId.toString(),
          option_value_ids: [requiredOption1Id.toString()],
          quantity: 95,
          note: 'Món của User 1',
        });

      expect(res.status).toBe(201);
      customer1CartItemId = res.body.data.items[0].id;
      expect(res.body.data.items[0].quantity).toBe(95);
    });

    it('1.13 [ASM-06] Cộng dồn vượt quá 99 phần trên cùng dòng món -> 400 Bad Request', async () => {
      // Đã có 95 phần, thêm tiếp 10 phần -> 105 > 99
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: activeVariantId.toString(),
          option_value_ids: [requiredOption1Id.toString()],
          quantity: 10,
          note: 'Món của User 1',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('tối đa cho mỗi món là 99');
    });

    it('1.14 [Bảo mật & Phân quyền] Customer 2 sửa dòng giỏ của Customer 1 -> 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/cart/items/${customer1CartItemId}`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain(
        'Không tìm thấy dòng món trong giỏ hàng',
      );
    });

    it('1.15 [Bảo mật & Phân quyền] Customer 2 xóa dòng giỏ của Customer 1 -> 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/cart/items/${customer1CartItemId}`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 2. KIỂM THỬ KHUYẾN MÃI / COUPONS: CÁC TRƯỜNG HỢP BIÊN (BR-10, BR-11, BR-13)
  // ==========================================
  describe('2. Kiểm thử Tiêu cực Mã ưu đãi (Coupons Edge Cases)', () => {
    it('2.1 Validate mã không tồn tại -> 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          code: 'MA_KHONG_TON_TAI_XYZ',
          subtotal: 200000,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Không tìm thấy mã ưu đãi');
    });

    it('2.2 Validate mã đã hết hạn sử dụng -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          code: expiredCouponCode,
          subtotal: 200000,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('hết hạn sử dụng');
    });

    it('2.3 Validate mã tương lai chưa bắt đầu -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          code: futureCouponCode,
          subtotal: 200000,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('chưa bắt đầu');
    });

    it('2.4 Validate mã đang bị tạm khóa (is_active = false) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          code: disabledCouponCode,
          subtotal: 200000,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('tạm khóa');
    });

    it('2.5 [BR-10] Chưa đạt ngưỡng đơn tối thiểu min_subtotal -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          code: minSubtotalCouponCode, // Yêu cầu 100k
          subtotal: 99000,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('tối thiểu 100.000đ');
    });

    it('2.6 Không phân biệt hoa thường (Case-insensitive): nhập chữ thường vẫn nhận diện mã -> 201 Created', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          code: minSubtotalCouponCode.toLowerCase(),
          subtotal: 100000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.is_valid).toBe(true);
      expect(res.body.data.discount_amount).toBe(20000);
    });

    it('2.7 [RBAC] Khách hàng thường gọi API tạo mã ưu đãi Admin -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          code: 'HACKER_COUPON',
          name: 'Giảm 100%',
          discount_type: 'FIXED',
          discount_value: 50000,
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(403);
    });

    it('2.8 [Admin] Tạo mã có ngày kết thúc trước ngày bắt đầu -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `BAD_DATE_${Date.now()}`,
          name: 'Sai ngày',
          discount_type: 'FIXED',
          discount_value: 10000,
          starts_at: new Date(Date.now() + 86400000).toISOString(),
          ends_at: new Date(Date.now()).toISOString(), // Kết thúc trước bắt đầu
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Thời gian kết thúc phải sau thời gian bắt đầu',
      );
    });

    it('2.9 [Admin] Tạo mã trùng mã đã có -> 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: minSubtotalCouponCode, // Đã tồn tại
          name: 'Trùng mã',
          discount_type: 'FIXED',
          discount_value: 10000,
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('đã tồn tại');
    });
  });

  // ==========================================
  // 3. KIỂM THỬ ĐƠN HÀNG: CÁC TRƯỜNG HỢP BIÊN & BẢO MẬT (BR-05, BR-08, BR-21, BR-22)
  // ==========================================
  describe('3. Kiểm thử Tiêu cực Đơn hàng (Orders Edge Cases & Security)', () => {
    it('3.1 [BR-05] Checkout giao hàng (DELIVERY) nhưng thiếu địa chỉ giao hàng -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          checkout_key: `chk_${Date.now()}_empty_addr`,
          fulfillment_type: 'DELIVERY',
          payment_method: 'COD',
          recipient_name: 'Nguyễn Văn A',
          recipient_phone: '0901234567',
          delivery_address: '   ', // Chuỗi rỗng / khoảng trắng
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Vui lòng cung cấp địa chỉ giao hàng');
    });

    it('3.2 Chặn số điện thoại sai định dạng (chứa chữ cái hoặc ký tự lạ) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          checkout_key: `chk_${Date.now()}_bad_phone`,
          fulfillment_type: 'DELIVERY',
          payment_method: 'COD',
          recipient_name: 'Nguyễn Văn A',
          recipient_phone: '090123ABCD',
          delivery_address: 'Số 1 Trần Duy Hưng',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Số điện thoại không hợp lệ');
    });

    it('3.3 Chuẩn bị giỏ hàng và checkout đơn hàng hợp lệ cho Customer 1 -> 201 Created', async () => {
      // Cập nhật lại số lượng giỏ hàng của Customer 1 về 2 phần cho hợp lý
      await request(app.getHttpServer())
        .patch(`/api/v1/cart/items/${customer1CartItemId}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 2 });

      const res = await request(app.getHttpServer())
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          checkout_key: `chk_key_valid_${Date.now()}`,
          fulfillment_type: 'DELIVERY',
          payment_method: 'COD',
          recipient_name: 'Customer 1 Valid',
          recipient_phone: '0901111111',
          delivery_address: 'Tòa nhà Landmark 72, Hà Nội',
          coupon_code: limitedCouponCode, // Sử dụng mã có tổng lượt = 1
        });

      expect(res.status).toBe(201);
      customer1OrderId = res.body.data.id;
      expect(res.body.data.status).toBe(orders_status.PENDING_CONFIRMATION);
    });

    it('3.4 [BR-13] Chặn áp dụng mã khi đã hết tổng lượt sử dụng (total_limit = 1 đã bị dùng) -> 400 Bad Request', async () => {
      // Customer 2 thêm món và cố dùng lại limitedCouponCode
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          dish_id: activeDishId.toString(),
          variant_id: activeVariantId.toString(),
          option_value_ids: [requiredOption1Id.toString()],
          quantity: 1,
        });

      const res = await request(app.getHttpServer())
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          checkout_key: `chk_key_c2_${Date.now()}`,
          fulfillment_type: 'PICKUP',
          payment_method: 'COD',
          recipient_name: 'Customer 2',
          recipient_phone: '0902222222',
          coupon_code: limitedCouponCode,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Mã ưu đãi đã hết lượt sử dụng');
    });

    it('3.5 [Bảo mật Đơn hàng] Customer 2 cố tình xem chi tiết đơn hàng của Customer 1 -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${customer1OrderId}`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Bạn không có quyền xem đơn hàng này');
    });

    it('3.6 [Admin] Quán xác nhận đơn (PENDING_CONFIRMATION -> CONFIRMED) -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${customer1OrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: orders_status.CONFIRMED,
          note: 'Quán đã tiếp nhận đơn',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(orders_status.CONFIRMED);
      confirmedOrderId = customer1OrderId;
    });

    it('3.7 [BR-21] Chặn khách hàng tự hủy đơn sau khi quán đã xác nhận (CONFIRMED) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${confirmedOrderId}/cancel`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ reason: 'Muốn hủy sau khi quán đã duyệt' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('không thể tự hủy qua ứng dụng');
    });

    it('3.8 [BR-22] Chặn nhảy cóc trạng thái trái phép từ CONFIRMED -> READY (chưa qua nấu) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${confirmedOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: orders_status.READY });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Không thể chuyển trạng thái');
    });

    it('3.9 [BR-22] Chặn nhảy cóc từ CONFIRMED -> DELIVERING -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${confirmedOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: orders_status.DELIVERING });

      expect(res.status).toBe(400);
    });

    it('3.10 Luồng máy trạng thái chuẩn: CONFIRMED -> PREPARING -> READY -> DELIVERING -> COMPLETED', async () => {
      // 1. CONFIRMED -> PREPARING
      const resPrep = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${confirmedOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: orders_status.PREPARING });
      expect(resPrep.status).toBe(200);
      expect(resPrep.body.data.status).toBe(orders_status.PREPARING);

      // 2. PREPARING -> READY
      const resReady = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${confirmedOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: orders_status.READY });
      expect(resReady.status).toBe(200);
      expect(resReady.body.data.status).toBe(orders_status.READY);

      // 3. READY -> DELIVERING
      const resDeliv = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${confirmedOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: orders_status.DELIVERING });
      expect(resDeliv.status).toBe(200);
      expect(resDeliv.body.data.status).toBe(orders_status.DELIVERING);

      // 4. DELIVERING -> COMPLETED
      const resComp = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${confirmedOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: orders_status.COMPLETED });
      expect(resComp.status).toBe(200);
      expect(resComp.body.data.status).toBe(orders_status.COMPLETED);
      expect(resComp.body.data.completed_at).toBeDefined();
    });

    it('3.11 [BR-22] Đơn đã hoàn tất (COMPLETED) là trạng thái cuối, không thể chuyển tiếp -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${confirmedOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: orders_status.CANCELLED });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Không thể chuyển trạng thái');
    });
  });

  // ==========================================
  // 4. KIỂM THỬ PHÂN HỆ BẾP (KDS) & BẢO MẬT QUYỀN
  // ==========================================
  describe('4. Kiểm thử Phân hệ Bếp (KDS Edge Cases & RBAC)', () => {
    it('4.1 Khách hàng thường cố tình truy cập hàng đợi Bếp (GET /kitchen/queue) -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/kitchen/queue')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(403);
    });

    it('4.2 Khách hàng thường cố tình bấm nút Bếp bắt đầu nấu (POST /kitchen/orders/:id/start) -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/kitchen/orders/${confirmedOrderId}/start`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(403);
    });

    it('4.3 Bếp xem hàng đợi không chứa đơn đã COMPLETED hoặc CANCELLED', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/kitchen/queue')
        .set('Authorization', `Bearer ${kitchenToken}`);

      expect(res.status).toBe(200);
      const queue = res.body.data;
      // Đơn confirmedOrderId đã COMPLETED ở trên, không được xuất hiện trong queue bếp
      const found = queue.find((o: any) => o.id === confirmedOrderId);
      expect(found).toBeUndefined();
    });
  });
});
