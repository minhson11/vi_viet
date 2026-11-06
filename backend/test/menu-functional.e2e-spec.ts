import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { createE2eApp } from './setup/create-e2e-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Menu Module Functional Testing (Kiểm thử Chức năng Toàn diện)', () => {
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

  // Biến lưu trữ ID động dùng xuyên suốt các kịch bản test
  let sampleCategoryId: string;
  let createdCategoryId: string;
  let createdDishId: string;
  let createdDishSlug: string;
  let createdGroupId: string;
  let createdValueId: string;
  let createdImageId: string;
  let sampleTagIds: string[] = [];
  let sampleIngredientIds: string[] = [];

  beforeAll(async () => {
    app = await createE2eApp();

    // Cấu hình chuẩn Production
    prisma = app.get(PrismaService);
    const jwt = app.get(JwtService);
    adminToken = await jwt.signAsync(
      { sub: '1', email: 'admin@viviet.test', role: 'ADMIN', status: 'ACTIVE' },
      {
        secret: 'vi_viet_super_secret_jwt_access_token_key_2026',
        expiresIn: '1h',
      },
    );

    // Chuẩn bị dữ liệu mẫu ban đầu
    const cat = await prisma.categories.findFirst({
      where: { is_active: true },
    });
    if (cat) sampleCategoryId = cat.id.toString();

    const tags = await prisma.tags.findMany({ take: 3 });
    sampleTagIds = tags.map((t) => t.id.toString());

    const ingredients = await prisma.ingredients.findMany({ take: 3 });
    sampleIngredientIds = ingredients.map((i) => i.id.toString());
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu test sinh ra trong quá trình chạy
    if (createdDishId) {
      const dishBigInt = BigInt(createdDishId);
      await prisma.dish_images
        .deleteMany({ where: { dish_id: dishBigInt } })
        .catch(() => {});
      await prisma.dish_tags
        .deleteMany({ where: { dish_id: dishBigInt } })
        .catch(() => {});
      await prisma.dish_ingredients
        .deleteMany({ where: { dish_id: dishBigInt } })
        .catch(() => {});
      await prisma.option_values
        .deleteMany({ where: { dish_id: dishBigInt } })
        .catch(() => {});
      await prisma.option_groups
        .deleteMany({ where: { dish_id: dishBigInt } })
        .catch(() => {});
      await prisma.dish_variants
        .deleteMany({ where: { dish_id: dishBigInt } })
        .catch(() => {});
      await prisma.dishes.delete({ where: { id: dishBigInt } }).catch(() => {});
    }

    if (createdCategoryId) {
      await prisma.categories
        .delete({ where: { id: BigInt(createdCategoryId) } })
        .catch(() => {});
    }

    await app?.close();
  });

  // =========================================================================
  // 1. CHỨC NĂNG QUẢN LÝ DANH MỤC (CATEGORIES)
  // =========================================================================
  describe('1. Quản lý Danh mục (Categories CRUD & Public APIs)', () => {
    it('1.1 [Public] Lấy danh sách danh mục công khai đang hoạt động -> 200 OK', async () => {
      const res = await api.get('/api/v1/menu/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const first = res.body.data[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('slug');
      expect(first._count).toHaveProperty('dishes');
    });

    it('1.2 [Admin] Lấy toàn bộ danh sách danh mục cho quản trị -> 200 OK', async () => {
      const res = await api.get('/api/v1/admin/menu/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('1.3 [Admin] Tạo danh mục mới thành công -> 201 Created', async () => {
      const newCategoryDto = {
        name: 'Món Cuốn & Trộn Đặc Biệt ' + Date.now(),
        sort_order: 10,
        is_active: true,
      };

      const res = await api
        .post('/api/v1/admin/menu/categories')
        .send(newCategoryDto);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(newCategoryDto.name);
      expect(res.body.data.slug).toBeDefined();
      expect(res.body.data.sort_order).toBe(10);

      createdCategoryId = res.body.data.id;
    });

    it('1.4 [Admin] Cập nhật thông tin danh mục -> 200 OK', async () => {
      const updateDto = {
        name: 'Món Cuốn & Gỏi Cải Tiến ' + Date.now(),
        sort_order: 15,
      };

      const res = await api
        .put(`/api/v1/admin/menu/categories/${createdCategoryId}`)
        .send(updateDto);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateDto.name);
      expect(res.body.data.sort_order).toBe(15);
    });

    it('1.5 [Admin] Xóa danh mục trống (không chứa món ăn) -> 200 OK', async () => {
      // Tạo danh mục tạm để test xóa
      const tempCat = await prisma.categories.create({
        data: {
          name: 'Danh mục tạm để test xóa',
          slug: 'danh-muc-tam-xoa-' + Date.now(),
          sort_order: 99,
        },
      });

      const res = await api.delete(
        `/api/v1/admin/menu/categories/${tempCat.id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.categories.findUnique({
        where: { id: tempCat.id },
      });
      expect(check).toBeNull();
    });
  });

  // =========================================================================
  // 2. CHỨC NĂNG TẠO & QUẢN TRỊ MÓN ĂN (DISHES ADMIN)
  // =========================================================================
  describe('2. Quản trị Món ăn (Dishes Admin Operations)', () => {
    it('2.1 [Admin] Tạo món ăn mới cùng biến thể mặc định ban đầu (Bảo đảm BR-03) -> 201 Created', async () => {
      const newDishDto = {
        category_id: createdCategoryId || sampleCategoryId,
        name: 'Gỏi Cuốn Tôm Thịt Nam Bộ ' + Date.now(),
        description:
          'Tôm tươi, thịt ba chỉ luộc, rau sống cuộn bánh tráng dẻo thơm chấm tương đậu phộng.',
        story:
          'Món ăn thanh mát nổi tiếng của miền Nam, đậm đà vị tương đặc chế gia truyền.',
        spicy_level: 0,
        ingredient_data_status: 'VERIFIED',
        availability: 'AVAILABLE',
        sort_order: 1,
        default_variant: {
          name: 'Phần 3 cuốn tiêu chuẩn',
          price: 45000,
        },
      };

      const res = await api.post('/api/v1/admin/menu/dishes').send(newDishDto);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe(newDishDto.name);
      expect(res.body.data.slug).toBeDefined();
      expect(res.body.data.default_variant).toBeDefined();
      expect(Number(res.body.data.default_variant.price)).toBe(45000);

      createdDishId = res.body.data.id;
      createdDishSlug = res.body.data.slug;
    });

    it('2.2 [Admin] Lấy chi tiết món ăn theo ID -> 200 OK', async () => {
      const res = await api.get(`/api/v1/admin/menu/dishes/${createdDishId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdDishId);
      expect(res.body.data.dish_variants.length).toBeGreaterThanOrEqual(1);
    });

    it('2.3 [Admin] Cập nhật thông tin chi tiết món ăn -> 200 OK', async () => {
      const updateDishDto = {
        description:
          'Cập nhật: Tôm sú tươi loại 1, thịt heo sạch ba chỉ cuộn rau sống.',
        spicy_level: 1,
      };

      const res = await api
        .put(`/api/v1/admin/menu/dishes/${createdDishId}`)
        .send(updateDishDto);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe(updateDishDto.description);
      expect(res.body.data.spicy_level).toBe(1);
    });

    it('2.4 [Admin] Thao tác nút chuyển đổi trạng thái bán nhanh (AVAILABLE -> SOLD_OUT -> AVAILABLE) -> 200 OK', async () => {
      // Chuyển sang SOLD_OUT (Báo hết món)
      const resSoldOut = await api
        .patch(`/api/v1/admin/menu/dishes/${createdDishId}/availability`)
        .send({ availability: 'SOLD_OUT' });

      expect(resSoldOut.status).toBe(200);
      expect(resSoldOut.body.data.availability).toBe('SOLD_OUT');

      // Chuyển lại về AVAILABLE (Mở bán lại)
      const resAvailable = await api
        .patch(`/api/v1/admin/menu/dishes/${createdDishId}/availability`)
        .send({ availability: 'AVAILABLE' });

      expect(resAvailable.status).toBe(200);
      expect(resAvailable.body.data.availability).toBe('AVAILABLE');
    });
  });

  // =========================================================================
  // 3. CHỨC NĂNG QUẢN LÝ BIẾN THỂ (VARIANTS)
  // =========================================================================
  describe('3. Quản lý Biến thể món ăn (Variants CRUD)', () => {
    let secondVariantId: string;

    it('3.1 [Admin] Lấy danh sách biến thể của món ăn -> 200 OK', async () => {
      const res = await api.get(
        `/api/v1/admin/menu/dishes/${createdDishId}/variants`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('3.2 [Admin] Thêm biến thể mới cho món ăn (Phần 5 cuốn lớn) -> 201 Created', async () => {
      const newVariantDto = {
        name: 'Phần 5 cuốn lớn đặc biệt',
        price: 70000,
        is_active: true,
      };

      const res = await api
        .post(`/api/v1/admin/menu/dishes/${createdDishId}/variants`)
        .send(newVariantDto);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(newVariantDto.name);
      expect(Number(res.body.data.price)).toBe(70000);

      secondVariantId = res.body.data.id;
    });

    it('3.3 [Admin] Cập nhật thông tin biến thể -> 200 OK', async () => {
      const updateVariantDto = {
        name: 'Phần 5 cuốn lớn (Kèm nước chấm thêm)',
        price: 75000,
      };

      const res = await api
        .put(
          `/api/v1/admin/menu/dishes/${createdDishId}/variants/${secondVariantId}`,
        )
        .send(updateVariantDto);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateVariantDto.name);
      expect(Number(res.body.data.price)).toBe(75000);
    });

    it('3.4 [Admin] Xóa biến thể phụ an toàn (vẫn còn biến thể mặc định active) -> 200 OK', async () => {
      const res = await api.delete(
        `/api/v1/admin/menu/dishes/${createdDishId}/variants/${secondVariantId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.dish_variants.findUnique({
        where: { id: BigInt(secondVariantId) },
      });
      expect(check).toBeNull();
    });
  });

  // =========================================================================
  // 4. CHỨC NĂNG QUẢN LÝ NHÓM TÙY CHỌN & LỰA CHỌN (OPTIONS)
  // =========================================================================
  describe('4. Nhóm Tùy chọn & Lựa chọn (Option Groups & Values CRUD)', () => {
    it('4.1 [Admin] Tạo nhóm tùy chọn mới cho món ăn (Nước chấm đặc biệt) -> 201 Created', async () => {
      const newGroupDto = {
        name: 'Chọn nước chấm ăn kèm',
        min_select: 1,
        max_select: 1,
        is_active: true,
      };

      const res = await api
        .post(`/api/v1/admin/menu/dishes/${createdDishId}/option-groups`)
        .send(newGroupDto);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(newGroupDto.name);
      expect(res.body.data.min_select).toBe(1);
      expect(res.body.data.max_select).toBe(1);

      createdGroupId = res.body.data.id;
    });

    it('4.2 [Admin] Cập nhật nhóm tùy chọn (Cho phép chọn tối đa 2 loại) -> 200 OK', async () => {
      const res = await api
        .put(
          `/api/v1/admin/menu/dishes/${createdDishId}/option-groups/${createdGroupId}`,
        )
        .send({ max_select: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.max_select).toBe(2);
    });

    it('4.3 [Admin] Thêm lựa chọn vào nhóm tùy chọn (Tương đậu phộng xay nhuyễn) -> 201 Created', async () => {
      const newValueDto = {
        name: 'Tương đậu phộng đặc chế',
        extra_price: 0,
        is_active: true,
      };

      const res = await api
        .post(
          `/api/v1/admin/menu/dishes/${createdDishId}/option-groups/${createdGroupId}/values`,
        )
        .send(newValueDto);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(newValueDto.name);
      expect(Number(res.body.data.extra_price)).toBe(0);

      createdValueId = res.body.data.id;
    });

    it('4.4 [Admin] Thêm lựa chọn có phụ thu (Nước mắm chua ngọt đặc biệt +5.000đ) -> 201 Created', async () => {
      const res = await api
        .post(
          `/api/v1/admin/menu/dishes/${createdDishId}/option-groups/${createdGroupId}/values`,
        )
        .send({
          name: 'Nước mắm chua ngọt tỏi ớt',
          extra_price: 5000,
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.data.extra_price)).toBe(5000);
    });

    it('4.5 [Admin] Cập nhật thông tin lựa chọn -> 200 OK', async () => {
      const res = await api
        .put(
          `/api/v1/admin/menu/dishes/${createdDishId}/option-groups/${createdGroupId}/values/${createdValueId}`,
        )
        .send({
          name: 'Tương đen đậu phộng béo ngậy',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Tương đen đậu phộng béo ngậy');
    });

    it('4.6 [Admin] Lấy toàn bộ nhóm tùy chọn kèm danh sách lựa chọn của món -> 200 OK', async () => {
      const res = await api.get(
        `/api/v1/admin/menu/dishes/${createdDishId}/option-groups`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const group = res.body.data.find((g: any) => g.id === createdGroupId);
      expect(group).toBeDefined();
      expect(group.option_values.length).toBe(2);
    });
  });

  // =========================================================================
  // 5. CHỨC NĂNG GÁN TAGS & NGUYÊN LIỆU CHO MÓN
  // =========================================================================
  describe('5. Gán Tags & Thành phần Nguyên liệu (Tags & Ingredients)', () => {
    it('5.1 [Admin] Gán danh sách tags cho món ăn -> 200 OK', async () => {
      if (sampleTagIds.length === 0) return;

      const res = await api
        .put(`/api/v1/admin/menu/dishes/${createdDishId}/tags`)
        .send({ tag_ids: sampleTagIds });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(sampleTagIds.length);
    });

    it('5.2 [Admin] Gán danh sách nguyên liệu và ghi chú dị ứng cho món ăn -> 200 OK', async () => {
      if (sampleIngredientIds.length === 0) return;

      const ingredientsDto = {
        ingredients: [
          {
            ingredient_id: sampleIngredientIds[0],
            note: 'Tôm tươi lột vỏ luộc chín tới',
          },
        ],
      };

      const res = await api
        .put(`/api/v1/admin/menu/dishes/${createdDishId}/ingredients`)
        .send(ingredientsDto);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].note).toBe('Tôm tươi lột vỏ luộc chín tới');
    });
  });

  // =========================================================================
  // 6. CHỨC NĂNG QUẢN LÝ HÌNH ẢNH & UPLOAD CLOUDINARY
  // =========================================================================
  describe('6. Hình ảnh Món ăn & Tích hợp Cloudinary', () => {
    it('6.1 [Admin] Thêm hình ảnh theo URL (Ảnh bìa COVER) -> 201 Created', async () => {
      const newImageDto = {
        asset_path:
          'https://res.cloudinary.com/vi-viet/image/upload/v1/dishes/goi-cuon-cover.webp',
        kind: 'COVER',
        alt_text: 'Đĩa gỏi cuốn tôm thịt bày trí hoa chuối',
        sort_order: 1,
      };

      const res = await api
        .post(`/api/v1/admin/menu/dishes/${createdDishId}/images`)
        .send(newImageDto);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kind).toBe('COVER');
      expect(res.body.data.asset_path).toBe(newImageDto.asset_path);

      createdImageId = res.body.data.id;
    });

    it('6.2 [Admin] Lấy danh sách ảnh của món ăn -> 200 OK', async () => {
      const res = await api.get(
        `/api/v1/admin/menu/dishes/${createdDishId}/images`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('6.3 [Admin] Upload trực tiếp file ảnh buffer lên Cloudinary vào món ăn -> 201 Created', async () => {
      // 1x1 Transparent PNG buffer
      const samplePng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      );

      const res = await api
        .post(`/api/v1/admin/menu/dishes/${createdDishId}/images/upload`)
        .field('kind', 'GALLERY')
        .field('alt_text', 'Ảnh góc chụp cận cảnh gỏi cuốn')
        .field('sort_order', 2)
        .attach('file', samplePng, {
          filename: 'goi-cuon-test.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.asset_path).toContain('res.cloudinary.com');
      expect(res.body.data.kind).toBe('GALLERY');

      // Xóa ảnh test vừa upload để dọn dẹp Cloudinary
      const uploadedId = res.body.data.id;
      const delRes = await api.delete(
        `/api/v1/admin/menu/dishes/${createdDishId}/images/${uploadedId}`,
      );
      expect(delRes.status).toBe(200);
    });

    it('6.4 [Admin] Xóa ảnh món ăn theo ID -> 200 OK', async () => {
      const res = await api.delete(
        `/api/v1/admin/menu/dishes/${createdDishId}/images/${createdImageId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.dish_images.findUnique({
        where: { id: BigInt(createdImageId) },
      });
      expect(check).toBeNull();
    });
  });

  // =========================================================================
  // 7. CHỨC NĂNG KHÁCH HÀNG: XEM THỰC ĐƠN, LỌC & TÌM KIẾM
  // =========================================================================
  describe('7. Khách hàng: Khám phá Thực đơn & Tìm kiếm (Public Catalog & Filters)', () => {
    it('7.1 [Public] Lấy danh sách món ăn phân trang (kèm starting_price và cover_image) -> 200 OK', async () => {
      const res = await api.get('/api/v1/menu/dishes?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);

      const firstDish = res.body.data.items[0];
      expect(firstDish).toHaveProperty('starting_price');
      expect(firstDish).toHaveProperty('availability');
      expect(firstDish).toHaveProperty('category');
    });

    it('7.2 [Public] Lọc món ăn theo từ khóa tìm kiếm (search text) -> 200 OK', async () => {
      const res = await api.get('/api/v1/menu/dishes?search=Phở');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].name).toContain('Phở');
    });

    it('7.3 [Public] Lọc món ăn theo khoảng giá (min_price & max_price) -> 200 OK', async () => {
      const res = await api.get(
        '/api/v1/menu/dishes?min_price=40000&max_price=80000',
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      res.body.data.items.forEach((dish: any) => {
        expect(dish.starting_price).toBeLessThanOrEqual(80000);
      });
    });

    it('7.4 [Public] Xem chi tiết đầy đủ của một món ăn theo slug -> 200 OK', async () => {
      const res = await api.get(`/api/v1/menu/dishes/${createdDishSlug}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe(createdDishSlug);
      expect(res.body.data.variants.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.option_groups.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.starting_price).toBe(45000);
    });

    it('7.5 [Public] Lấy danh sách toàn bộ Tags phục vụ bộ lọc UI -> 200 OK', async () => {
      const res = await api.get('/api/v1/menu/tags');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 8. CHỨC NĂNG XÓA MỀM & DỌN DẸP
  // =========================================================================
  describe('8. Xóa mềm Món ăn (Soft Delete)', () => {
    it('8.1 [Admin] Xóa mềm món ăn: Gán deleted_at, chuyển availability = HIDDEN và giải phóng slug -> 200 OK', async () => {
      const res = await api.delete(
        `/api/v1/admin/menu/dishes/${createdDishId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted_at).toBeDefined();
      expect(res.body.data.availability).toBe('HIDDEN');
      expect(res.body.data.slug).toContain('_del_');

      // Món đã xóa mềm không thể truy cập công khai
      const publicCheck = await api.get(
        `/api/v1/menu/dishes/${createdDishSlug}`,
      );
      expect(publicCheck.status).toBe(404);
    });
  });
});
