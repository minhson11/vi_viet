# Kế hoạch bổ sung quản lý nguyên liệu món ăn

## 1. Phạm vi

Hoàn thiện luồng nguyên liệu từ trang quản trị đến trang chi tiết món ăn trong một buổi tối.

- Tận dụng các bảng `ingredients` và `dish_ingredients` hiện có.
- Không tạo migration mới.
- Không phát triển AI hoặc cá nhân hóa.
- Không tạo repository, port hoặc use case chỉ có một implementation.
- Không thay đổi API và nghiệp vụ không liên quan đến nguyên liệu.

## 2. Hiện trạng

### Đã có

- [x] Bảng danh mục `ingredients`.
- [x] Bảng liên kết `dish_ingredients`, có trường ghi chú `note`.
- [x] Ràng buộc duy nhất `dish_id + ingredient_id`.
- [x] Trạng thái dữ liệu nguyên liệu: `UNKNOWN`, `PARTIAL`, `VERIFIED`.
- [x] API công khai lấy danh sách nguyên liệu: `GET /api/v1/menu/ingredients`.
- [x] API thay thế danh sách nguyên liệu của món: `PUT /api/v1/admin/menu/dishes/:dishId/ingredients`.
- [x] API chi tiết món trả về nguyên liệu.
- [x] Seed hiện có danh mục nguyên liệu và dữ liệu mẫu cho Phở bò.

### Khoảng trống đã xử lý

- [x] Đã có API quản trị để tạo và cập nhật danh mục nguyên liệu.
- [x] API gán nguyên liệu quản lý đồng thời `ingredient_data_status`.
- [x] Frontend có type và mapper đầy đủ cho nguyên liệu.
- [x] Form tạo/sửa món có trình chọn nguyên liệu.
- [x] Có thể nhập ghi chú riêng cho từng nguyên liệu.
- [x] Trang chi tiết món hiển thị nguyên liệu từ API.
- [x] Có unit test cho gán, loại trùng, nguyên liệu không tồn tại và xóa hết nguyên liệu.

## 3. Contract dữ liệu mục tiêu

### Danh mục nguyên liệu

```ts
interface Ingredient {
  id: string;
  name: string;
  code: string;
  is_allergen: boolean;
}
```

### Nguyên liệu được gán cho món

```ts
interface DishIngredient extends Ingredient {
  note: string | null;
}
```

### Payload đồng bộ nguyên liệu

```json
{
  "ingredient_data_status": "VERIFIED",
  "ingredients": [
    {
      "ingredient_id": "12",
      "note": "Thịt bò tươi thái mỏng"
    }
  ]
}
```

Quy ước:

- Mảng `ingredients: []` có nghĩa là xóa toàn bộ liên kết nguyên liệu của món.
- `UNKNOWN` chỉ dùng khi chưa có dữ liệu xác nhận.
- `PARTIAL` dùng khi danh sách chưa đầy đủ.
- `VERIFIED` dùng khi danh sách đã được quản trị viên kiểm tra.
- Thay danh sách liên kết và cập nhật trạng thái phải nằm trong cùng transaction.

## 4. Kế hoạch thực hiện trong tối nay

### Giai đoạn 1 — Hoàn thiện backend contract (45 phút)

- [x] Tạo `CreateIngredientDto` gồm `name`, `code?`, `is_allergen`.
- [x] Tạo `UpdateIngredientDto` cho phép sửa tên và trạng thái dị ứng.
- [x] Thêm `POST /api/v1/admin/menu/ingredients`.
- [x] Thêm `PATCH /api/v1/admin/menu/ingredients/:ingredientId`.
- [x] Không thêm API xóa nguyên liệu trong đợt này vì nguyên liệu đang được tham chiếu bởi món ăn và hạn chế ăn uống của người dùng.
- [x] Bổ sung `ingredient_data_status` vào `AssignIngredientsDto`.
- [x] Kiểm tra ID nguyên liệu là số nguyên dương.
- [x] Giới hạn `note` tối đa 500 ký tự.
- [x] Kiểm tra toàn bộ ID nguyên liệu tồn tại trước khi ghi.
- [x] Đồng bộ liên kết và trạng thái trong một Prisma transaction.
- [x] Giữ một nguồn xử lý duy nhất tại `IngredientsAndTagsService`.

Tiêu chí hoàn thành:

- API trả lỗi nghiệp vụ rõ ràng thay vì để lộ lỗi khóa ngoại Prisma.
- Có thể gán, thay thế và xóa hết nguyên liệu của một món.
- Không tạo abstraction mới không cần thiết.

### Giai đoạn 2 — Chuẩn hóa frontend data layer (35 phút)

- [x] Bổ sung `Ingredient`, `DishIngredient` và `IngredientDataStatus` vào `admin-catalog/types.ts`.
- [x] Bổ sung `ingredients` và `ingredient_data_status` vào `Dish`.
- [x] Mở rộng `mapBackendDish()` để đọc cả dữ liệu chi tiết đã chuẩn hóa và quan hệ Prisma.
- [x] Thêm `getIngredients()` vào `adminCatalogApi`.
- [x] Thêm `createIngredient()` và `updateIngredient()`.
- [x] Thêm `assignDishIngredients()`.
- [x] Khi tạo hoặc cập nhật món, luôn gửi danh sách nguyên liệu kể cả khi mảng rỗng để thao tác xóa có hiệu lực.
- [x] Không gọi API nguyên liệu từ component; component chỉ nhận dữ liệu và phát sự kiện thay đổi.

Tiêu chí hoàn thành:

- Không còn sử dụng `any` cho dữ liệu nguyên liệu ở luồng mới.
- Mapper là nơi duy nhất chuyển đổi response backend sang model frontend.

### Giai đoạn 3 — Giao diện quản trị món ăn (60 phút)

- [x] Tạo `dish-ingredients-editor.tsx` theo phong cách hiện tại của `dish-tags-editor.tsx`.
- [x] Có ô tìm kiếm theo tên hoặc mã nguyên liệu.
- [x] Có thể chọn và bỏ chọn nhiều nguyên liệu.
- [x] Hiển thị badge cảnh báo với nguyên liệu gây dị ứng.
- [x] Có ô nhập `note` cho từng nguyên liệu đã chọn.
- [x] Có bộ chọn trạng thái `UNKNOWN`, `PARTIAL`, `VERIFIED` với nhãn tiếng Việt dễ hiểu.
- [x] Có nút tạo nhanh nguyên liệu mới ngay trong editor.
- [x] Thêm tab “Nguyên liệu” vào trang tạo món.
- [x] Thêm tab “Nguyên liệu” vào trang sửa món.
- [x] Hiển thị số nguyên liệu đã chọn trên badge của tab.
- [x] Khi mở trang sửa, khôi phục đúng danh sách, ghi chú và trạng thái đã lưu.
- [x] Khi lưu thất bại, giữ nguyên dữ liệu trên form để người dùng sửa và gửi lại.

Tiêu chí hoàn thành:

- Quản trị viên không phải nhập ID thủ công.
- Có thể thêm nguyên liệu mới, gán vào món và mở lại trang sửa mà không mất dữ liệu.
- Có thể bỏ chọn toàn bộ và lưu thành công.

### Giai đoạn 4 — Hiển thị trên storefront (35 phút)

- [x] Bổ sung nguyên liệu vào model `CatalogDish` hoặc dùng thống nhất model `Dish` hiện có.
- [x] Thay danh sách nguyên liệu hard-code trong tab “Nguyên liệu & Thưởng thức”.
- [x] Hiển thị tên và ghi chú của từng nguyên liệu.
- [x] Hiển thị cảnh báo rõ ràng cho nguyên liệu có `is_allergen = true`.
- [x] Hiển thị thông báo phù hợp khi trạng thái là `UNKNOWN` hoặc danh sách rỗng.
- [x] Giữ phần hướng dẫn thưởng thức tĩnh nếu vẫn cần cho nội dung thương hiệu.
- [x] Không hiển thị danh sách như đã xác nhận khi trạng thái mới là `PARTIAL`.

Tiêu chí hoàn thành:

- Trang chi tiết món chỉ hiển thị nguyên liệu từ API.
- Không còn danh sách nguyên liệu mẫu dùng chung cho mọi món.

### Giai đoạn 5 — Kiểm thử và dọn dữ liệu (45 phút)

#### Backend

- [ ] Tạo nguyên liệu thành công.
- [ ] Trùng `code` trả về `409 Conflict`.
- [x] ID nguyên liệu không tồn tại trả lỗi `400` hoặc `404` rõ ràng.
- [x] Danh sách trùng ID được xử lý nhất quán.
- [x] Gán nguyên liệu lưu đúng `note`.
- [ ] Gán lần hai thay thế hoàn toàn danh sách cũ.
- [x] Gửi mảng rỗng xóa toàn bộ liên kết.
- [x] Trạng thái nguyên liệu được cập nhật cùng transaction.
- [ ] Chi tiết món trả đúng nguyên liệu và trạng thái.

#### Frontend

- [x] Type check thành công.
- [x] Lint thành công.
- [ ] Build thành công.
- [ ] Form tạo món lưu được nguyên liệu.
- [ ] Form sửa món tải và cập nhật được nguyên liệu.
- [ ] Storefront hiển thị dữ liệu thật và cảnh báo dị ứng.

#### Kiểm thử database thật

- [ ] Dùng mã nguyên liệu có tiền tố `e2e-ingredient-<timestamp>`.
- [ ] Tạo một món test có tiền tố `E2E Ingredient`.
- [ ] Chạy đủ luồng tạo, sửa, thay thế, xóa hết và đọc chi tiết.
- [ ] Xóa `dish_ingredients` của món test.
- [ ] Xóa món, biến thể và dữ liệu phụ thuộc do test tạo.
- [ ] Xóa nguyên liệu test nếu không còn được tham chiếu.
- [ ] Truy vấn xác nhận không còn bản ghi mang tiền tố E2E.

## 5. Thứ tự file dự kiến thay đổi

### Backend

- `backend/src/modules/menu/dto/assign-ingredients.dto.ts`
- `backend/src/modules/menu/dto/create-ingredient.dto.ts`
- `backend/src/modules/menu/dto/update-ingredient.dto.ts`
- `backend/src/modules/menu/services/ingredients-tags.service.ts`
- `backend/src/modules/menu/controllers/menu-admin.controller.ts`
- Các unit/E2E test liên quan đến menu.

### Frontend

- `frontend/src/features/admin-catalog/types.ts`
- `frontend/src/features/admin-catalog/api/admin-catalog.api.ts`
- `frontend/src/features/admin-catalog/components/dish-ingredients-editor.tsx`
- `frontend/src/app/(workspace)/admin/menu/new/page.tsx`
- `frontend/src/app/(workspace)/admin/menu/[id]/page.tsx`
- `frontend/src/features/catalog/types.ts`
- `frontend/src/features/catalog/api/catalog.api.ts`
- `frontend/src/app/(storefront)/mon/[slug]/page.tsx`

## 6. Nguyên tắc kiến trúc bắt buộc

- Controller chỉ nhận DTO và gọi service.
- `IngredientsAndTagsService` chịu trách nhiệm danh mục và liên kết nguyên liệu; không tạo thêm lớp chuyển tiếp.
- Prisma chỉ xuất hiện trong service backend hiện có.
- Validation nằm tại DTO và quy tắc nhất quán dữ liệu nằm trong service.
- Mọi thay đổi nhiều bảng phải dùng transaction.
- Frontend API client chịu trách nhiệm chuyển đổi contract; component không biết cấu trúc response Prisma.
- Component editor chỉ quản lý hiển thị và tương tác.
- Không tạo generic repository, factory, strategy hoặc global store cho chức năng này.

## 7. Definition of Done

- [ ] Quản trị viên tạo được nguyên liệu mới.
- [ ] Quản trị viên gán, ghi chú, thay thế và xóa hết nguyên liệu của món.
- [ ] Trạng thái dữ liệu nguyên liệu được lưu nhất quán.
- [ ] Trang sửa món tải lại đúng dữ liệu đã lưu.
- [ ] Storefront hiển thị nguyên liệu thật và cảnh báo dị ứng.
- [ ] Không có nội dung nguyên liệu hard-code thay cho dữ liệu món.
- [x] Backend build, lint và unit test đạt.
- [!] Frontend type check và lint đạt; production build bị chặn do sandbox không phân giải được `fonts.googleapis.com`.
- [!] E2E trên database thật bị chặn vì sandbox không kết nối được TiDB Cloud tại cổng 4000.
- [x] Không còn dữ liệu test mang tiền tố E2E sau khi kiểm thử; kết nối thất bại trước khi tạo dữ liệu.

## 8. Kết quả thực hiện ngày 06/11/2026

- Backend build và lint thành công.
- Unit test: 42/42 đạt, gồm kiểm tra loại trùng, nguyên liệu không tồn tại, ghi chú, xóa hết liên kết và trạng thái transaction.
- Frontend TypeScript kiểm tra thành công.
- Frontend ESLint không có lỗi; còn 19 cảnh báo cũ ngoài phạm vi nguyên liệu.
- Production build đã đi qua bước khởi tạo nhưng dừng khi `next/font` không tải được Google Fonts do DNS của sandbox.
- E2E menu đã được khởi chạy với cấu hình DB thật nhưng Prisma không thể kết nối TiDB Cloud; không có bản ghi test nào được tạo.
