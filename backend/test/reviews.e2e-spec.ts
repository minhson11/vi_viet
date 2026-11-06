import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { createE2eApp } from './setup/create-e2e-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import {
  dishes_availability,
  orders_status,
  orders_payment_status,
  reviews_visibility,
} from '@prisma/client';

describe('Reviews Module E2E Testing (BR-24, BR-25, AC-16, Moderation)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const testEmailCustomer1 = `rev_cust1_${Date.now()}@viviet.test`;
  const testEmailCustomer2 = `rev_cust2_${Date.now()}@viviet.test`;
  let customer1Token: string;
  let customer1Id: string;
  let customer2Token: string;
  let customer2Id: string;

  let adminToken: string;
  let adminUserId: bigint;

  let testCategoryId: bigint;
  let testDishId: bigint;
  let testVariantId: bigint;

  let completedOrderId: bigint;
  let completedOrderItemId: bigint;
  let uncompletedOrderId: bigint;
  let uncompletedOrderItemId: bigint;

  let createdReviewId: string;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // 1. Tạo Customer 1
    const cust1 = await prisma.users.create({
      data: {
        email: testEmailCustomer1,
        password_hash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
        full_name: 'Khách Đánh Giá Một',
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
        full_name: 'Khách Đánh Giá Hai',
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
        email: `rev_admin_${Date.now()}@viviet.test`,
        password_hash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
        full_name: 'Quản Trị Viên Reviews',
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

    // 4. Tạo Category, Dish và Variant test
    const cat = await prisma.categories.create({
      data: {
        name: 'Đánh Giá Test Category',
        slug: `rev-cat-${Date.now()}`,
        is_active: true,
      },
    });
    testCategoryId = cat.id;

    const dish = await prisma.dishes.create({
      data: {
        category_id: testCategoryId,
        name: 'Phở Bò Đặc Biệt Reviews',
        slug: `pho-bo-reviews-${Date.now()}`,
        availability: dishes_availability.AVAILABLE,
      },
    });
    testDishId = dish.id;

    const variant = await prisma.dish_variants.create({
      data: {
        dish_id: testDishId,
        name: 'Tô Lớn',
        price: 65000,
        is_active: true,
      },
    });
    testVariantId = variant.id;

    // 5. Tạo đơn hàng đã COMPLETED cho Customer 1
    const order1 = await prisma.orders.create({
      data: {
        order_code: `VV-REV-COMPLETED-${Date.now()}`,
        checkout_key: `chk_rev_comp_${Date.now()}`,
        user_id: cust1.id,
        fulfillment_type: 'PICKUP',
        status: orders_status.COMPLETED,
        payment_status: orders_payment_status.PAID,
        recipient_name: 'Khách 1',
        recipient_phone: '0901234567',
        subtotal: 65000,
        total_amount: 65000,
        completed_at: new Date(),
      },
    });
    completedOrderId = order1.id;

    const item1 = await prisma.order_items.create({
      data: {
        order_id: completedOrderId,
        dish_id: testDishId,
        variant_id: testVariantId,
        dish_name: 'Phở Bò Đặc Biệt Reviews',
        variant_name: 'Tô Lớn',
        base_price: 65000,
        options_price: 0,
        quantity: 1,
        line_total: 65000,
      },
    });
    completedOrderItemId = item1.id;

    // 6. Tạo đơn hàng chưa COMPLETED (CONFIRMED) cho Customer 1
    const order2 = await prisma.orders.create({
      data: {
        order_code: `VV-REV-CONFIRMED-${Date.now()}`,
        checkout_key: `chk_rev_conf_${Date.now()}`,
        user_id: cust1.id,
        fulfillment_type: 'PICKUP',
        status: orders_status.CONFIRMED,
        payment_status: orders_payment_status.UNPAID,
        recipient_name: 'Khách 1',
        recipient_phone: '0901234567',
        subtotal: 65000,
        total_amount: 65000,
      },
    });
    uncompletedOrderId = order2.id;

    const item2 = await prisma.order_items.create({
      data: {
        order_id: uncompletedOrderId,
        dish_id: testDishId,
        variant_id: testVariantId,
        dish_name: 'Phở Bò Đặc Biệt Reviews',
        variant_name: 'Tô Lớn',
        base_price: 65000,
        options_price: 0,
        quantity: 1,
        line_total: 65000,
      },
    });
    uncompletedOrderItemId = item2.id;
  });

  afterAll(async () => {
    try {
      await prisma.reviews.deleteMany({
        where: {
          order_items: { dish_id: testDishId },
        },
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
  // PHẦN 1: KHÁCH HÀNG ĐÁNH GIÁ MÓN SAU KHI MUA (API-85, BR-24, AC-16)
  // =========================================================================
  describe('1. Khách hàng gửi và cập nhật đánh giá món ăn (BR-24, AC-16)', () => {
    it('1.1 [AC-16 / BR-24] Chặn đánh giá món ăn từ đơn chưa hoàn thành (CONFIRMED) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${uncompletedOrderItemId}/review`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          rating: 5,
          content: 'Thử đánh giá trước khi đơn hoàn thành',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Chỉ có thể đánh giá món ăn khi đơn hàng đã hoàn thành',
      );
    });

    it('1.2 [Bảo mật] Customer 2 cố đánh giá dòng món của Customer 1 -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${completedOrderItemId}/review`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          rating: 5,
          content: 'Cố đánh giá đơn của người khác',
        });

      expect(res.status).toBe(403);
    });

    it('1.3 Gửi rating không hợp lệ (rating = 6 hoặc rating = 0) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${completedOrderItemId}/review`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          rating: 6,
          content: 'Quá số sao',
        });

      expect(res.status).toBe(400);
    });

    it('1.4 Khách gửi đánh giá hợp lệ cho đơn COMPLETED -> 200 OK & Ẩn danh hóa họ tên', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${completedOrderItemId}/review`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          rating: 5,
          content: 'Phở bò tái lăn rất ngon, nước dùng ngọt thanh gia truyền!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.content).toBe(
        'Phở bò tái lăn rất ngon, nước dùng ngọt thanh gia truyền!',
      );
      expect(res.body.data.dish_id).toBe(testDishId.toString());
      expect(res.body.data.author_display_name).toContain('***');

      createdReviewId = res.body.data.id;
    });

    it('1.5 Cập nhật lại đánh giá trên cùng dòng món -> Idempotent, cập nhật rating và content', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/order-items/${completedOrderItemId}/review`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          rating: 4,
          content:
            'Sửa lại nhận xét: Bát phở hơi ít hành tây một chút nhưng vẫn ngon.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdReviewId);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.content).toContain('Sửa lại nhận xét');

      // Đảm bảo trong CSDL chỉ có duy nhất 1 bản ghi review cho dòng món này
      const count = await prisma.reviews.count({
        where: { order_item_id: completedOrderItemId },
      });
      expect(count).toBe(1);
    });
  });

  // =========================================================================
  // PHẦN 2: PUBLIC XEM ĐÁNH GIÁ MÓN ĂN (API-25)
  // =========================================================================
  describe('2. Khách vãng lai xem danh sách đánh giá của món ăn (API-25)', () => {
    it('2.1 Public lấy danh sách đánh giá thành công kèm điểm trung bình -> 200 OK', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/v1/dishes/${testDishId}/reviews`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.average_rating).toBe(4);
      expect(res.body.data.items[0].author_display_name).toBeDefined();
      expect(res.body.data.items[0].author_display_name).not.toContain(
        testEmailCustomer1,
      );
    });
  });

  // =========================================================================
  // PHẦN 3: ADMIN QUẢN LÝ VÀ KIỂM DUYỆT ĐÁNH GIÁ (API-72, API-73 - BR-25)
  // =========================================================================
  describe('3. Admin kiểm duyệt và phản hồi đánh giá (API-72, API-73 - BR-25)', () => {
    it('3.1 Admin xem danh sách đánh giá đầy đủ thông tin khách hàng -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      const found = res.body.data.items.find(
        (r: any) => r.id === createdReviewId,
      );
      expect(found).toBeDefined();
      expect(found.order_item.customer_email).toBe(testEmailCustomer1);
    });

    it('3.2 Admin phản hồi đánh giá của khách hàng -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/reviews/${createdReviewId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reply:
            'Dạ cảm ơn quý khách đã góp ý! Lần tới quán sẽ lưu ý thêm hành tây cho mình ạ.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.reply).toContain('quý khách đã góp ý');
      expect(res.body.data.replied_by).toBe(adminUserId.toString());
      expect(res.body.data.replied_at).not.toBeNull();
    });

    it('3.3 [BR-25] Admin ẩn đánh giá nhưng KHÔNG cung cấp moderationReason -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/reviews/${createdReviewId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          visibility: reviews_visibility.HIDDEN,
          // Không gửi moderationReason
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'bắt buộc phải cung cấp lý do kiểm duyệt',
      );
    });

    it('3.4 Admin ẩn đánh giá kèm lý do kiểm duyệt hợp lệ -> 200 OK & Biến mất khỏi Public API', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/reviews/${createdReviewId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          visibility: reviews_visibility.HIDDEN,
          moderationReason:
            'Nội dung chứa từ ngữ gây hiểu lầm hoặc vi phạm quy chuẩn cộng đồng',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.visibility).toBe(reviews_visibility.HIDDEN);
      expect(res.body.data.moderation_reason).toContain(
        'vi phạm quy chuẩn cộng đồng',
      );

      // Kiểm tra lại Public API: Review này không còn xuất hiện đối với khách vãng lai
      const publicRes = await request(app.getHttpServer()).get(
        `/api/v1/dishes/${testDishId}/reviews`,
      );
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.total).toBe(0);
      expect(publicRes.body.data.items.length).toBe(0);
    });
  });
});
