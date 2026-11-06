# Sơn Lớn Backend

NestJS API sử dụng Prisma và TiDB/MySQL.

## Chạy local

```bash
cp .env.example .env
npm install
npx prisma generate
npm run start:dev
```

API mặc định: `http://localhost:7000/api/v1`  
Swagger: `http://localhost:7000/api/v1/docs`

## Database

```bash
npm run db:migrate:status
npm run db:migrate:deploy
```

Schema chỉ được quản lý bằng Prisma Migration trong `prisma/migrations`.

## Kiểm tra

```bash
npm run lint
npm run build
npm run test:unit
npm run test:e2e
```

E2E chỉ chạy khi database test đã qua kiểm tra an toàn. Dữ liệu do test tạo ra được xóa trong teardown.

## Hết hạn thanh toán

Job chạy khi `PAYMENT_EXPIRATION_JOB_ENABLED=true`. Có thể chạy thủ công sau khi build:

```bash
npm run orders:expire
```
