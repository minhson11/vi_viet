# KẾ HOẠCH TRIỂN KHAI CHI TIẾT — MODULE MENU (THỰC ĐƠN & DANH MỤC)

> **Dự án:** Hệ thống quản lý và kinh doanh đồ ăn trực tuyến tích hợp AI — Vị Việt  
> **Cơ sở đối chiếu:**  
> - [vi-viet-phan-tich-nghiep-vu.md](file:///d:/DoAn/SonLon/Design/vi-viet-phan-tich-nghiep-vu.md) (FR-06, FR-07, FR-08, FR-22; BR-03, BR-04, BR-06, BR-27, BR-33; AC-03, AC-15, AC-21)  
> - [vi-viet-database-design.md](file:///d:/DoAn/SonLon/Design/vi-viet-database-design.md) (10 bảng liên quan đến Thực đơn & Thành phần)  
> **Trạng thái:** ĐÃ HOÀN THÀNH 100% (22/22 tests passed)

---

## 1. Mục tiêu và Tiêu chuẩn Nghiệp vụ

Module Menu cung cấp dữ liệu sản phẩm cho toàn bộ hệ thống: từ website khách hàng (khám phá, xem chi tiết, chọn món vào giỏ), tư vấn AI (truy vấn món theo ngân sách/khẩu vị), đến phân cảnh kể chuyện Scrollytelling và màn hình nhân viên/bếp.

### Các quy tắc cốt lõi đã tuân thủ:
- **[BR-03]** Món ăn chuyển trạng thái mở bán (`AVAILABLE`) bắt buộc phải có ít nhất **1 biến thể hoạt động** (`is_active = true`).
- **[BR-04]** Tùy chọn (`option_values`) phải thuộc cùng món (`dish_id`) với nhóm tùy chọn (`option_groups`). Kiểm tra giới hạn chọn `min_select <= số lượng chọn <= max_select`.
- **[BR-06]** `starting_price` hiển thị trên danh sách thực đơn được tính động từ `MIN(price)` của các biến thể đang active.
- **[BR-27]** Dữ liệu thành phần có phân loại `ingredient_data_status` (`UNKNOWN`, `PARTIAL`, `VERIFIED`), không tùy tiện khẳng định món an toàn dị ứng nếu chưa xác minh.
- **[BR-33]** Không xóa cứng (`Hard Delete`) bất kỳ món, biến thể hay tùy chọn nào đã phát sinh dữ liệu liên kết. Sử dụng xóa mềm (`deleted_at`) hoặc vô hiệu hóa (`is_active = false`, `availability = 'HIDDEN'`).
- **[BR-22]** Nhân viên tiếp nhận (`OPERATOR`) và Bếp (`KITCHEN`) được cấp quyền thao tác nhanh nút báo hết món (`SOLD_OUT` / `AVAILABLE`).

---

## 2. Checklists Công việc Triển khai Chi tiết

### Giai đoạn 1: Cấu trúc Thư mục & DTOs (Validation)
- [x] **1.1.** Khởi tạo cấu trúc module tại `src/modules/menu/` (`controllers/`, `services/`, `dto/`).
- [x] **1.2.** Tạo DTO Danh mục (`create-category.dto.ts`, `update-category.dto.ts`):
  - Kiểm tra `name` (1-100 ký tự), `slug` (chuẩn hóa), `sort_order` (integer), `is_active` (boolean).
- [x] **1.3.** Tạo DTO Lọc & Tìm kiếm món ăn (`query-dishes.dto.ts`):
  - Hỗ trợ lọc theo `category_slug`, `tag_code`, `search` (tên món), `min_price`, `max_price`, `spicy_level` (0-3), phân trang `page`, `limit`.
- [x] **1.4.** Tạo DTO Món ăn (`create-dish.dto.ts`, `update-dish.dto.ts`):
  - Validate `category_id`, `name`, `slug`, `description`, `story`, `spicy_level` (0..3), `ingredient_data_status` (`UNKNOWN`, `PARTIAL`, `VERIFIED`).
  - Cho phép đính kèm biến thể tiêu chuẩn ban đầu (`default_variant: { name, price }`) để bảo đảm BR-03 ngay khi tạo.
- [x] **1.5.** Tạo DTO Trạng thái mở bán nhanh (`update-dish-availability.dto.ts`):
  - Nhận enum `availability`: `AVAILABLE`, `SOLD_OUT`, `HIDDEN`.
- [x] **1.6.** Tạo DTO Biến thể (`create-variant.dto.ts`, `update-variant.dto.ts`):
  - Validate `name`, `price >= 0`, `is_active`.
- [x] **1.7.** Tạo DTO Nhóm tùy chọn & Lựa chọn:
  - `create-option-group.dto.ts`: `name`, `min_select >= 0`, `max_select >= 1`, ràng buộc `max_select >= min_select`.
  - `create-option-value.dto.ts`: `name`, `extra_price >= 0`, `is_active`.
- [x] **1.8.** Tạo DTO Hình ảnh (`create-dish-image.dto.ts`):
  - Validate `asset_path`, `kind` (`COVER`, `GALLERY`, `CUTOUT`), `alt_text`, `sort_order`.
- [x] **1.9.** Tạo DTO Gán Tags & Thành phần (`assign-tags.dto.ts`, `assign-ingredients.dto.ts`).

---

### Giai đoạn 2: Tầng Dịch vụ Nghiệp vụ (Business Logic Services)
- [x] **2.1. CategoriesService (`src/modules/menu/services/categories.service.ts`):**
  - [x] `findAllPublic()`: Lấy danh mục đang active kèm số lượng món mở bán (`_count: { dishes }`).
  - [x] `findAllAdmin()`: Lấy tất cả danh mục kèm trạng thái cho Admin.
  - [x] `create()`: Tạo danh mục mới, tự sinh/kiểm tra trùng slug.
  - [x] `update()`: Cập nhật tên, slug, thứ tự, trạng thái.
  - [x] `remove()`: Kiểm tra nếu danh mục còn món đang hoạt động thì không cho xóa.
- [x] **2.2. DishesService (`src/modules/menu/services/dishes.service.ts`):**
  - [x] `findPublicDishes(query)`: Truy vấn danh sách món công khai (`availability = 'AVAILABLE'`, `deleted_at IS NULL`), kết hợp tính `starting_price` từ `MIN(variants.price)` và lấy ảnh đại diện `COVER`.
  - [x] `findPublicDishBySlug(slug)`: Lấy chi tiết món ăn hoàn chỉnh theo slug (eager load: active variants, active option groups + active option values, ingredients, tags, images).
  - [x] `create(data)`: Tạo món mới sử dụng **Database Transaction** (tạo dish + biến thể tiêu chuẩn mặc định đầu tiên để thỏa mãn BR-03).
  - [x] `update(id, data)`: Cập nhật thông tin cơ bản của món ăn.
  - [x] `updateAvailability(id, availability, userRole)`: Cập nhật trạng thái bán nhanh. Kiểm tra: nếu chuyển sang `AVAILABLE` mà món không có biến thể active nào -> Từ chối (ném lỗi `BadRequestException`).
  - [x] `softDelete(id)`: Xóa mềm món ăn bằng cách gán `deleted_at = new Date()` và `availability = 'HIDDEN'`.
- [x] **2.3. VariantsService (`src/modules/menu/services/variants.service.ts`):**
  - [x] `create(dishId, data)`: Thêm biến thể cho món ăn.
  - [x] `update(dishId, variantId, data)`: Sửa tên, giá, toggle active.
  - [x] `toggleActive(dishId, variantId)`: Bật/tắt biến thể. Kiểm tra: nếu đây là biến thể active duy nhất của món đang `AVAILABLE`, cảnh báo hoặc tự động chuyển món sang `SOLD_OUT`.
- [x] **2.4. OptionsService (`src/modules/menu/services/options.service.ts`):**
  - [x] `createGroup(dishId, data)`: Tạo nhóm tùy chọn cho món (`min_select`, `max_select`).
  - [x] `updateGroup(dishId, groupId, data)`: Cập nhật nhóm tùy chọn.
  - [x] `createValue(dishId, groupId, data)`: Thêm lựa chọn và phụ thu `extra_price`. Đảm bảo `dish_id` được gán chính xác (thỏa mãn FK ghép).
  - [x] `updateValue(dishId, groupId, valueId, data)`: Sửa tên, phụ thu, toggle active.
- [x] **2.5. IngredientsAndTagsService (`src/modules/menu/services/ingredients-tags.service.ts`):**
  - [x] Quản lý CRUD danh mục nguyên liệu (`ingredients`), đánh dấu `is_allergen`.
  - [x] Quản lý CRUD danh mục tags (`tags`).
  - [x] Gán/gỡ danh sách tags cho món ăn (`dish_tags`).
  - [x] Gán/gỡ danh sách nguyên liệu và ghi chú công thức/nguy cơ lẫn chéo cho món ăn (`dish_ingredients`).
- [x] **2.6. DishImagesService (`src/modules/menu/services/dish-images.service.ts`):**
  - [x] Thêm ảnh cho món (`COVER`, `GALLERY`, `CUTOUT`).
  - [x] Đặt lại thứ tự ảnh, xóa ảnh.

---

### Giai đoạn 3: Tầng Điều khiển (Controllers) & Đăng ký Module
- [x] **3.1. MenuPublicController (`src/modules/menu/controllers/menu-public.controller.ts`):**
  - [x] `GET /api/v1/menu/categories`: Công khai (`@Public()`).
  - [x] `GET /api/v1/menu/dishes`: Công khai (`@Public()`).
  - [x] `GET /api/v1/menu/dishes/:slug`: Công khai (`@Public()`).
  - [x] `GET /api/v1/menu/tags`: Công khai (`@Public()`).
- [x] **3.2. MenuAdminController (`src/modules/menu/controllers/menu-admin.controller.ts`):**
  - [x] Quản lý danh mục: `POST`, `PUT`, `DELETE` `/api/v1/admin/menu/categories`.
  - [x] Quản lý món: `POST`, `PUT`, `DELETE` `/api/v1/admin/menu/dishes`.
  - [x] Nút báo hết nhanh: `PATCH /api/v1/admin/menu/dishes/:id/availability` (phân quyền cho `ADMIN`, `OPERATOR`, `KITCHEN`).
  - [x] Quản lý biến thể: `POST`, `PUT`, `DELETE` `/api/v1/admin/menu/dishes/:id/variants`.
  - [x] Quản lý nhóm tùy chọn & giá trị: `/api/v1/admin/menu/dishes/:id/option-groups`.
  - [x] Quản lý ảnh món: `/api/v1/admin/menu/dishes/:id/images`.
  - [x] Gán tags & nguyên liệu: `/api/v1/admin/menu/dishes/:id/tags`, `/api/v1/admin/menu/dishes/:id/ingredients`.
- [x] **3.3. MenuModule (`src/modules/menu/menu.module.ts`):**
  - [x] Khai báo controllers, providers, exports.
  - [x] Đăng ký `MenuModule` vào `AppModule` ([src/app.module.ts](file:///d:/DoAn/SonLon/backend/src/app.module.ts)).

---

### Giai đoạn 4: Dữ liệu mẫu Thực đơn Vị Việt (Seed Data Script)
- [x] **4.1.** Xây dựng kịch bản seed thực đơn thực tế tại `scripts/seed-menu.mjs`:
  - 4 Danh mục: Món nước truyền thống, Cơm & Món chính, Bánh mì & Ăn nhẹ, Thức uống & Tráng miệng.
  - Món ăn tiêu biểu: Phở bò tái lăn gia truyền, Bún chả Hà Nội nướng than hoa, Cơm tấm sườn bì chả Sài Gòn, Bánh mì thịt xá xíu giòn tan, Trà sen vàng long nhãn.
  - Cấu hình đầy đủ biến thể (Thường/Lớn/Đặc biệt), tùy chọn Topping, Thành phần dị ứng và Tags.
- [x] **4.2.** Đã nạp thành công dữ liệu mẫu vào TiDB Cloud qua lệnh `npm run db:seed:menu`.
- [x] **4.3.** Thêm script `"db:seed:menu": "node scripts/seed-menu.mjs"` vào `package.json`.

---

### Giai đoạn 5: Kiểm thử, Nghiệm thu & Rà soát Kỹ thuật
- [x] **5.1. Kiểm thử biên dịch & Type safety:** `npm run build` hoàn thành không lỗi.
- [x] **5.2. Kiểm thử API Công khai qua HTTP:** Đạt 100% (22/22 assertions PASS).
- [x] **5.3. Kiểm thử Nghiệp vụ Bảo vệ (Edge Cases):**
  - Kiểm tra BR-03: Chặn tắt biến thể active duy nhất của món đang mở bán thành công.
  - Kiểm tra BR-33: Xóa mềm gán `deleted_at` và chuyển `availability = 'HIDDEN'` không làm mất dữ liệu.
  - Serialization BigInt: Tất cả id trả về string sạch sẽ.

---

## 3. Tiêu chí Hoàn thành (Definition of Done)

✅ **100% checklist hoàn tất.**  
✅ **Đã kiểm thử tích hợp thực tế với TiDB Cloud, toàn bộ 22 tiêu chí pass.**
