import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { createE2eApp } from './setup/create-e2e-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { JwtService } from '@nestjs/jwt';

describe('Auth & Users Module Negative, Edge Cases & Security Testing (Kiểm thử Mọi Trường hợp Xấu, Biên & Bảo mật)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const testEmailA = `neg_customer_a_${Date.now()}@viviet.test`;
  const testEmailB = `neg_customer_b_${Date.now()}@viviet.test`;
  const testAdminEmail = `neg_admin_${Date.now()}@viviet.test`;
  const testOperatorEmail = `neg_operator_${Date.now()}@viviet.test`;
  const testKitchenEmail = `neg_kitchen_${Date.now()}@viviet.test`;
  const testPassword = 'Password123!';

  let userAToken: string;
  let userARefreshToken: string;
  let userAId: string;

  let userBToken: string;
  let userBId: string;

  let adminToken: string;
  let adminId: string;

  let operatorToken: string;
  let kitchenToken: string;

  let userAAddressId: string;
  let userBAddressId: string;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // 1. Tạo User A
    const resA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmailA,
        password: testPassword,
        full_name: 'Người Dùng A',
        phone: '0911111111',
      });
    userAId = resA.body.data.user.id;
    userAToken = resA.body.data.access_token;
    userARefreshToken = resA.body.data.refresh_token;

    // 2. Tạo User B
    const resB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmailB,
        password: testPassword,
        full_name: 'Người Dùng B',
        phone: '0922222222',
      });
    userBId = resB.body.data.user.id;
    userBToken = resB.body.data.access_token;

    // 3. Tạo Admin trong DB
    const admin = await prisma.users.create({
      data: {
        email: testAdminEmail,
        password_hash: 'mock_admin_hash',
        full_name: 'Quản Trị Viên Cấp Cao',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    adminId = admin.id.toString();
    adminToken = await jwtService.signAsync(
      { sub: adminId, email: testAdminEmail, role: 'ADMIN', status: 'ACTIVE' },
      {
        secret: 'vi_viet_super_secret_jwt_access_token_key_2026',
        expiresIn: '1h',
      },
    );

    // 4. Tạo token giả lập cho OPERATOR và KITCHEN
    operatorToken = await jwtService.signAsync(
      {
        sub: '9998',
        email: testOperatorEmail,
        role: 'OPERATOR',
        status: 'ACTIVE',
      },
      {
        secret: 'vi_viet_super_secret_jwt_access_token_key_2026',
        expiresIn: '1h',
      },
    );
    kitchenToken = await jwtService.signAsync(
      {
        sub: '9999',
        email: testKitchenEmail,
        role: 'KITCHEN',
        status: 'ACTIVE',
      },
      {
        secret: 'vi_viet_super_secret_jwt_access_token_key_2026',
        expiresIn: '1h',
      },
    );

    // 5. Thêm 1 địa chỉ mẫu cho User A và User B
    const addrA = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        recipient_name: 'Nhận A',
        phone: '0911111111',
        address_line: 'Số 1 Phố A, Hà Nội',
      });
    userAAddressId = addrA.body.data.id;

    const addrB = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        recipient_name: 'Nhận B',
        phone: '0922222222',
        address_line: 'Số 2 Phố B, Hà Nội',
      });
    userBAddressId = addrB.body.data.id;
  });

  afterAll(async () => {
    const userIds = [userAId, userBId, adminId]
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
  // 1. ĐĂNG KÝ TÀI KHOẢN (REGISTER NEGATIVE CASES)
  // ==========================================
  describe('1. Đăng ký tài khoản (Register Edge Cases)', () => {
    it('1.1 Thiếu trường email -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          password: testPassword,
          full_name: 'Thiếu Email',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('1.2 Thiếu trường password -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'valid_email@viviet.test',
          full_name: 'Thiếu Password',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('1.3 Thiếu trường full_name -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'valid_email@viviet.test',
          password: testPassword,
        });
      expect(res.status).toBe(400);
    });

    it('1.4 Email không đúng định dạng chuẩn (không có @, thiếu domain) -> 400 Bad Request', async () => {
      const invalidEmails = [
        'invalid-email',
        'missing@domain',
        '@nodomain.com',
        'user@.com',
      ];
      for (const email of invalidEmails) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            email,
            password: testPassword,
            full_name: 'Email Lỗi',
          });
        expect(res.status).toBe(400);
      }
    });

    it('1.5 Mật khẩu 7 ký tự (biên dưới <8 ký tự) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `short_pw_${Date.now()}@viviet.test`,
          password: 'Pass12!', // 7 ký tự
          full_name: 'Mật khẩu ngắn',
        });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('8 ký tự');
    });

    it('1.6 Gửi trường không được phép (Whitelisting check: role, status) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `hack_role_${Date.now()}@viviet.test`,
          password: testPassword,
          full_name: 'Hacker Thử Role ADMIN',
          role: 'ADMIN',
          status: 'ACTIVE',
        });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('should not exist');
    });

    it('1.7 Email hoa thường bất đối xứng: Cố đăng ký trùng lặp với chữ HOA -> 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmailA.toUpperCase(), // VIẾT HOA TOÀN BỘ EMAIL CỦA USER A
          password: testPassword,
          full_name: 'Trùng Lặp Email Hoa',
        });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('đã được sử dụng');
    });

    it('1.8 Số điện thoại sai kiểu dữ liệu (gửi kiểu đối tượng thay vì chuỗi) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `phone_type_${Date.now()}@viviet.test`,
          password: testPassword,
          full_name: 'Sai Type Phone',
          phone: { object_not_string: true } as any, // gửi kiểu object thay vì string
        });
      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // 2. ĐĂNG NHẬP (LOGIN NEGATIVE CASES)
  // ==========================================
  describe('2. Đăng nhập (Login Edge Cases & Security)', () => {
    it('2.1 Thiếu email trong payload đăng nhập -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: testPassword });
      expect(res.status).toBe(400);
    });

    it('2.2 Thiếu password trong payload đăng nhập -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmailA });
      expect(res.status).toBe(400);
    });

    it('2.3 Email không tồn tại trong hệ thống -> 401 Unauthorized (thông báo an toàn)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'not_exist_user_9999@viviet.test',
          password: testPassword,
        });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('không chính xác');
    });

    it('2.4 Mật khẩu không chính xác -> 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmailA,
          password: 'IncorrectPassword123!',
        });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('không chính xác');
    });

    it('2.5 SQL Injection trong trường email khi đăng nhập -> 400 hoặc 401 an toàn, không sập DB', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: "admin' OR '1'='1",
          password: testPassword,
        });
      // Email validator reject ngay hoặc Argon2 không tìm thấy -> 400 hoặc 401
      expect([400, 401]).toContain(res.status);
    });

    it('2.6 Tài khoản ở trạng thái DEACTIVATED cố đăng nhập -> 403 Forbidden (BR-02)', async () => {
      // Tạo một user DEACTIVATED
      const deactEmail = `deact_${Date.now()}@viviet.test`;
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: deactEmail,
        password: testPassword,
        full_name: 'User Deactivated',
      });

      // Đổi sang DEACTIVATED
      await prisma.users.update({
        where: { email: deactEmail },
        data: { status: 'DEACTIVATED' },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: deactEmail,
          password: testPassword,
        });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('vô hiệu hóa');
    });
  });

  // ==========================================
  // 3. LÀM MỚI TOKEN (REFRESH TOKEN EDGE CASES)
  // ==========================================
  describe('3. Quản lý Phiên & Làm mới Token (Refresh Token Edge Cases)', () => {
    it('3.1 Thiếu refresh_token trong body -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({});
      expect(res.status).toBe(400);
    });

    it('3.2 Gửi refresh token giả mạo (không tồn tại trong CSDL) -> 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'fake_refresh_token_1234567890abcdef' });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('không hợp lệ');
    });

    it('3.3 Refresh token đã hết hạn trong CSDL (expires_at trong quá khứ) -> 401 Unauthorized', async () => {
      // Tạo một phiên đã hết hạn
      const expiredSessionToken = 'expired_raw_token_xyz_999';
      const crypto = await import('crypto');
      const hash = crypto
        .createHash('sha256')
        .update(expiredSessionToken)
        .digest('hex');

      await prisma.auth_sessions.create({
        data: {
          user_id: BigInt(userAId),
          refresh_token_hash: hash,
          expires_at: new Date(Date.now() - 1000 * 60 * 60), // Hết hạn 1 giờ trước
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: expiredSessionToken });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('hết hạn');
    });

    it('3.4 Đăng xuất với refresh token không hợp lệ -> Vẫn trả về 200 OK an toàn (Idempotent)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ refresh_token: 'random_non_existent_token' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================
  // 4. BẢO MẬT JWT, CHỮ KÝ SỐ & GUARDS
  // ==========================================
  describe('4. Bảo vệ Đường dẫn & Tính hợp lệ của Token (JWT Security)', () => {
    it('4.1 Header Authorization sai cấu trúc (thiếu chữ Bearer) -> 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', userAToken); // Không có tiền tố Bearer
      expect(res.status).toBe(401);
    });

    it('4.2 Header Authorization với chuỗi rác -> 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_garbage_jwt_token_string');
      expect(res.status).toBe(401);
    });

    it('4.3 JWT bị giả mạo chữ ký (sửa đổi payload thủ công) -> 401 Unauthorized', async () => {
      const parts = userAToken.split('.');
      // Đổi 1 ký tự trong signature
      const tamperedSignature =
        parts[2].substring(0, parts[2].length - 2) + 'xx';
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);
      expect(res.status).toBe(401);
    });

    it('4.4 JWT được ký bởi Secret Key khác -> 401 Unauthorized', async () => {
      const fakeSecretToken = await jwtService.signAsync(
        { sub: userAId, email: testEmailA, role: 'CUSTOMER', status: 'ACTIVE' },
        { secret: 'wrong_secret_key_1234567890', expiresIn: '15m' },
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${fakeSecretToken}`);
      expect(res.status).toBe(401);
    });

    it('4.5 JWT đã hết hạn (expired token) -> 401 Unauthorized', async () => {
      const expiredToken = await jwtService.signAsync(
        { sub: userAId, email: testEmailA, role: 'CUSTOMER', status: 'ACTIVE' },
        {
          secret: 'vi_viet_super_secret_jwt_access_token_key_2026',
          expiresIn: '0s', // Hết hạn ngay lập tức
        },
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // 5. CẬP NHẬT HỒ SƠ & ĐỔI MẬT KHẨU
  // ==========================================
  describe('5. Cập nhật Hồ sơ & Đổi Mật khẩu (Profile & Change Password Edge Cases)', () => {
    it('5.1 Cập nhật hồ sơ gửi trường bị cấm (role, email, id) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          role: 'ADMIN',
          email: 'new_hacked_email@viviet.test',
        });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('should not exist');
    });

    it('5.2 Đổi mật khẩu thiếu trường new_password -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ current_password: testPassword });
      expect(res.status).toBe(400);
    });

    it('5.3 Đổi mật khẩu với mật khẩu mới dưới 8 ký tự -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          current_password: testPassword,
          new_password: '123',
        });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('8 ký tự');
    });

    it('5.4 Đổi mật khẩu với current_password không đúng -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          current_password: 'WrongCurrentPassword!',
          new_password: 'NewValidPassword123!',
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('hiện tại không chính xác');
    });

    it('5.5 Đổi mật khẩu thành công -> Vô hiệu hóa mọi phiên refresh token cũ', async () => {
      const newPass = 'BrandNewPassword2026!';
      const res = await request(app.getHttpServer())
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          current_password: testPassword,
          new_password: newPass,
        });
      expect(res.status).toBe(200);

      // Thử dùng refresh token cũ -> Bị từ chối 401 vì phiên đã bị revoked
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: userARefreshToken });
      expect(refreshRes.status).toBe(401);

      // Đăng nhập lại bằng mật khẩu cũ -> 401
      const oldLoginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmailA, password: testPassword });
      expect(oldLoginRes.status).toBe(401);

      // Đăng nhập lại bằng mật khẩu mới -> 200
      const newLoginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmailA, password: newPass });
      expect(newLoginRes.status).toBe(200);

      userAToken = newLoginRes.body.data.access_token;
      userARefreshToken = newLoginRes.body.data.refresh_token;
    });
  });

  // ==========================================
  // 6. SỔ ĐỊA CHỈ & KIỂM SOÁT SỞ HỮU (BR-01 NEGATIVE)
  // ==========================================
  describe('6. Sổ địa chỉ & Quy tắc BR-01 (Data Isolation & Param Validation)', () => {
    it('6.1 Tạo địa chỉ thiếu recipient_name hoặc address_line -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ phone: '0911111111' });
      expect(res.status).toBe(400);
    });

    it('6.2 Tạo địa chỉ với vĩ độ hoặc kinh độ không phải kiểu số -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          recipient_name: 'Người Nhận',
          phone: '0911111111',
          address_line: 'Số 10 Đường Láng',
          latitude: 'not-a-number' as any,
        });
      expect(res.status).toBe(400);
    });

    it('6.3 Truy vấn địa chỉ với ID sai định dạng số nguyên (chuỗi chữ) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/addresses/invalid-id-abc')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('định dạng số nguyên');
    });

    it('6.4 Truy vấn địa chỉ với ID không tồn tại trong CSDL -> 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/addresses/999999999')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(404);
    });

    it('6.5 [BR-01] User A cố gắng truy cập địa chỉ của User B -> 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/addresses/${userBAddressId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(404);
    });

    it('6.6 [BR-01] User A cố gắng sửa địa chỉ của User B -> 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/addresses/${userBAddressId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ recipient_name: 'Hack Name' });
      expect(res.status).toBe(404);
    });

    it('6.7 [BR-01] User A cố gắng xóa địa chỉ của User B -> 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/addresses/${userBAddressId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(404);
    });

    it('6.8 Xóa địa chỉ đã bị xóa mềm trước đó -> 404 Not Found', async () => {
      // User A xóa địa chỉ của mình
      await request(app.getHttpServer())
        .delete(`/api/v1/addresses/${userAAddressId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      // Thử xóa lại lần 2 -> 404
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/addresses/${userAAddressId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 7. SỞ THÍCH ĂN UỐNG (PREFERENCES BOUNDARIES)
  // ==========================================
  describe('7. Sở thích ăn uống (Preferences Boundaries & Validation)', () => {
    it('7.1 Mức độ cay âm (< 0) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/users/preferences')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ spicy_level: -1 });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('tối thiểu là 0');
    });

    it('7.2 Mức độ cay vượt ngưỡng (> 3) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/users/preferences')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ spicy_level: 4 });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('tối đa là 3');
    });

    it('7.3 Ngân sách âm (< 0) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/users/preferences')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ budget_per_meal: -50000 });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('không được âm');
    });

    it('7.4 Gửi trường lạ không được khai báo trong DTO -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/users/preferences')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          spicy_level: 1,
          unwhitelisted_field: 'danger',
        });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('should not exist');
    });
  });

  // ==========================================
  // 8. PHÂN QUYỀN RBAC & AN TOÀN QUẢN TRỊ
  // ==========================================
  describe('8. Phân quyền RBAC & An toàn Quản trị (Admin Safety)', () => {
    it('8.1 OPERATOR gọi API Quản trị tài khoản (/api/v1/admin/users) -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).toBe(403);
    });

    it('8.2 KITCHEN gọi API Quản trị tài khoản (/api/v1/admin/users) -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${kitchenToken}`);
      expect(res.status).toBe(403);
    });

    it('8.3 Admin cố gắng tự khóa tài khoản của chính mình -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'LOCKED' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('không thể tự khóa tài khoản');
    });

    it('8.4 Admin cố gắng tự hạ quyền của chính mình -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'CUSTOMER' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('không thể tự hạ quyền quản trị');
    });

    it('8.5 Admin cập nhật trạng thái người dùng không tồn tại -> 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/admin/users/999999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'LOCKED' });
      expect(res.status).toBe(404);
    });

    it('8.6 Phân trang danh sách người dùng với page âm (< 1) -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users?page=-1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });
  });
});
