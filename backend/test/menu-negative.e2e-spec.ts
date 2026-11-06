import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { createE2eApp } from './setup/create-e2e-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Menu Module Negative & Edge Cases Testing (Dữ liệu từ Xấu đến Tệ)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  const httpReq = () => request(app.getHttpServer());
  const api = {
    get: (url: string) =>
      httpReq().get(url).set('Authorization', `Bearer ${adminToken}`),
    post: (url: string) =>
      httpReq().post(url).set('Authorization', `Bearer ${adminToken}`),
    put: (url: string) =>
      httpReq().put(url).set('Authorization', `Bearer ${adminToken}`),
    patch: (url: string) =>
      httpReq().patch(url).set('Authorization', `Bearer ${adminToken}`),
    delete: (url: string) =>
      httpReq().delete(url).set('Authorization', `Bearer ${adminToken}`),
  };
  let validCategoryId: string;
  let validDishId: string;
  let validGroupId: string;

  beforeAll(async () => {
    app = await createE2eApp();

    // Thiết lập đúng như môi trường Production trong main.ts
    prisma = app.get(PrismaService);
    const jwt = app.get(JwtService);
    adminToken = await jwt.signAsync(
      { sub: '1', email: 'admin@viviet.test', role: 'ADMIN', status: 'ACTIVE' },
      {
        secret: 'vi_viet_super_secret_jwt_access_token_key_2026',
        expiresIn: '1h',
      },
    );

    // Lấy dữ liệu hợp lệ mẫu từ Database để làm mốc test
    const cat = await prisma.categories.findFirst({
      where: { is_active: true },
    });
    validCategoryId = cat!.id.toString();

    const dish = await prisma.dishes.findFirst({
      where: { deleted_at: null, availability: 'AVAILABLE' },
      include: {
        dish_variants: { where: { is_active: true } },
        option_groups: { include: { option_values: true } },
      },
    });
    validDishId = dish!.id.toString();
    if (dish!.option_groups.length > 0) {
      validGroupId = dish!.option_groups[0].id.toString();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // SUITE 1: DỮ LIỆU DANH MỤC (CATEGORIES) — TỪ XẤU ĐẾN TỆ
  // =========================================================================
  describe('Suite 1: Danh mục (Categories) - Dữ liệu xấu & vi phạm', () => {
    it('1.1 [Xấu] Tạo danh mục với body rỗng -> 400 Bad Request', async () => {
      const res = await api.post('/api/v1/admin/menu/categories').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('1.2 [Xấu] Tạo danh mục với tên chuỗi rỗng -> 400 Bad Request', async () => {
      const res = await api
        .post('/api/v1/admin/menu/categories')
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('1.3 [Xấu] Tạo danh mục với tên quá dài (> 100 ký tự) -> 400 Bad Request', async () => {
      const res = await api
        .post('/api/v1/admin/menu/categories')
        .send({ name: 'A'.repeat(105) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('1.4 [Tệ] Tạo danh mục có đính kèm trường lạ / mã độc injection -> 400 Bad Request', async () => {
      const res = await api.post('/api/v1/admin/menu/categories').send({
        name: 'Danh mục hợp lệ',
        malicious_payload: '<script>alert(1)</script>',
        admin_override: true,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('1.5 [Xấu] Tạo danh mục với slug đã tồn tại -> 409 Conflict', async () => {
      const res = await api
        .post('/api/v1/admin/menu/categories')
        .send({ name: 'Trùng món nước', slug: 'mon-nuoc' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('1.6 [Xấu] Cập nhật danh mục với ID không tồn tại (999999999) -> 404 Not Found', async () => {
      const res = await api
        .put('/api/v1/admin/menu/categories/999999999')
        .send({ name: 'Tên mới' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('1.7 [Tệ] Truy vấn món ăn với ID không phải số (ID: "abc-invalid") -> 400 Bad Request', async () => {
      const res = await api.get('/api/v1/admin/menu/dishes/abc-invalid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('ID hoặc tham số không hợp lệ');
    });

    it('1.8 [BR-33] Chặn xóa danh mục đang chứa món ăn hoạt động -> 400 Bad Request', async () => {
      const res = await api.delete(
        `/api/v1/admin/menu/categories/${validCategoryId}`,
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain(
        'Không thể xóa danh mục đã phát sinh dữ liệu',
      );
    });
  });

  // =========================================================================
  // SUITE 2: DỮ LIỆU MÓN ĂN (DISHES) — TỪ XẤU ĐẾN TỆ
  // =========================================================================
  describe('Suite 2: Món ăn (Dishes) - Dữ liệu xấu & vi phạm schema', () => {
    it('2.1 [Xấu] Tạo món ăn thiếu trường bắt buộc (thiếu category_id, name, default_variant) -> 400 Bad Request', async () => {
      const res = await api
        .post('/api/v1/admin/menu/dishes')
        .send({ description: 'Mô tả thiếu thông tin cốt lõi' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('2.2 [Tệ] Tạo món ăn với category_id không tồn tại (999999999) -> 404 Not Found', async () => {
      const res = await api.post('/api/v1/admin/menu/dishes').send({
        category_id: '999999999',
        name: 'Món vô danh',
        default_variant: { name: 'Mặc định', price: 50000 },
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('2.3 [Xấu] Tạo món ăn với giá biến thể tiêu chuẩn âm (-50,000đ) -> 400 Bad Request', async () => {
      const res = await api.post('/api/v1/admin/menu/dishes').send({
        category_id: validCategoryId,
        name: 'Món giá âm',
        default_variant: { name: 'Tiêu chuẩn', price: -50000 },
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('2.4 [Xấu] Tạo món ăn với cấp độ cay ngoài khoảng 0..3 (spicy_level: 5) -> 400 Bad Request', async () => {
      const res = await api.post('/api/v1/admin/menu/dishes').send({
        category_id: validCategoryId,
        name: 'Món siêu cay bất hợp pháp',
        spicy_level: 5,
        default_variant: { name: 'Tiêu chuẩn', price: 40000 },
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('2.5 [Xấu] Tạo món ăn với cấp độ cay âm (spicy_level: -1) -> 400 Bad Request', async () => {
      const res = await api.post('/api/v1/admin/menu/dishes').send({
        category_id: validCategoryId,
        name: 'Món cay âm',
        spicy_level: -1,
        default_variant: { name: 'Tiêu chuẩn', price: 40000 },
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('2.6 [Tệ] Tạo món ăn với enum dữ liệu thành phần không hợp lệ (ingredient_data_status: "SUPER_SAFE") -> 400 Bad Request', async () => {
      const res = await api.post('/api/v1/admin/menu/dishes').send({
        category_id: validCategoryId,
        name: 'Món kiểm tra enum',
        ingredient_data_status: 'SUPER_SAFE',
        default_variant: { name: 'Tiêu chuẩn', price: 40000 },
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('2.7 [Xấu] Tạo món ăn với slug đã tồn tại (pho-bo-tai-lan-gia-truyen) -> 409 Conflict', async () => {
      const res = await api.post('/api/v1/admin/menu/dishes').send({
        category_id: validCategoryId,
        name: 'Trùng Phở',
        slug: 'pho-bo-tai-lan-gia-truyen',
        default_variant: { name: 'Tiêu chuẩn', price: 50000 },
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('2.8 [Xấu] Tìm kiếm chi tiết món với slug không tồn tại -> 404 Not Found', async () => {
      const res = await api.get(
        '/api/v1/menu/dishes/slug-khong-ton-tai-abc-xyz-999',
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('2.9 [Xấu] Cập nhật món ăn với ID không tồn tại (999999999) -> 404 Not Found', async () => {
      const res = await api
        .put('/api/v1/admin/menu/dishes/999999999')
        .send({ name: 'Tên mới' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('2.10 [Xấu] Xóa món ăn với ID không tồn tại (999999999) -> 404 Not Found', async () => {
      const res = await api.delete('/api/v1/admin/menu/dishes/999999999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 3: QUY TẮC BẢO VỆ NGHIỆP VỤ [BR-03] & [BR-33]
  // =========================================================================
  describe('Suite 3: Quy tắc nghiệp vụ [BR-03] & [BR-33]', () => {
    it('3.1 [BR-03] Chặn bật mở bán (AVAILABLE) khi món không có bất kỳ biến thể nào đang hoạt động -> 400 Bad Request', async () => {
      // 1. Tạo một món tạm ở trạng thái HIDDEN
      const tempDish = await prisma.dishes.create({
        data: {
          category_id: BigInt(validCategoryId),
          name: 'Món tạm kiểm tra BR-03',
          slug: 'mon-tam-br-03-' + Date.now(),
          availability: 'HIDDEN',
        },
      });

      // 2. Tạo một biến thể nhưng tắt is_active = false
      const inactiveVariant = await prisma.dish_variants.create({
        data: {
          dish_id: tempDish.id,
          name: 'Biến thể tắt',
          price: 50000,
          is_active: false,
        },
      });

      // 3. Cố tình cập nhật availability = AVAILABLE
      const res = await api
        .patch(`/api/v1/admin/menu/dishes/${tempDish.id}/availability`)
        .send({ availability: 'AVAILABLE' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('BR-03');

      // Dọn dẹp bản ghi tạm
      await prisma.dish_variants.delete({ where: { id: inactiveVariant.id } });
      await prisma.dishes.delete({ where: { id: tempDish.id } });
    });

    it('3.2 [BR-03] Chặn tắt biến thể hoạt động duy nhất của món đang mở bán (AVAILABLE) -> 400 Bad Request', async () => {
      // 1. Tạo một món tạm ở trạng thái AVAILABLE với đúng 1 biến thể active
      const tempDish = await prisma.dishes.create({
        data: {
          category_id: BigInt(validCategoryId),
          name: 'Món tạm test biến thể duy nhất',
          slug: 'mon-tam-variant-' + Date.now(),
          availability: 'AVAILABLE',
        },
      });
      const singleVariant = await prisma.dish_variants.create({
        data: {
          dish_id: tempDish.id,
          name: 'Biến thể duy nhất',
          price: 50000,
          is_active: true,
        },
      });

      // 2. Cố tình tắt biến thể này
      const res = await api
        .put(
          `/api/v1/admin/menu/dishes/${tempDish.id}/variants/${singleVariant.id}`,
        )
        .send({ is_active: false });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('BR-03');

      // Dọn dẹp bản ghi tạm
      await prisma.dish_variants.delete({ where: { id: singleVariant.id } });
      await prisma.dishes.delete({ where: { id: tempDish.id } });
    });

    it('3.3 [BR-33] Món ăn sau khi xóa mềm không thể truy cập qua API Public -> 404 Not Found', async () => {
      // 1. Tạo một món tạm
      const tempDish = await prisma.dishes.create({
        data: {
          category_id: BigInt(validCategoryId),
          name: 'Món tạm kiểm tra xóa mềm',
          slug: 'mon-tam-xoa-mem-' + Date.now(),
          availability: 'AVAILABLE',
        },
      });

      // 2. Thực hiện xóa mềm
      const deleteRes = await api.delete(
        `/api/v1/admin/menu/dishes/${tempDish.id}`,
      );
      expect(deleteRes.status).toBe(200);

      // 3. Truy vấn qua API Public theo slug -> Phải nhận 404
      const publicRes = await api.get(`/api/v1/menu/dishes/${tempDish.slug}`);
      expect(publicRes.status).toBe(404);

      // Dọn dẹp bản ghi tạm
      await prisma.dishes.delete({ where: { id: tempDish.id } });
    });
  });

  // =========================================================================
  // SUITE 4: DỮ LIỆU BIẾN THỂ (VARIANTS) — TỪ XẤU ĐẾN TỆ
  // =========================================================================
  describe('Suite 4: Biến thể (Variants) - Dữ liệu xấu & vi phạm', () => {
    it('4.1 [Xấu] Thêm biến thể với giá âm (-30,000đ) -> 400 Bad Request', async () => {
      const res = await api
        .post(`/api/v1/admin/menu/dishes/${validDishId}/variants`)
        .send({ name: 'Biến thể giá âm', price: -30000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('4.2 [Xấu] Thêm biến thể với tên chuỗi rỗng -> 400 Bad Request', async () => {
      const res = await api
        .post(`/api/v1/admin/menu/dishes/${validDishId}/variants`)
        .send({ name: '', price: 50000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('4.3 [Xấu] Thêm biến thể bị trùng tên trong cùng một món -> 409 Conflict', async () => {
      const existing = await prisma.dish_variants.findFirst({
        where: { dish_id: BigInt(validDishId) },
      });

      const res = await api
        .post(`/api/v1/admin/menu/dishes/${validDishId}/variants`)
        .send({ name: existing!.name, price: 90000 });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('4.4 [Tệ] Thêm biến thể vào món không tồn tại (999999999) -> 404 Not Found', async () => {
      const res = await api
        .post('/api/v1/admin/menu/dishes/999999999/variants')
        .send({ name: 'Biến thể mồ côi', price: 50000 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('4.5 [Tệ] Cross-dish variant: Cập nhật biến thể qua sai ID món ăn -> 404 Not Found', async () => {
      // Tìm 2 món ăn khác nhau
      const dishes = await prisma.dishes.findMany({
        where: { deleted_at: null },
        take: 2,
        include: { dish_variants: true },
      });

      if (dishes.length >= 2 && dishes[1].dish_variants.length > 0) {
        const dishAId = dishes[0].id.toString();
        const variantBId = dishes[1].dish_variants[0].id.toString();

        // Gửi request tới món A nhưng dùng variantId của món B
        const res = await api
          .put(`/api/v1/admin/menu/dishes/${dishAId}/variants/${variantBId}`)
          .send({ name: 'Tấn công chéo biến thể' });

        expect(res.status).toBe(404);
      }
    });
  });

  // =========================================================================
  // SUITE 5: NHÓM TÙY CHỌN & LỰA CHỌN (OPTIONS) — TỪ XẤU ĐẾN TỆ
  // =========================================================================
  describe('Suite 5: Nhóm tùy chọn & Lựa chọn - Dữ liệu xấu & vi phạm logic', () => {
    it('5.1 [Tệ] Tạo nhóm tùy chọn với logic nghịch lý (min_select: 3, max_select: 1) -> 400 Bad Request', async () => {
      const res = await api
        .post(`/api/v1/admin/menu/dishes/${validDishId}/option-groups`)
        .send({
          name: 'Nhóm nghịch lý',
          min_select: 3,
          max_select: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'max_select không được nhỏ hơn min_select',
      );
    });

    it('5.2 [Xấu] Tạo nhóm tùy chọn với min_select âm (-1) -> 400 Bad Request', async () => {
      const res = await api
        .post(`/api/v1/admin/menu/dishes/${validDishId}/option-groups`)
        .send({
          name: 'Nhóm min âm',
          min_select: -1,
          max_select: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('5.3 [Xấu] Tạo nhóm tùy chọn với max_select = 0 (tối thiểu là 1) -> 400 Bad Request', async () => {
      const res = await api
        .post(`/api/v1/admin/menu/dishes/${validDishId}/option-groups`)
        .send({
          name: 'Nhóm max 0',
          min_select: 0,
          max_select: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('5.4 [Xấu] Thêm lựa chọn với phụ thu âm (-10,000đ) -> 400 Bad Request', async () => {
      if (!validGroupId) return;

      const res = await api
        .post(
          `/api/v1/admin/menu/dishes/${validDishId}/option-groups/${validGroupId}/values`,
        )
        .send({ name: 'Topping âm tiền', extra_price: -10000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('5.5 [Xấu] Thêm lựa chọn bị trùng tên trong cùng một nhóm -> 409 Conflict', async () => {
      if (!validGroupId) return;

      const existingVal = await prisma.option_values.findFirst({
        where: { group_id: BigInt(validGroupId) },
      });
      if (!existingVal) return;

      const res = await api
        .post(
          `/api/v1/admin/menu/dishes/${validDishId}/option-groups/${validGroupId}/values`,
        )
        .send({ name: existingVal.name, extra_price: 5000 });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('5.6 [Tệ] Cross-dish group: Thêm lựa chọn với groupId thuộc món khác -> 404 Not Found', async () => {
      const dishes = await prisma.dishes.findMany({
        where: { deleted_at: null },
        take: 2,
        include: { option_groups: true },
      });

      if (dishes.length >= 2 && dishes[1].option_groups.length > 0) {
        const dishAId = dishes[0].id.toString();
        const groupBId = dishes[1].option_groups[0].id.toString();

        const res = await api
          .post(
            `/api/v1/admin/menu/dishes/${dishAId}/option-groups/${groupBId}/values`,
          )
          .send({ name: 'Lựa chọn tấn công chéo', extra_price: 5000 });

        expect(res.status).toBe(404);
      }
    });
  });

  // =========================================================================
  // SUITE 6: DỮ LIỆU ĐỘC HẠI & AN NINH (SECURITY & INJECTION PAYLOADS)
  // =========================================================================
  describe('Suite 6: Dữ liệu độc hại & An ninh (Injection payloads)', () => {
    it('6.1 [Tệ] SQL Injection trong tham số tìm kiếm -> Xử lý an toàn, 200 OK', async () => {
      const maliciousPayload = "' OR '1'='1";
      const res = await api.get(
        `/api/v1/menu/dishes?search=${encodeURIComponent(maliciousPayload)}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('6.2 [Tệ] SQL Injection phá hoại (DROP TABLE) -> Xử lý an toàn, database nguyên vẹn', async () => {
      const maliciousPayload = "'; DROP TABLE dishes; --";
      const res = await api.get(
        `/api/v1/menu/dishes?search=${encodeURIComponent(maliciousPayload)}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Xác minh bảng dishes vẫn nguyên vẹn
      const count = await prisma.dishes.count();
      expect(count).toBeGreaterThan(0);
    });

    it('6.3 [Tệ] SQL Injection trong slug món -> 404 Not Found an toàn', async () => {
      const maliciousSlug = "pho' OR 1=1 --";
      const res = await api.get(
        `/api/v1/menu/dishes/${encodeURIComponent(maliciousSlug)}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('6.4 [Xấu] Phân trang số âm (page: -5, limit: -10) -> Chặn dữ liệu không hợp lệ với 400 Bad Request', async () => {
      const res = await api.get('/api/v1/menu/dishes?page=-5&limit=-10');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.message)).toBe(true);
    });

    it('6.5 [Tệ] Payload XSS trong tạo danh mục -> Lưu chuỗi an toàn, không phá hỏng JSON', async () => {
      const xssName = "<script>alert('XSS_TEST')</script> Tráng miệng";
      const res = await api
        .post('/api/v1/admin/menu/categories')
        .send({ name: xssName });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(xssName);

      // Dọn dẹp
      await prisma.categories.delete({
        where: { id: BigInt(res.body.data.id) },
      });
    });
  });

  // =========================================================================
  // SUITE 7: TẢI ẢNH (FILE UPLOAD) — TỪ XẤU ĐẾN TỆ
  // =========================================================================
  describe('Suite 7: Tải ảnh (Image Upload) - Từ xấu đến tệ', () => {
    it('7.1 [Xấu] Upload không đính kèm file nào -> 400 Bad Request', async () => {
      const res = await api
        .post(`/api/v1/admin/menu/dishes/${validDishId}/images/upload`)
        .field('kind', 'GALLERY');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('7.2 [Tệ] Upload file sai định dạng (file .txt giả mạo hoặc script) -> 400 Bad Request', async () => {
      const fakeTextBuffer = Buffer.from('echo "Malicious Script Payload"');

      const res = await api
        .post(`/api/v1/admin/menu/dishes/${validDishId}/images/upload`)
        .attach('file', fakeTextBuffer, {
          filename: 'payload.txt',
          contentType: 'text/plain',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Định dạng file không hỗ trợ');
    });

    it('7.3 [Tệ] Upload file vượt quá giới hạn 5MB (file 6MB) -> 413 Payload Too Large được chặn an toàn', async () => {
      // Tạo buffer 5.5MB
      const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0);

      const res = await api
        .post(`/api/v1/admin/menu/dishes/${validDishId}/images/upload`)
        .attach('file', oversizedBuffer, {
          filename: 'oversized-image.png',
          contentType: 'image/png',
        });

      // Multer sẽ ngắt kết nối với lỗi File too large (HTTP 413 Payload Too Large)
      expect([400, 413]).toContain(res.status);
    });

    it('7.4 [Tệ] Upload ảnh vào món không tồn tại (999999999) -> 404 Not Found', async () => {
      const samplePng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      );

      const res = await api
        .post('/api/v1/admin/menu/dishes/999999999/images/upload')
        .attach('file', samplePng, {
          filename: 'valid.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('7.5 [Xấu] Thêm ảnh URL với kind không hợp lệ (MALICIOUS_KIND) -> 400 Bad Request', async () => {
      const res = await api
        .post(`/api/v1/admin/menu/dishes/${validDishId}/images`)
        .send({
          asset_path: 'https://example.com/image.jpg',
          kind: 'MALICIOUS_KIND',
          alt_text: 'Ảnh xấu',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('7.6 [Xấu] Xóa ảnh không tồn tại (999999999) -> 404 Not Found', async () => {
      const res = await api.delete(
        `/api/v1/admin/menu/dishes/${validDishId}/images/999999999`,
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('7.7 [Tệ] Cross-dish image deletion: Xóa ảnh của món A nhưng gọi qua URL món B -> 404 Not Found', async () => {
      const dishes = await prisma.dishes.findMany({
        where: { deleted_at: null },
        take: 2,
        include: { dish_images: true },
      });

      if (dishes.length >= 2 && dishes[1].dish_images.length > 0) {
        const dishAId = dishes[0].id.toString();
        const imageBId = dishes[1].dish_images[0].id.toString();

        const res = await api.delete(
          `/api/v1/admin/menu/dishes/${dishAId}/images/${imageBId}`,
        );

        expect(res.status).toBe(404);
      }
    });
  });

  // =========================================================================
  // SUITE 8: KIỂM TRA CÁC BẢN VÁ AUDIT (POST-AUDIT FIXES VERIFICATION)
  // =========================================================================
  describe('Suite 8: Kiểm tra các bản vá Audit (Post-Audit Fixes)', () => {
    it('8.1 [Vá Audit 1] Chặn xóa chéo biến thể: Xóa biến thể của món B qua URL của món A -> 404 Not Found', async () => {
      const dishes = await prisma.dishes.findMany({
        where: { deleted_at: null },
        take: 2,
        include: { dish_variants: true },
      });

      if (dishes.length >= 2 && dishes[1].dish_variants.length > 0) {
        const dishAId = dishes[0].id.toString();
        const variantBId = dishes[1].dish_variants[0].id.toString();

        const res = await api.delete(
          `/api/v1/admin/menu/dishes/${dishAId}/variants/${variantBId}`,
        );

        expect(res.status).toBe(404);
        expect(res.body.message).toContain('Không tìm thấy biến thể');
      }
    });

    it('8.2 [Vá Audit 2] Chặn xóa chéo lựa chọn tùy chọn: Xóa option value của món B qua URL món A -> 404 Not Found', async () => {
      const dishes = await prisma.dishes.findMany({
        where: { deleted_at: null },
        take: 2,
        include: { option_groups: { include: { option_values: true } } },
      });

      if (
        dishes.length >= 2 &&
        dishes[1].option_groups.length > 0 &&
        dishes[1].option_groups[0].option_values.length > 0
      ) {
        const dishAId = dishes[0].id.toString();
        const groupBId = dishes[1].option_groups[0].id.toString();
        const valueBId =
          dishes[1].option_groups[0].option_values[0].id.toString();

        const res = await api.delete(
          `/api/v1/admin/menu/dishes/${dishAId}/option-groups/${groupBId}/values/${valueBId}`,
        );

        expect(res.status).toBe(404);
        expect(res.body.message).toContain('Không tìm thấy lựa chọn');
      }
    });

    it('8.3 [Vá Audit 3] Xóa mềm món ăn giải phóng slug cho phép tạo lại món cùng tên -> 201 Created', async () => {
      const reuseSlug = 'mon-test-reuse-slug-' + Date.now();

      // 1. Tạo món ban đầu
      const firstDishRes = await api.post('/api/v1/admin/menu/dishes').send({
        category_id: validCategoryId,
        name: 'Món Thử Tái Sử Dụng Slug',
        slug: reuseSlug,
        default_variant: { name: 'Tiêu chuẩn', price: 45000 },
      });
      expect(firstDishRes.status).toBe(201);
      const firstDishId = firstDishRes.body.data.id;

      // 2. Xóa mềm món
      const delRes = await api.delete(
        `/api/v1/admin/menu/dishes/${firstDishId}`,
      );
      expect(delRes.status).toBe(200);

      // 3. Tạo lại món mới với cùng slug đó -> Phải thành công 201 (không bị kẹt khóa @unique)
      const secondDishRes = await api.post('/api/v1/admin/menu/dishes').send({
        category_id: validCategoryId,
        name: 'Món Thử Tái Sử Dụng Slug Lần 2',
        slug: reuseSlug,
        default_variant: { name: 'Tiêu chuẩn', price: 55000 },
      });
      expect(secondDishRes.status).toBe(201);
      expect(secondDishRes.body.data.slug).toBe(reuseSlug);

      // Dọn dẹp bản ghi test
      await prisma.dish_variants.deleteMany({
        where: { dish_id: BigInt(secondDishRes.body.data.id) },
      });
      await prisma.dishes.delete({
        where: { id: BigInt(secondDishRes.body.data.id) },
      });
      await prisma.dish_variants.deleteMany({
        where: { dish_id: BigInt(firstDishId) },
      });
      await prisma.dishes.delete({ where: { id: BigInt(firstDishId) } });
    });

    it('8.4 [Vá Audit 6] Tự động khử trùng lặp mảng tag_ids khi gán tags cho món -> 200 OK', async () => {
      const tags = await prisma.tags.findMany({ take: 2 });
      if (tags.length >= 2) {
        const duplicateTagIds = [
          tags[0].id.toString(),
          tags[0].id.toString(),
          tags[1].id.toString(),
        ];

        const res = await api
          .put(`/api/v1/admin/menu/dishes/${validDishId}/tags`)
          .send({ tag_ids: duplicateTagIds });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });

    it('8.5 [Vá Audit 7] Tên chỉ chứa ký tự đặc biệt / dấu câu (???) -> 400 Bad Request', async () => {
      const res = await api
        .post('/api/v1/admin/menu/categories')
        .send({ name: '???' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Tiêu đề hoặc đường dẫn (slug) không hợp lệ',
      );
    });
  });
});
