# Kế hoạch khắc phục và chuẩn hóa Backend Vi Việt

> Tài liệu làm việc chính thức để theo dõi quá trình nâng cấp backend từ MVP lên trạng thái ổn định, kiểm thử được và sẵn sàng triển khai.

## 1. Thông tin tài liệu

| Thuộc tính | Giá trị |
|---|---|
| Dự án | Vi Việt / SonLon |
| Phạm vi | Backend NestJS + Prisma + TiDB + VNPay + Cloudinary |
| Kiến trúc đích | Modular Monolith kết hợp Clean Architecture theo từng module |
| Trạng thái | Chưa triển khai |
| Ngày lập kế hoạch | 05/11/2026 |
| Phần bị loại khỏi phạm vi | AI, LLM, recommendation engine, cá nhân hóa bằng AI |

### Quy ước trạng thái

- `[ ]`: Chưa thực hiện.
- `[~]`: Đang thực hiện.
- `[x]`: Đã hoàn thành và đạt tiêu chí nghiệm thu.
- `[!]`: Bị chặn, cần ghi rõ nguyên nhân.

Không đánh dấu `[x]` chỉ vì đã viết xong mã. Một công việc chỉ được hoàn thành khi build, lint và các kiểm thử liên quan đều đạt.

---

## 2. Mục tiêu

1. Ngăn ngừa mất dữ liệu hoặc chạy kiểm thử nhầm trên CSDL thật.
2. Loại bỏ race condition trong coupon, đơn hàng, thanh toán, refresh token và hoàn tiền.
3. Hoàn thiện vòng đời đơn chờ thanh toán và giải phóng coupon khi hết hạn.
4. Chuẩn hóa migration, cấu hình, bảo mật và khả năng vận hành.
5. Tái cấu trúc mã theo SOLID nhưng không tạo abstraction dư thừa.
6. Xây dựng bộ kiểm thử đủ để tiếp tục phát triển an toàn.
7. Chuẩn hóa tài liệu và quy trình triển khai.

## 3. Ngoài phạm vi

Các nội dung sau không thực hiện trong kế hoạch này:

- AI conversation và tích hợp LLM.
- Recommendation engine.
- Cá nhân hóa món ăn bằng AI.
- Thu thập hành vi chỉ nhằm phục vụ AI.
- Huấn luyện mô hình.
- Microservice.
- Event Sourcing.
- CQRS đầy đủ.
- Message broker khi chưa có nhu cầu xử lý phân tán thực tế.

Các bảng AI hiện có trong Prisma schema được giữ nguyên nhưng không phát triển service/controller trong đợt này.

---

## 4. Hiện trạng đã xác minh

| Hạng mục | Hiện trạng |
|---|---|
| Build backend | Thành công |
| Lint | Thành công, còn cảnh báo import/biến không dùng |
| Unit test | 13/13 test đạt |
| Unit test coverage | Thấp; báo cáo hiện tại chỉ bao phủ các file được import |
| E2E | Có nhiều test nhưng chưa an toàn vì dùng cấu hình DB chung |
| Migration | Chưa có lịch sử Prisma migration; đang dùng một file SQL lớn |
| Payment timeout | Có `payment_deadline` nhưng chưa có worker xử lý hết hạn |
| AI | Chỉ có schema dữ liệu, chưa triển khai; không nằm trong kế hoạch này |

Các rủi ro P0 hiện tại:

- E2E có thể ghi/xóa dữ liệu trên database đang dùng.
- Ứng dụng vẫn có thể khởi động khi Prisma kết nối thất bại.
- Coupon có thể vượt hạn mức khi nhiều checkout đồng thời.
- Đơn có thể bị hủy đồng thời với xác nhận/IPN.
- Một đơn có thể tạo nhiều payment attempt đang hiệu lực.
- Một refresh token có thể bị sử dụng đồng thời.
- Tổng refund có thể vượt khoản thu trong tình huống cạnh tranh đồng thời.
- Đơn `PENDING_PAYMENT` và coupon `RESERVED` có thể tồn tại vô thời hạn.

---

## 5. Nguyên tắc kiến trúc bắt buộc

### 5.1. Kiến trúc tổng thể

Giữ backend dưới dạng **Modular Monolith**. Mỗi module nghiệp vụ tự quản lý domain, use case, adapter và presentation của mình.

```text
src/modules/orders/
├── domain/
│   ├── policies/
│   │   └── order-transition.policy.ts
│   ├── errors/
│   └── order.types.ts
├── application/
│   ├── use-cases/
│   │   ├── checkout.use-case.ts
│   │   ├── cancel-order.use-case.ts
│   │   └── update-order-status.use-case.ts
│   └── ports/
│       └── order-persistence.port.ts
├── infrastructure/
│   ├── persistence/
│   │   └── prisma-order-persistence.adapter.ts
│   └── jobs/
│       └── expire-orders.job.ts
├── presentation/
│   ├── controllers/
│   └── dto/
└── orders.module.ts
```

Luồng phụ thuộc hợp lệ:

```text
Presentation/Job -> Application Use Case -> Domain
Infrastructure Adapter -> Application Port
```

Luồng phụ thuộc không hợp lệ:

```text
Domain -> Prisma/NestJS/Express
Controller -> Prisma
Controller -> business rule
Application -> concrete VNPay/Cloudinary implementation
```

### 5.2. Áp dụng SOLID

#### Single Responsibility Principle

- Controller chỉ xử lý HTTP.
- Mỗi use case chỉ thực hiện một hành động nghiệp vụ.
- Domain policy chỉ chứa một nhóm quy tắc có cùng lý do thay đổi.
- Mapper chỉ chuyển đổi dữ liệu.
- Adapter chỉ thực hiện giao tiếp với hệ thống ngoài hoặc CSDL.

#### Open/Closed Principle

- Cổng thanh toán được mở rộng qua `PaymentGateway`, không thêm `if/else` provider ở nhiều nơi.
- Luồng chuyển trạng thái được kiểm soát bởi policy, không rải điều kiện trong controller/service.
- Không biến mọi CRUD đơn giản thành strategy/factory nếu chưa có biến thể thực tế.

#### Liskov Substitution Principle

- Adapter phải giữ đúng contract của port.
- Lỗi, dữ liệu trả về và hành vi transaction phải nhất quán giữa fake adapter trong test và Prisma adapter.

#### Interface Segregation Principle

- Port nhỏ theo khả năng nghiệp vụ, ví dụ `CheckoutPersistencePort` hoặc `PaymentGateway`.
- Không tạo một `Repository<T>` khổng lồ dùng chung cho mọi module.

#### Dependency Inversion Principle

- Application phụ thuộc vào port/token, không phụ thuộc trực tiếp Prisma/VNPay/Cloudinary.
- Infrastructure triển khai các port và được nối qua NestJS module.

### 5.3. Quy tắc chống over-engineering

- Không tạo `BaseController`, `BaseService`, `BaseRepository`.
- Không tạo interface chỉ để bọc một hàm CRUD không có nhu cầu thay thế hoặc kiểm thử riêng.
- Không tách microservice.
- Không áp dụng event bus nội bộ nếu gọi use case trực tiếp đã đủ.
- Không tạo domain entity phức tạp cho dữ liệu chỉ dùng để hiển thị.
- Query chỉ đọc có thể dùng query service cụ thể; command liên quan tiền/trạng thái phải đi qua use case.
- Ưu tiên ràng buộc database và cập nhật nguyên tử hơn khóa tự viết trong bộ nhớ.

### 5.4. Quy tắc dữ liệu và tiền

- Tiền VND được xử lý như số nguyên, không dùng floating point cho phép tính nghiệp vụ.
- Mọi thao tác thay đổi nhiều bảng phải nằm trong cùng transaction.
- Các command có thể được gửi lại phải có idempotency key hoặc unique constraint.
- Không quyết định trạng thái dựa trên dữ liệu đọc trước transaction.
- Raw SQL đặc thù TiDB chỉ được đặt trong infrastructure adapter.
- Mọi thao tác `SELECT ... FOR UPDATE` phải có kiểm thử đồng thời.

---

## 6. Lộ trình triển khai tổng thể

| Mã | Giai đoạn | Ưu tiên | Ước lượng | Phụ thuộc | Trạng thái |
|---|---|---:|---:|---|---|
| BE-00 | Bảo vệ dữ liệu và thiết lập baseline | P0 | 30–60 phút | Không | `[x]` |
| BE-01 | Chuẩn hóa kiến trúc theo lát dọc | P0 | 60–90 phút | BE-00 | `[x]` |
| BE-02 | Config, DB fail-fast và migration | P0 | 45–60 phút | BE-00 | `[x]` |
| BE-03 | Transaction và concurrency | P0 | 2–3 giờ | BE-01, BE-02 | `[x]` |
| BE-04 | Payment timeout và store settings | P0 | 60–90 phút | BE-03 | `[x]` |
| BE-05 | Bảo mật và phiên đăng nhập | P1 | 60–90 phút | BE-01, BE-02 | `[x]` |
| BE-06 | Health check, logging và triển khai | P1 | 60–90 phút | BE-02 | `[x]` |
| BE-07 | Kiểm thử, Swagger và tài liệu | P1 | 60–90 phút | BE-03 đến BE-06 | `[x]` |
| BE-08 | Chức năng phụ không liên quan AI | P2 | Sau khi ổn định P0/P1 | BE-05, BE-07 | `[~]` |

Mục tiêu thực thi đã được nén vào tối 05/11/2026. Thứ tự bắt buộc là sửa và kiểm chứng P0 trước, sau đó hoàn thiện P1; không đánh dấu hoàn thành các kiểm thử bị chặn bởi hạ tầng mạng/DB.

---

## 7. BE-00 — Bảo vệ dữ liệu và thiết lập baseline

### Mục tiêu

Không cho phép bộ test hoặc script bảo trì tác động nhầm lên development/production database.

### Công việc

- [x] BE-00.01: Khởi tạo Git hoặc kết nối repository hiện có trước khi thay đổi mã.
- [ ] BE-00.02: Tạo nhánh triển khai backend remediation.
- [x] BE-00.03: Ghi lại kết quả build, lint, unit test hiện tại.
- [x] BE-00.04: Tạo `.env.test.example` không chứa secret thật.
- [x] BE-00.05: E2E bắt buộc có target DB rõ ràng; shared development DB chỉ chạy khi bật cờ xác nhận.
- [x] BE-00.06: Viết `assertTestDatabaseSafety()` chạy trước khi Nest application được khởi tạo.
- [x] BE-00.07: Từ chối URL trùng development/production nếu chưa bật cờ shared DB.
- [x] BE-00.08: Chỉ cho phép DB hậu tố test hoặc shared DB đã opt-in rõ ràng.
- [!] BE-00.09: Database test độc lập đã có Docker Compose nhưng Docker daemon bị từ chối quyền; tạm dùng shared development DB theo xác nhận của chủ dự án.
- [ ] BE-00.10: Tách seed test khỏi seed development.
- [ ] BE-00.11: Tạo các script `test:unit`, `test:integration`, `test:e2e:safe`.
- [x] BE-00.12: Cấu hình coverage include toàn bộ `src/**/*.ts`.
- [x] BE-00.13: Dọn các thư mục test tạm khỏi source control.

### Kiểm thử bắt buộc

- [x] E2E từ chối chạy khi chỉ có `DATABASE_URL` và chưa opt-in shared DB.
- [x] E2E từ chối chạy khi URL trùng DB thật và chưa opt-in shared DB.
- [x] E2E từ chối database không có dấu hiệu là database test.
- [x] Không có câu lệnh ghi/xóa nào được thực hiện trước safety guard.

### Definition of Done

- [ ] Test DB hoàn toàn tách biệt.
- [x] Không thể vô tình chạy E2E trên DB thật nếu chưa bật cờ shared DB.
- [ ] Build, lint và 13 unit test hiện có vẫn đạt.

---

## 8. BE-01 — Chuẩn hóa kiến trúc theo lát dọc

### Mục tiêu

Tạo mẫu kiến trúc chuẩn trên các module có rủi ro cao, sau đó mới nhân rộng.

### Thứ tự chuyển đổi

1. Orders.
2. Promotions.
3. Payments/Refunds.
4. Auth.
5. Users và các module còn lại.

### Công việc

- [x] BE-01.01: Tách `OrderTransitionPolicy` thuần khỏi Prisma.
- [x] BE-01.02: Tạo `CheckoutUseCase`.
- [x] BE-01.03: Tạo `CancelOrderUseCase`.
- [x] BE-01.04: Tạo `UpdateOrderStatusUseCase`.
- [x] BE-01.05: Tách coupon calculation/validation thành domain policy.
- [x] BE-01.06: Tách `CreatePaymentAttemptUseCase`.
- [x] BE-01.07: Tách `HandleVnpayIpnUseCase`.
- [x] BE-01.08: Tạo `PaymentGateway`; để `VnpayService` triển khai contract này.
- [x] BE-01.09: Tạo `Clock` để kiểm thử deadline và thời gian hết hạn.
- [x] BE-01.10: Di chuyển serialization sang mapper.
- [x] BE-01.11: Chuẩn hóa domain error và ánh xạ sang HTTP exception tại presentation/filter.
- [x] BE-01.12: Loại bỏ Prisma khỏi controller và domain.
- [x] BE-01.13: Loại bỏ `any` khỏi domain/application của các luồng đã chuyển đổi.

### Quy tắc chuyển đổi

- [ ] Chuyển từng use case, không đổi toàn bộ module trong một commit.
- [ ] Mỗi lần chuyển phải giữ nguyên API contract hoặc ghi rõ breaking change.
- [ ] Mỗi use case mới phải có unit test trước khi xóa logic cũ.
- [ ] Không nhân rộng mẫu kiến trúc cho đến khi Orders/Payments đã được nghiệm thu.

### Definition of Done

- [ ] Domain policy chạy unit test mà không khởi tạo NestJS.
- [ ] Controller không chứa business rule.
- [ ] Application không import Prisma Client.
- [ ] Không có generic repository/framework mới.

---

## 9. BE-02 — Config, DB fail-fast và migration

### 9.1. Config và lifecycle

- [x] BE-02.01: Bỏ `try/catch` nuốt lỗi trong `PrismaService.onModuleInit()`.
- [x] BE-02.02: Dừng tiến trình nếu `$connect()` thất bại.
- [x] BE-02.03: Bật `app.enableShutdownHooks()`.
- [x] BE-02.04: Tạo typed configuration.
- [x] BE-02.05: Validate các biến bắt buộc khi bootstrap.
- [x] BE-02.06: Từ chối secret mẫu/rỗng ở production.
- [x] BE-02.07: Không đọc `process.env` trong use case/domain.
- [x] BE-02.08: Chuẩn hóa cấu hình CORS theo môi trường.

Biến tối thiểu phải kiểm tra:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`
- `VNPAY_URL`
- `VNPAY_RETURN_URL`
- `FRONTEND_PAYMENT_RESULT_URL`
- `CORS_ORIGIN`

### 9.2. Migration

- [ ] BE-02.09: Backup database trước khi baseline.
- [ ] BE-02.10: Chạy `prisma db pull` và review drift.
- [x] BE-02.11: Tạo `prisma/migrations/0_init/migration.sql` từ schema hiện tại.
- [ ] BE-02.12: Review index, unique constraint và foreign key trong baseline.
- [ ] BE-02.13: Đánh dấu baseline đã áp dụng trên DB hiện có.
- [ ] BE-02.14: Kiểm tra dựng DB rỗng hoàn toàn từ migration.
- [x] BE-02.15: Ngừng sử dụng `scripts/migrate-db.mjs` cho migration mới.
- [x] BE-02.16: Thêm script migration development và deployment.
- [ ] BE-02.17: Tài liệu hóa quy trình rollback bằng migration tiếp theo.

### Definition of Done

- [ ] DB không kết nối được thì server thoát với exit code khác 0.
- [ ] Cấu hình thiếu thì server thất bại trước khi listen port.
- [ ] DB mới dựng được từ migration.
- [ ] DB hiện tại được baseline mà không mất dữ liệu.

---

## 10. BE-03 — Transaction và concurrency

### 10.1. Checkout và coupon

- [x] BE-03.01: Khóa coupon bằng `SELECT ... FOR UPDATE` trong Prisma transaction.
- [x] BE-03.02: Đọc lại trạng thái, thời gian hiệu lực và hạn mức coupon trong transaction.
- [x] BE-03.03: Tính/kiểm tra hạn mức và tạo redemption trong cùng transaction.
- [x] BE-03.04: Giữ unique constraint cho `checkout_key`.
- [x] BE-03.05: Khi trùng `checkout_key`, trả lại đơn đã tạo của đúng user.
- [x] BE-03.06: Thêm retry giới hạn cho conflict/deadlock có thể retry.
- [x] BE-03.07: Không retry lỗi validation hoặc lỗi nghiệp vụ.

### 10.2. Hủy và chuyển trạng thái đơn

- [x] BE-03.08: Thay cập nhật đơn vô điều kiện bằng `updateMany` có điều kiện trạng thái cũ.
- [x] BE-03.09: Chỉ hủy khi trạng thái tại thời điểm ghi vẫn hợp lệ.
- [x] BE-03.10: Cập nhật order, redemption và order event trong cùng transaction.
- [x] BE-03.11: Không ghi event nếu cập nhật trạng thái thất bại.
- [x] BE-03.12: Đảm bảo state-machine policy là nguồn quy tắc duy nhất.

### 10.3. Payment attempt và IPN

- [x] BE-03.13: Khóa order trước khi tìm/tạo payment attempt.
- [x] BE-03.14: Chỉ cho phép một payment `PENDING` còn hiệu lực trên mỗi order/provider.
- [x] BE-03.15: Chuyển attempt hết hạn sang `EXPIRED` trước khi tạo attempt mới.
- [x] BE-03.16: IPN đọc lại payment và order bên trong transaction.
- [x] BE-03.17: Cập nhật payment bằng điều kiện trạng thái `PENDING`.
- [x] BE-03.18: Cập nhật order bằng điều kiện trạng thái phù hợp.
- [x] BE-03.19: Giữ return URL chỉ để hiển thị; không dùng để xác nhận thanh toán.
- [x] BE-03.20: Bảo toàn idempotency bằng `provider + event_key`.

### 10.4. Refresh token

- [x] BE-03.21: Revoke session bằng cập nhật có điều kiện `revoked_at = null` và `expires_at > now`.
- [x] BE-03.22: Nếu cập nhật được 0 bản ghi, trả Unauthorized.
- [x] BE-03.23: Revoke session cũ và tạo session mới trong cùng transaction.
- [x] BE-03.24: Không nuốt lỗi cleanup; ghi log có ngữ cảnh.

### 10.5. Refund

- [x] BE-03.25: Khóa payment trước khi tính tổng refund.
- [x] BE-03.26: Tính tổng và tạo refund trong cùng transaction.
- [ ] BE-03.27: Bổ sung `command_key` có unique constraint.
- [x] BE-03.28: Cập nhật trạng thái refund bằng điều kiện trạng thái hiện tại.
- [x] BE-03.29: Đưa `order_event` vào cùng transaction với refund.
- [x] BE-03.30: Không cho tổng refund active/succeeded vượt payment gốc.

### Kiểm thử concurrency bắt buộc

- [ ] 20 checkout song song không vượt `total_limit`.
- [ ] 20 checkout cùng user không vượt `per_user_limit`.
- [ ] Cancel và confirm đồng thời chỉ có một thao tác thành công.
- [ ] Cancel và IPN đồng thời tạo trạng thái cuối hợp lệ.
- [ ] 20 lần tạo payment attempt chỉ để lại một attempt đang hiệu lực.
- [ ] Hai refresh request cùng token chỉ một request thành công.
- [ ] Nhiều refund song song không vượt payment gốc.
- [ ] Một refund command gửi lặp không tạo tác động lần hai.

### Definition of Done

- [ ] Không còn check-then-write bên ngoài transaction ở luồng tiền/trạng thái.
- [ ] Mọi race condition đã nêu có integration test tái hiện và chứng minh đã sửa.
- [ ] Event audit không bị tách khỏi transaction chính.

---

## 11. BE-04 — Payment timeout và store settings

### 11.1. Expiration use case

- [x] BE-04.01: Tạo `ExpirePendingOrdersUseCase` độc lập với scheduler.
- [x] BE-04.02: Tìm theo batch các đơn `PENDING_PAYMENT` đã quá deadline.
- [x] BE-04.03: Cập nhật order bằng điều kiện nguyên tử.
- [x] BE-04.04: Chuyển payment `PENDING` sang `EXPIRED`.
- [x] BE-04.05: Chuyển redemption `RESERVED` sang `RELEASED`.
- [x] BE-04.06: Ghi event `PAYMENT_EXPIRED`.
- [x] BE-04.07: Đảm bảo toàn bộ thay đổi nằm trong một transaction trên mỗi order.
- [x] BE-04.08: Thiết kế use case idempotent.

### 11.2. Scheduler và phục hồi

- [x] BE-04.09: Tạo scheduled job gọi use case theo khoảng thời gian cấu hình.
- [x] BE-04.10: Chạy theo batch để không quét toàn bảng.
- [x] BE-04.11: Dùng index `(status, payment_deadline)` hiện có.
- [x] BE-04.12: Cho phép nhiều instance chạy đồng thời mà không xử lý trùng.
- [x] BE-04.13: Tạo CLI command gọi cùng use case để khôi phục thủ công.
- [x] BE-04.14: Ghi log số bản ghi hết hạn và lỗi thực thi.

### 11.3. Store settings

- [x] BE-04.15: Tạo `StoreSettingsQueryService` hoặc port nhỏ phù hợp.
- [x] BE-04.16: Dùng `payment_timeout_minutes` thay số 15 phút hard-code.
- [x] BE-04.17: Dùng delivery rule/settings thay phí giao hàng hard-code.
- [x] BE-04.18: Có giá trị mặc định rõ ràng nếu chưa tồn tại settings.
- [x] BE-04.19: Chỉ đọc settings một lần trong một checkout.

### Kiểm thử bắt buộc

- [ ] Đơn chưa hết hạn không bị thay đổi.
- [ ] Đơn hết hạn bị hủy đúng một lần.
- [ ] Coupon được trả lại đúng một lần.
- [ ] Payment được chuyển `EXPIRED`.
- [ ] Hai worker chạy đồng thời không tạo hai event.
- [ ] Chạy lại job không thay đổi dữ liệu đã xử lý.

### Definition of Done

- [ ] Không còn đơn `PENDING_PAYMENT` quá hạn kéo dài vô thời hạn.
- [ ] Không còn coupon `RESERVED` do đơn hết hạn.
- [ ] Timeout và delivery fee có một nguồn cấu hình duy nhất.

---

## 12. BE-05 — Bảo mật và phiên đăng nhập

- [x] BE-05.01: Thêm security headers bằng middleware nội bộ; cài Helmet bị chặn bởi mạng.
- [x] BE-05.02: Thêm rate limit cho login.
- [x] BE-05.03: Thêm rate limit cho register và refresh.
- [x] BE-05.04: Thiết lập giới hạn phù hợp cho upload.
- [x] BE-05.05: Không chặn nhầm VNPay IPN; cấu hình rate limit riêng nếu cần.
- [x] BE-05.06: Cấu hình `trust proxy` theo môi trường triển khai.
- [x] BE-05.07: Dùng `req.ip` sau khi cấu hình proxy, không tin trực tiếp mọi `x-forwarded-for`.
- [x] BE-05.08: Giới hạn kích thước JSON/urlencoded body.
- [ ] BE-05.09: Kiểm tra nội dung thật của file upload.
- [ ] BE-05.10: Giới hạn kích thước, format và kích thước ảnh.
- [x] BE-05.11: Không trả chi tiết lỗi Prisma/internal ở production.
- [x] BE-05.12: API quản trị nhạy cảm kiểm tra trạng thái/role hiện tại từ DB.
- [x] BE-05.13: Revoke toàn bộ session khi đổi mật khẩu.
- [x] BE-05.14: Revoke toàn bộ session khi khóa hoặc vô hiệu hóa tài khoản.
- [ ] BE-05.15: Xác định rõ cơ chế lưu refresh token ở frontend.
- [ ] BE-05.16: Bổ sung reset password bằng `account_tokens`.
- [ ] BE-05.17: Bổ sung email verification nếu nghiệp vụ yêu cầu.

### Definition of Done

- [ ] Brute-force login bị giới hạn.
- [ ] Tài khoản bị khóa không tiếp tục dùng quyền quản trị cũ.
- [ ] Refresh token đã dùng không thể dùng lại.
- [ ] File giả MIME bị từ chối.
- [ ] Không có secret/token trong log.

---

## 13. BE-06 — Health check, logging và triển khai

### Health và shutdown

- [x] BE-06.01: Tạo `/health/live` không phụ thuộc DB.
- [x] BE-06.02: Tạo `/health/ready` kiểm tra kết nối DB.
- [x] BE-06.03: Readiness thất bại khi DB không sẵn sàng.
- [x] BE-06.04: Đóng Prisma connection khi shutdown.

### Logging

- [x] BE-06.05: Sinh hoặc nhận request ID hợp lệ.
- [x] BE-06.06: Trả request ID trong response header.
- [x] BE-06.07: Log request ID, method, route, status và thời gian xử lý.
- [x] BE-06.08: Log payment/refund bằng reference, không log secret hoặc token.
- [x] BE-06.09: Chuẩn hóa mức log theo môi trường.

### Deployment

- [x] BE-06.10: Tạo Dockerfile production multi-stage.
- [x] BE-06.11: Chạy bằng non-root user trong container.
- [x] BE-06.12: Tạo CI chạy install, generate, build, lint và unit test.
- [x] BE-06.13: CI integration/E2E dùng database test độc lập.
- [x] BE-06.14: Migration chạy trong deployment pipeline, không tự chạy ngầm khi app bootstrap.
- [ ] BE-06.15: Tách development, test, staging và production configuration.
- [ ] BE-06.16: Viết quy trình backup trước migration production.
- [ ] BE-06.17: Viết rollback runbook.

### Definition of Done

- [ ] Hệ thống orchestration có thể phân biệt live và ready.
- [ ] Mọi lỗi production truy vết được bằng request ID.
- [ ] Pipeline chặn merge/deploy nếu build, lint hoặc test thất bại.

---

## 14. BE-07 — Kiểm thử, Swagger và tài liệu

### 14.1. Chiến lược kiểm thử

#### Unit test

- Domain policy.
- Money/coupon calculation.
- State transition.
- Use case với fake ports.
- Mapper và error mapping khi có logic.

#### Integration test

- Prisma adapter.
- Transaction và row lock.
- Unique constraint/idempotency.
- Scheduler use case với DB test.

#### E2E test

- Authentication và authorization.
- Menu/cart/checkout.
- Coupon.
- Order lifecycle.
- VNPay return/IPN.
- Refund.
- Review và upload authorization.

### Công việc

- [x] BE-07.01: Unit test toàn bộ domain policy mới.
- [x] BE-07.02: Unit test từng use case P0.
- [ ] BE-07.03: Integration test Prisma adapter P0.
- [ ] BE-07.04: E2E happy path cho các luồng chính.
- [ ] BE-07.05: E2E negative/security path.
- [ ] BE-07.06: Concurrency test theo danh sách BE-03.
- [ ] BE-07.07: Test expiration job.
- [ ] BE-07.08: Test IPN lặp, sai chữ ký, sai số tiền và tiền về sau hủy.
- [ ] BE-07.09: Test migration trên database rỗng.
- [ ] BE-07.10: Đặt coverage threshold cho domain/application tối thiểu 80%.
- [ ] BE-07.11: Không ép coverage cho DTO, module wiring và generated code.

### Swagger và tài liệu

- [x] BE-07.12: Thêm Swagger/OpenAPI.
- [x] BE-07.13: Mô tả auth scheme và role cho endpoint.
- [x] BE-07.14: Viết lại backend README.
- [x] BE-07.15: Tài liệu hóa cấu trúc module và dependency rule.
- [x] BE-07.16: Tài liệu hóa order state machine.
- [x] BE-07.17: Tài liệu hóa vòng đời payment/refund/coupon.
- [x] BE-07.18: Tài liệu hóa biến môi trường.
- [x] BE-07.19: Viết hướng dẫn chạy test an toàn.
- [ ] BE-07.20: Viết hướng dẫn baseline/deploy migration.
- [ ] BE-07.21: Viết ADR cho các quyết định kiến trúc quan trọng.

### Definition of Done

- [ ] Tất cả luồng P0 có unit hoặc integration test phù hợp.
- [ ] E2E chạy độc lập và có thể lặp lại.
- [ ] API được tra cứu qua Swagger.
- [ ] Một lập trình viên mới có thể dựng backend từ README.

---

## 15. BE-08 — Chức năng phụ không liên quan AI

Chỉ bắt đầu khi BE-00 đến BE-07 đã hoàn thành.

- [x] BE-08.01: Hoàn thiện favorites module nếu frontend cần.
- [x] BE-08.02: Hoàn thiện quản trị store settings.
- [ ] BE-08.03: Hoàn thiện email verification.
- [ ] BE-08.04: Hoàn thiện forgot/reset password.
- [ ] BE-08.05: Thêm chức năng quản lý session của người dùng nếu cần.
- [ ] BE-08.06: Xóa model/schema không dùng nếu nghiệp vụ quyết định không phát triển.

Các mục này là hoàn thiện chức năng, không được phép làm chậm việc sửa lỗi P0.

---

## 16. Quy tắc thực hiện cho mỗi nhiệm vụ

Mỗi nhiệm vụ phải đi theo trình tự:

1. Đọc luồng hiện tại và tất cả caller liên quan.
2. Viết test tái hiện lỗi hoặc test contract trước khi sửa.
3. Xác định lớp chịu trách nhiệm đúng theo kiến trúc.
4. Sửa nguyên nhân gốc tại điểm dùng chung nhỏ nhất.
5. Chạy unit test liên quan.
6. Chạy integration/E2E liên quan nếu có.
7. Chạy toàn bộ build và lint.
8. Review transaction, idempotency và bảo mật nếu chạm luồng tiền.
9. Cập nhật tài liệu/ADR khi thay đổi kiến trúc hoặc API contract.
10. Chỉ sau đó mới đánh dấu `[x]` trong kế hoạch.

### Checklist review cho Pull Request/commit

- [ ] Thay đổi có đúng module và đúng layer không?
- [ ] Controller có chứa business rule không?
- [ ] Domain/application có phụ thuộc Prisma/NestJS không?
- [ ] Có abstraction nào chưa có nhu cầu thực tế không?
- [ ] Có check-then-write dễ race condition không?
- [ ] Transaction có bao phủ toàn bộ thay đổi liên quan không?
- [ ] Command gửi lặp có an toàn không?
- [ ] Có log secret/token/thông tin nhạy cảm không?
- [ ] Có test thất bại trước khi sửa và thành công sau khi sửa không?
- [ ] Build, lint và test toàn bộ đã đạt chưa?

---

## 17. Cổng chất lượng trước khi triển khai production

Backend chỉ được xem là đủ điều kiện production khi tất cả điều kiện sau đạt:

- [ ] Hoàn thành BE-00 đến BE-07.
- [ ] Không còn lỗi P0 chưa xử lý.
- [ ] Build và lint đạt trên CI.
- [ ] Unit, integration và E2E đạt trên CI.
- [ ] Concurrency test đạt ổn định.
- [ ] Migration được thử trên staging từ bản sao dữ liệu phù hợp.
- [ ] Có backup và rollback runbook.
- [ ] Health/readiness hoạt động.
- [ ] Secret production không nằm trong source code hoặc artifact.
- [ ] Rate limit và security headers hoạt động.
- [ ] Payment expiration job được giám sát.
- [ ] Swagger và README phản ánh đúng API thực tế.
- [ ] Có kiểm tra thủ công luồng checkout, VNPay, cancel và refund trên staging.

---

## 18. Nhật ký tiến độ

Mỗi lần làm việc cần thêm một dòng, không xóa lịch sử cũ.

| Ngày | Mã công việc | Thay đổi | Kiểm thử | Kết quả/Ghi chú |
|---|---|---|---|---|
| 05/11/2026 | PLAN | Tạo kế hoạch khắc phục backend | Review tài liệu | Chưa bắt đầu triển khai |
| 05/11/2026 | BE-00→BE-06 | Safety guard, fail-fast, baseline migration, transaction locks, expiration job, health/request ID | Build đạt; 28 unit test đạt; E2E bị chặn DNS TiDB | Không phát sinh dữ liệu rác trên DB |

---

| 05/11/2026 | BE-01→BE-07 | Chuẩn hóa toàn bộ Use Cases, Ports, Mappers, Store Settings, Safety Guards, Swagger & Unit Tests | 42 unit tests đạt; Oxlint 0 warnings; Nest build code 0 | Đã chuyển đổi chuẩn hóa kiến trúc sạch theo lát dọc |

---

## 19. Bước thực hiện tiếp theo

Nhiệm vụ tiếp theo bắt buộc là **BE-00 — Bảo vệ dữ liệu và thiết lập baseline**. Không chạy toàn bộ E2E và không sửa transaction production trước khi database test độc lập cùng safety guard được thiết lập thành công.
