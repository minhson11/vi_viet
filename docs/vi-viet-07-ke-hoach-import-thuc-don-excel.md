# Kế hoạch triển khai import thực đơn bằng Excel một sheet

## 1. Mục tiêu

Xây dựng chức năng để quản trị viên tải lên một file `.xlsx` chỉ có một sheet `THUC_DON`, xem trước kết quả kiểm tra và xác nhận import món ăn vào hệ thống.

Yêu cầu bắt buộc:

- Chỉ tài khoản `ADMIN` được sử dụng.
- Không thay đổi schema database.
- Không phát triển phần AI.
- Không lưu file tạm hoặc tạo bảng staging.
- Preview tuyệt đối không ghi database.
- Import thực tế chạy trong một transaction; một dòng lỗi thì không ghi bất kỳ dữ liệu nào.
- Tái sử dụng Prisma, Multer, phân quyền, `slugify` và cấu trúc module menu hiện tại.
- Chỉ bổ sung một thư viện đọc/ghi `.xlsx` ở backend.

## 2. Phạm vi phiên bản đầu

### Có thực hiện

- [x] Tải file Excel mẫu.
- [x] Upload và kiểm tra file trước khi import.
- [x] Tạo mới món bằng `CREATE`.
- [x] Cập nhật món bằng `UPDATE`.
- [x] Import nhiều biến thể cho một món.
- [x] Import nguyên liệu và ghi chú nguyên liệu.
- [x] Import thẻ món ăn.
- [x] Tạo hoặc cập nhật danh mục từ Excel.
- [x] Tạo hoặc cập nhật danh mục nguyên liệu và trạng thái dị ứng.
- [x] Tạo hoặc cập nhật thẻ.
- [x] Import ảnh món bằng URL/đường dẫn.
- [x] Import nhóm tùy chọn và giá trị tùy chọn.
- [x] Hiển thị lỗi chính xác theo dòng và cột.
- [x] Hiển thị số món tạo mới, cập nhật và không hợp lệ.
- [x] Xác nhận trước khi ghi database.
- [!] Kiểm thử trên database phát triển bị chặn do không kết nối được TiDB Cloud; suite dừng trước khi tạo dữ liệu.

### Chưa thực hiện

- Ảnh nhị phân nhúng trực tiếp trong Excel; ảnh được nhập bằng URL/đường dẫn.
- Import chạy nền hoặc hàng đợi xử lý file lớn.
- Lưu lịch sử file import.
- Hỗ trợ `.xls`, CSV hoặc nhiều sheet.

## 3. Contract file Excel

### Quy định chung

- Tên sheet bắt buộc: `THUC_DON`.
- Dòng đầu tiên là tiêu đề cột.
- Mỗi dòng có một `loai_dong` xác định loại dữ liệu.
- Các dòng liên kết với món thông qua `dish_slug`.
- Mỗi món bắt buộc có đúng một dòng `DISH`.
- File tối đa 5 MB.
- Tối đa 2.000 dòng và 500 món trong một lần import.
- Không chấp nhận ô chứa công thức.

### Các loại dòng

| `loai_dong` | Dữ liệu |
|---|---|
| `CATEGORY` | Danh mục, slug, tên, thứ tự và trạng thái |
| `DISH` | Thông tin món, danh mục, mô tả, mức cay và trạng thái |
| `VARIANT` | Tên biến thể, giá và trạng thái hoạt động |
| `INGREDIENT` | Mã, tên nguyên liệu, dị ứng và ghi chú trong món |
| `TAG` | Mã và tên thẻ |
| `IMAGE` | URL/đường dẫn, loại ảnh, alt và thứ tự |
| `OPTION_GROUP` | Nhóm tùy chọn, số lượng chọn tối thiểu/tối đa |
| `OPTION_VALUE` | Giá trị tùy chọn, giá cộng thêm và trạng thái |

### Danh sách cột đầy đủ

`loai_dong`, `hanh_dong`, `dish_slug`, `ten_mon`, `danh_muc_slug`, `danh_muc_ten`, `danh_muc_hoat_dong`, `mo_ta`, `cau_chuyen`, `muc_cay`, `trang_thai`, `thu_tu`, `trang_thai_nguyen_lieu`, `ten_bien_the`, `gia`, `bien_the_hoat_dong`, `ma_nguyen_lieu`, `ten_nguyen_lieu`, `gay_di_ung`, `ghi_chu_nguyen_lieu`, `ma_the`, `ten_the`, `url_anh`, `loai_anh`, `alt_anh`, `thu_tu_anh`, `ten_nhom_tuy_chon`, `chon_toi_thieu`, `chon_toi_da`, `nhom_hoat_dong`, `ten_gia_tri`, `gia_them`, `gia_tri_hoat_dong`.

`hanh_dong` nhận:

- `CATEGORY`, `DISH`: `CREATE` hoặc `UPDATE`.
- `INGREDIENT`, `TAG`: `CREATE`, `UPDATE` hoặc `USE`.
- Các dòng con khác được thêm hoặc cập nhật theo tên/đường dẫn.

## 4. Quy tắc nghiệp vụ import

### CREATE

- Danh mục, món, nguyên liệu hoặc thẻ dùng `CREATE` phải chưa tồn tại.
- Món tạo mới phải có ít nhất một biến thể.
- Món `AVAILABLE` phải có ít nhất một biến thể hoạt động.
- Có thể tạo toàn bộ danh mục, món, nguyên liệu, thẻ, ảnh và tùy chọn trong một transaction.

### UPDATE

- Slug chưa tồn tại: báo lỗi.
- Cập nhật thông tin cơ bản của món.
- Biến thể được thêm hoặc cập nhật theo `dish_slug + tên biến thể`.
- Không xóa biến thể cũ không xuất hiện trong Excel.
- Có dòng `INGREDIENT`: thay thế liên kết nguyên liệu của món; không có thì giữ nguyên.
- Có dòng `TAG`: thay thế liên kết thẻ của món; không có thì giữ nguyên.
- Ảnh được thêm/cập nhật theo đường dẫn; không xóa ảnh cũ không xuất hiện trong Excel.
- Nhóm và giá trị tùy chọn được thêm/cập nhật theo tên; không xóa dữ liệu cũ.
- Không được tắt toàn bộ biến thể hoạt động của món đang `AVAILABLE`.

### Liên kết dữ liệu

- Dòng con tham chiếu đến `dish_slug` chưa có dòng `DISH` sẽ bị từ chối.
- `OPTION_VALUE` bắt buộc có dòng `OPTION_GROUP` tương ứng trong file.
- Một món chỉ có tối đa một ảnh `COVER` trong file.
- Khai báo cùng nguyên liệu hoặc thẻ ở nhiều món phải thống nhất tên, trạng thái và hành động.

## 5. API

### Tải file mẫu

```http
GET /api/v1/admin/menu/import/template
```

- Trả file `.xlsx` có sẵn tiêu đề, chú thích và một vài dòng mẫu.

### Preview

```http
POST /api/v1/admin/menu/import/preview
Content-Type: multipart/form-data
```

- Nhận trường `file`.
- Parse, chuẩn hóa và kiểm tra toàn bộ workbook.
- Truy vấn danh mục, món, nguyên liệu và thẻ theo lô.
- Không gọi create/update và không mở transaction ghi.

### Xác nhận import

```http
POST /api/v1/admin/menu/import
Content-Type: multipart/form-data
```

- Frontend gửi lại chính file đã preview.
- Backend bắt buộc parse và validate lại để tránh dữ liệu thay đổi giữa preview và import.
- Ghi toàn bộ dữ liệu trong một Prisma transaction.

### Response chuẩn

```json
{
  "valid": false,
  "summary": {
    "rows": 20,
    "dishes": 12,
    "create": 8,
    "update": 3,
    "invalid": 1
  },
  "errors": [
    {
      "sheet": "THUC_DON",
      "row": 6,
      "column": "danh_muc_slug",
      "code": "CATEGORY_NOT_FOUND",
      "message": "Không tìm thấy danh mục 'do-uong-lanh'"
    }
  ]
}
```

## 6. Thiết kế kiến trúc

### Backend

Giữ đúng cấu trúc module menu hiện tại:

- `MenuAdminController`: thêm ba endpoint import.
- `MenuImportService`: điều phối tạo template, preview và transaction import.
- `menu-import.parser.ts`: hàm thuần đọc workbook, chuẩn hóa ô và gom dòng theo slug.
- `menu-import.types.ts`: kiểu dữ liệu nội bộ và cấu trúc lỗi.
- Đăng ký `MenuImportService` trong `MenuModule`.

Không tạo repository, interface, factory hoặc use case chỉ có một implementation.

`MenuImportService` được phép dùng Prisma trực tiếp giống các service hiện tại. Import không gọi HTTP nội bộ và không tái sử dụng chuỗi API phía frontend vì cần bảo đảm transaction nguyên khối.

### Frontend

- Thêm nút **Import Excel** tại trang quản lý thực đơn.
- Thêm modal import gồm ba trạng thái: chọn file, xem preview, xem kết quả.
- Giữ `File` trong state để gửi lại khi người dùng xác nhận.
- Thêm phương thức API: tải mẫu, preview, import.
- Sau import thành công, đóng modal và tải lại danh sách món.

## 7. Validation và mã lỗi

- `INVALID_FILE_TYPE`: không phải `.xlsx`.
- `INVALID_FILE`: file `.xlsx` bị hỏng hoặc không đọc được.
- `FILE_TOO_LARGE`: vượt 5 MB.
- `SHEET_NOT_FOUND`: không có sheet `THUC_DON`.
- `INVALID_SHEET_COUNT`: file có nhiều hơn một sheet.
- `INVALID_HEADERS`: thiếu hoặc sai cột bắt buộc.
- `ROW_LIMIT_EXCEEDED`: vượt giới hạn dòng.
- `DISH_LIMIT_EXCEEDED`: vượt giới hạn món.
- `FORMULA_NOT_ALLOWED`: ô chứa công thức.
- `REQUIRED_VALUE_MISSING`: thiếu dữ liệu bắt buộc.
- `INVALID_ENUM`: giá trị trạng thái không hợp lệ.
- `INVALID_BOOLEAN`: giá trị boolean không phải `TRUE` hoặc `FALSE`.
- `INVALID_NUMBER`: giá, mức cay hoặc thứ tự không hợp lệ.
- `VALUE_TOO_LONG`: dữ liệu vượt độ dài database cho phép.
- `INVALID_INGREDIENT_LIST`: danh sách nguyên liệu sai cú pháp hoặc bị lặp.
- `INVALID_TAG_LIST`: danh sách thẻ bị lặp.
- `DUPLICATE_VARIANT`: trùng biến thể trong cùng món.
- `INCONSISTENT_DISH_DATA`: dữ liệu món không thống nhất giữa các dòng.
- `DISH_ALREADY_EXISTS`: `CREATE` nhưng slug đã tồn tại.
- `DISH_NOT_FOUND`: `UPDATE` nhưng slug chưa tồn tại.
- `CATEGORY_NOT_FOUND`: không tìm thấy danh mục.
- `INGREDIENT_NOT_FOUND`: không tìm thấy nguyên liệu.
- `TAG_NOT_FOUND`: không tìm thấy thẻ.
- `ACTIVE_VARIANT_REQUIRED`: món mở bán không có biến thể hoạt động.

## 8. Trình tự thực hiện trong một buổi tối

### Giai đoạn 1 — Contract và parser

- [x] Cài `exceljs` cho backend.
- [x] Khai báo type dữ liệu import và lỗi.
- [x] Viết parser cho sheet `THUC_DON`.
- [x] Chuẩn hóa chuỗi, boolean, số và danh sách phân cách `|`.
- [x] Gom các dòng theo slug.
- [x] Kiểm tra header, giới hạn file, giới hạn dòng và ô công thức.
- [x] Viết unit test parser.

### Giai đoạn 2 — Preview và import backend

- [x] Viết `MenuImportService`.
- [x] Truy vấn dữ liệu tham chiếu theo lô, không query từng dòng.
- [x] Xây dựng kết quả preview và lỗi theo dòng/cột.
- [x] Viết transaction cho `CREATE` và `UPDATE`.
- [x] Thêm endpoint tải template.
- [x] Thêm endpoint preview.
- [x] Thêm endpoint xác nhận import.
- [x] Giới hạn file 5 MB và chỉ nhận `.xlsx`.
- [x] Viết unit test validation/import.

### Giai đoạn 3 — Giao diện quản trị

- [x] Thêm nút **Import Excel**.
- [x] Tạo modal chọn file và tải file mẫu.
- [x] Hiển thị bảng preview.
- [x] Hiển thị lỗi theo dòng/cột.
- [x] Khóa nút xác nhận khi còn lỗi.
- [x] Gửi lại file khi xác nhận.
- [x] Hiển thị kết quả và tải lại danh sách món.

### Giai đoạn 4 — Kiểm thử và hoàn thiện

- [x] Backend build và lint đạt.
- [x] Backend unit test đạt: 46/46.
- [x] Frontend type-check và lint đạt; còn 19 cảnh báo cũ ngoài phạm vi.
- [x] Preview chỉ đọc dữ liệu và không có lệnh ghi database.
- [x] File lỗi bị chặn trước transaction.
- [!] Đã viết E2E import món, biến thể, nguyên liệu và thẻ nhưng chưa chạy được do TiDB không kết nối.
- [!] Đã viết E2E UPDATE giữ biến thể cũ nhưng chưa chạy được do TiDB không kết nối.
- [!] Transaction rollback cần xác nhận lại khi kết nối được DB.
- [!] Đã viết test phân quyền nhưng suite dừng ở bước khởi tạo DB.
- [!] Đã chạy suite với slug `excel-import-test-`, nhưng TiDB Cloud không truy cập được tại cổng 4000.
- [x] Suite dừng trước `beforeAll`, không có dữ liệu test nào được tạo.

## 9. Definition of Done

- [x] Đã triển khai tải file mẫu một sheet.
- [x] Đã triển khai preview trước khi ghi dữ liệu.
- [x] Lỗi hiển thị đúng dòng, cột và nguyên nhân.
- [x] Không thể xác nhận khi còn lỗi.
- [x] Toàn bộ lệnh ghi nằm trong một transaction.
- [x] CREATE và UPDATE đã có unit test/parser test và E2E tương ứng.
- [x] Dữ liệu nguyên liệu và thẻ được xử lý trong cùng transaction.
- [x] Danh mục, ảnh URL, nhóm tùy chọn và giá trị tùy chọn được xử lý trong cùng transaction.
- [x] Không có dữ liệu test rác trong database.
- [x] Không thay đổi các luồng tạo/sửa món thủ công hiện tại.

## 10. Thứ tự ưu tiên khi thiếu thời gian

1. Parser, validation và preview.
2. Transaction import món và biến thể.
3. Nguyên liệu và thẻ.
4. Giao diện modal.
5. File mẫu có định dạng đẹp.

Không cắt giảm validation, transaction, phân quyền hoặc kiểm thử rollback để chạy kịp thời gian.

## 11. Kết quả thực hiện ngày 06/11/2026

- Backend build và lint thành công.
- Backend unit test: 14 file, 46 test đều đạt.
- Frontend TypeScript thành công; ESLint không có lỗi mới.
- Đã cài `exceljs@4.4.0` và cập nhật lockfile.
- File mẫu một sheet đã bao phủ 8 loại dòng: CATEGORY, DISH, VARIANT, INGREDIENT, TAG, IMAGE, OPTION_GROUP, OPTION_VALUE.
- Đã tạo E2E riêng cho preview, CREATE, UPDATE, phân quyền và dữ liệu lỗi.
- E2E DB thật chưa thể chạy vì môi trường không kết nối được `gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000`.
- Kết nối thất bại trước bước chuẩn bị dữ liệu nên không cần dọn bản ghi test.
