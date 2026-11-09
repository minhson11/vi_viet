# VỊ VIỆT — HỆ THỐNG QUẢN LÝ VÀ KINH DOANH ĐỒ ĂN TRỰC TUYẾN TÍCH HỢP AI

> **Đề tài:** Xây dựng hệ thống quản lý và kinh doanh đồ ăn trực tuyến tích hợp trí tuệ nhân tạo trong tư vấn và cá nhân hóa trải nghiệm người dùng  
> **Kiến trúc:** Monorepo npm workspaces (`apps/web` + `apps/api`)

---

## 1. Cấu trúc thư mục Monorepo

```
vi-viet/
├── apps/
│   ├── web/                          # Frontend Next.js (App Router, Tailwind CSS, GSAP)
│   └── api/                          # Backend NestJS (Prisma ORM, TiDB Cloud / MySQL)
├── docs/                             # Bộ 7 tài liệu thiết kế hệ thống
├── infra/                            # Cấu hình triển khai Docker Compose & Nginx
├── assets-source/                    # Thư viện ảnh gốc, vector và asset manifest
├── .gitignore
├── package.json                      # npm workspaces
└── README.md
```

---

## 2. Hướng dẫn khởi chạy Local

### 2.1. Cài đặt Dependencies
```powershell
npm install
```

### 2.2. Khởi chạy Backend NestJS (`apps/api`)
```powershell
npm run dev:api
```
Backend API chạy tại: `http://localhost:5000` (Swagger tài liệu API tại: `http://localhost:5000/docs`).

### 2.3. Khởi chạy Frontend Next.js (`apps/web`)
```powershell
npm run dev:web
```
Giao diện web chạy tại: `http://localhost:3000`.

---

## 3. Kiểm thử tự động
```powershell
# Chạy toàn bộ 265 test cases của Backend
npm run test:api
```

