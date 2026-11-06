import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { createE2eApp } from './setup/create-e2e-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { JwtService } from '@nestjs/jwt';

describe('Auth & Users Module E2E Testing (Kiểm thử Toàn diện Auth, Users, RBAC, BR-01, BR-02)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const testEmail1 = `test_customer_${Date.now()}@viviet.test`;
  const testEmail2 = `test_customer_other_${Date.now()}@viviet.test`;
  const testAdminEmail = `test_admin_${Date.now()}@viviet.test`;
  const testPassword = 'Password123!';

  let customer1Token: string;
  let customer1RefreshToken: string;
  let customer1Id: string;

  let customer2Token: string;
  let customer2Id: string;

  let adminToken: string;
  let adminId: string;

  let createdAddressId: string;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu test
    const userIds = [customer1Id, customer2Id, adminId]
      .filter(Boolean)
      .map((id) => BigInt(id));

    if (userIds.length > 0) {
      await prisma.addresses.deleteMany({
        where: { user_id: { in: userIds } },
      });
      await prisma.user_preferences.deleteMany({
        where: { user_id: { in: userIds } },
      });
      await prisma.auth_sessions.deleteMany({
        where: { user_id: { in: userIds } },
      });
      await prisma.users.deleteMany({ where: { id: { in: userIds } } });
    }

    await app.close();
  });

  // ==========================================
  // 1. ĐĂNG KÝ TÀI KHOẢN (REGISTER)
  // ==========================================
  describe('1. Đăng ký tài khoản (Register)', () => {
    it('1.1 Đăng ký thành công tài khoản khách hàng mới -> 201 Created', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail1,
          password: testPassword,
          full_name: 'Nguyễn Văn Test',
          phone: '0901234567',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail1.toLowerCase());
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.user.status).toBe('ACTIVE');
      expect(res.body.data.user.password_hash).toBeUndefined(); // Không lộ hash

      customer1Id = res.body.data.user.id;
      customer1Token = res.body.data.access_token;
      customer1RefreshToken = res.body.data.refresh_token;
    });

    it('1.2 Đăng ký trùng email đã tồn tại -> 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail1,
          password: testPassword,
          full_name: 'Trùng Lặp',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('1.3 Đăng ký với mật khẩu ngắn dưới 8 ký tự -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `short_pw_${Date.now()}@viviet.test`,
          password: '123',
          full_name: 'Short Password',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 2. ĐĂNG NHẬP (LOGIN)
  // ==========================================
  describe('2. Đăng nhập (Login)', () => {
    it('2.1 Đăng nhập sai mật khẩu -> 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail1,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('2.2 Đăng nhập đúng email & mật khẩu -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail1,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
      expect(res.body.data.user.id).toBe(customer1Id);

      customer1Token = res.body.data.access_token;
      customer1RefreshToken = res.body.data.refresh_token;
    });
  });

  // ==========================================
  // 3. LÀM MỚI TOKEN (REFRESH TOKEN ROTATION)
  // ==========================================
  describe('3. Xoay vòng Refresh Token (Token Rotation)', () => {
    let newRefreshToken: string;

    it('3.1 Dùng refresh token hợp lệ để cấp cặp token mới -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: customer1RefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();

      customer1Token = res.body.data.access_token;
      newRefreshToken = res.body.data.refresh_token;
    });

    it('3.2 Dùng lại refresh token cũ đã bị xoay vòng (thu hồi) -> 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: customer1RefreshToken });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('3.3 Đăng xuất (Logout) thu hồi refresh token -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ refresh_token: newRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Cố dùng lại token sau khi logout -> 401
      const retryRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: newRefreshToken });

      expect(retryRes.status).toBe(401);
    });
  });

  // ==========================================
  // 4. BẢO MẬT TRUY CẬP (JWTAUTHGUARD & ME)
  // ==========================================
  describe('4. Bảo vệ đường dẫn (JwtAuthGuard)', () => {
    it('4.1 Truy cập /api/v1/auth/me không có Bearer token -> 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('4.2 Truy cập /api/v1/auth/me với Bearer token hợp lệ -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(customer1Id);
      expect(res.body.data.email).toBe(testEmail1.toLowerCase());
    });
  });

  // ==========================================
  // 5. SỔ ĐỊA CHỈ & KIỂM SOÁT SỞ HỮU (BR-01)
  // ==========================================
  describe('5. Sổ địa chỉ & Quy tắc BR-01 (Data Isolation)', () => {
    beforeAll(async () => {
      // Đăng ký thêm user 2 để kiểm thử chống truy cập chéo
      const res2 = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail2,
          password: testPassword,
          full_name: 'Nguyễn Văn B (User 2)',
        });

      customer2Id = res2.body.data.user.id;
      customer2Token = res2.body.data.access_token;
    });

    it('5.1 Thêm địa chỉ mới cho User 1 -> 201 Created (Tự động is_default = true)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          recipient_name: 'Nguyễn Văn Test',
          phone: '0901234567',
          address_line: 'Số 123 Đường Kim Mã, Quận Ba Đình, Hà Nội',
          delivery_note: 'Giao giờ hành chính',
          latitude: 21.0315,
          longitude: 105.8234,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.is_default).toBe(true);

      createdAddressId = res.body.data.id;
    });

    it('5.2 Lấy danh sách địa chỉ của User 1 -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(createdAddressId);
    });

    it('5.3 [BR-01] User 2 cố gắng truy cập địa chỉ của User 1 -> 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/addresses/${createdAddressId}`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('5.4 [BR-01] User 2 cố gắng sửa hoặc xóa địa chỉ của User 1 -> 404 Not Found', async () => {
      const patchRes = await request(app.getHttpServer())
        .patch(`/api/v1/addresses/${createdAddressId}`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ recipient_name: 'Hacker' });

      expect(patchRes.status).toBe(404);

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/addresses/${createdAddressId}`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(deleteRes.status).toBe(404);
    });

    it('5.5 User 1 cập nhật địa chỉ của chính mình -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/addresses/${createdAddressId}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ delivery_note: 'Giao trước 5h chiều' });

      expect(res.status).toBe(200);
      expect(res.body.data.delivery_note).toBe('Giao trước 5h chiều');
    });

    it('5.6 User 1 xóa mềm địa chỉ của mình -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/addresses/${createdAddressId}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);

      // Kiểm tra lại danh sách -> rỗng
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(listRes.body.data.length).toBe(0);
    });
  });

  // ==========================================
  // 6. SỞ THÍCH ĂN UỐNG (PREFERENCES)
  // ==========================================
  describe('6. Sở thích ăn uống (Preferences)', () => {
    it('6.1 Cập nhật sở thích (độ cay, ngân sách, ghi chú dị ứng) -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/users/preferences')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          spicy_level: 2,
          budget_per_meal: 75000,
          personalization_enabled: true,
          dietary_note: 'Không hành hoa, ít tiêu',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferences.spicy_level).toBe(2);
      expect(res.body.data.preferences.budget_per_meal).toBe(75000);
      expect(res.body.data.preferences.personalization_enabled).toBe(true);
      expect(res.body.data.preferences.dietary_note).toBe(
        'Không hành hoa, ít tiêu',
      );
      expect(res.body.data.preferences.consented_at).toBeDefined();
    });

    it('6.2 Xem lại sở thích đã lưu -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/preferences')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.spicy_level).toBe(2);
      expect(res.body.data.dietary_note).toBe('Không hành hoa, ít tiêu');
    });
  });

  // ==========================================
  // 7. PHÂN QUYỀN RBAC & QUY TẮC BR-02
  // ==========================================
  describe('7. Phân quyền RBAC & Quy tắc BR-02 (Tài khoản khóa/vô hiệu)', () => {
    beforeAll(async () => {
      // Tạo một tài khoản Admin thực sự trong DB
      const admin = await prisma.users.create({
        data: {
          email: testAdminEmail,
          password_hash: 'mock_hash',
          full_name: 'Quản trị viên Hệ thống',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
      adminId = admin.id.toString();

      adminToken = await jwtService.signAsync(
        {
          sub: adminId,
          email: testAdminEmail,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
        {
          secret: 'vi_viet_super_secret_jwt_access_token_key_2026',
          expiresIn: '1h',
        },
      );
    });

    it('7.1 Customer cố tình truy cập API Quản trị (/api/v1/admin/users) -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('7.2 Admin truy cập API Quản trị (/api/v1/admin/users) -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('7.3 [BR-02] Admin khóa tài khoản Customer 1 -> Cập nhật thành status = LOCKED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${customer1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'LOCKED' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.status).toBe('LOCKED');
    });

    it('7.4 [BR-02] Customer 1 (sau khi bị khóa) cố gắng đăng nhập -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail1,
          password: testPassword,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('khóa');
    });

    it('7.5 [BR-02] Customer 1 (sau khi bị khóa) cố gắng gọi API có token -> 403 Forbidden', async () => {
      // Cấp một token có status: LOCKED
      const lockedToken = await jwtService.signAsync(
        {
          sub: customer1Id,
          email: testEmail1,
          role: 'CUSTOMER',
          status: 'LOCKED',
        },
        {
          secret: 'vi_viet_super_secret_jwt_access_token_key_2026',
          expiresIn: '15m',
        },
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${lockedToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('khóa');
    });
  });
});
