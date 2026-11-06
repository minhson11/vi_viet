import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@viviet.vn';
  const password = 'Admin@123456';
  const fullName = 'Quản Trị Viên Vị Việt';
  const phone = '0901234567';

  console.log(`🔐 Đang khởi tạo tài khoản Quản trị viên (ADMIN): ${email}...`);

  const passwordHash = await argon2.hash(password);

  const admin = await prisma.users.upsert({
    where: { email },
    update: {
      full_name: fullName,
      phone,
      password_hash: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      email_verified_at: new Date(),
    },
    create: {
      email,
      password_hash: passwordHash,
      full_name: fullName,
      phone,
      role: 'ADMIN',
      status: 'ACTIVE',
      email_verified_at: new Date(),
    },
  });

  console.log(`==========================================`);
  console.log(`✅ KHỞI TẠO TÀI KHOẢN ADMIN THÀNH CÔNG!`);
  console.log(`==========================================`);
  console.log(`ID:        ${admin.id.toString()}`);
  console.log(`Họ tên:    ${admin.full_name}`);
  console.log(`Email:     ${admin.email}`);
  console.log(`Mật khẩu:  ${password}`);
  console.log(`Vai trò:   ${admin.role}`);
  console.log(`Trạng thái: ${admin.status}`);
  console.log(`==========================================`);
}

main()
  .catch((err) => {
    console.error('❌ Lỗi khởi tạo admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

