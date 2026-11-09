# VỊ VIỆT — ĐẶC TẢ API

Phiên bản 1.0 · Hoàn thiện ngày 04/11/2026 · Hợp đồng thiết kế REST/SSE; chưa có server hoặc OpenAPI thực thi được phát hành trong bộ này.

## 1. Phạm vi và quy ước

Theo nghiệp vụ 1.0, CSDL 37 bảng và tài liệu kiến trúc 01. Prefix `/api/v1`. Mọi path trong bảng sau đều tương đối với prefix này. JSON UTF-8, camelCase. Quyền: PUBLIC, AUTH (đã đăng nhập), CUSTOMER, OPERATOR, KITCHEN, ADMIN. STAFF = OPERATOR hoặc ADMIN; KITCHEN_ACCESS = KITCHEN hoặc ADMIN. Kiểm tra chủ sở hữu ngoài role.

| Quy ước | Giá trị |
|---|---|
| id | Chuỗi số dương biểu diễn BIGINT, ví dụ `"101"` |
| Money | Chuỗi VND nguyên không âm, ví dụ `"59000"`; không nhận scientific notation |
| Time | ISO 8601 UTC, ví dụ `2026-11-02T08:00:00.000Z` |
| Enum | UPPER_SNAKE_CASE, đúng danh sách hợp đồng |
| NULL/không gửi | NULL là giá trị rỗng cho trường cho phép; thiếu trường PATCH nghĩa giữ nguyên |
| Validation | Từ chối field lạ, id sai, chuỗi vượt giới hạn; trim nội dung trước kiểm |
| Phân trang | page>=1 mặc định 1, pageSize 1–50 mặc định 20; sort thuộc allowlist |
| Header mutation | `Origin` đúng origin và `X-Requested-With: ViVietWeb`; cookie auth HttpOnly |
| Chống trùng | Header `Idempotency-Key` UUID ở endpoint yêu cầu; giữ khi retry cùng ý định |

Response thành công thông thường:

```json
{"data":{"id":"101"},"meta":{"requestId":"req-demo"}}
```

Danh sách: `data` là array; `meta` có requestId, page, pageSize, total. Response 204 không có body. SSE và VNPay IPN là hai giao thức ngoại lệ không dùng envelope này. Tất cả ví dụ là dữ liệu minh họa.

Lỗi chuẩn:

```json
{"error":{"code":"QUOTE_CHANGED","message":"Giá hoặc điều kiện đã thay đổi.","details":{"requiresRequote":true}},"meta":{"requestId":"req-demo"}}
```

Không trả stacktrace, raw SQL, token hoặc payload đối tác chưa lọc. Header lỗi validation có details.fields = [{path,message}], không phản chiếu mật khẩu/token.

### 1.1. HTTP và mã lỗi

| HTTP | Code tiêu biểu | Nghĩa |
|---|---|---|
| 400 | VALIDATION_ERROR, INVALID_TOKEN | Request sai schema/token |
| 401 | UNAUTHENTICATED, SESSION_EXPIRED | Cần đăng nhập/refresh |
| 403 | FORBIDDEN, ORIGIN_REJECTED | Sai quyền hoặc ngữ cảnh request |
| 404 | NOT_FOUND | Không tồn tại hoặc không thuộc người dùng |
| 409 | QUOTE_CHANGED, IDEMPOTENCY_CONFLICT, STATUS_CONFLICT, EDIT_CONFLICT | Dữ liệu/ý định đã xung đột |
| 422 | DISH_UNAVAILABLE, INVALID_OPTIONS, STORE_CLOSED, OUTSIDE_SERVICE_AREA, COUPON_INVALID, PAYMENT_NOT_ALLOWED, REFUND_LIMIT_EXCEEDED | Dữ liệu đúng hình thức nhưng không đáp ứng nghiệp vụ |
| 429 | RATE_LIMITED | Vượt giới hạn; có Retry-After |
| 502/503/504 | PROVIDER_ERROR, AI_UNAVAILABLE, AI_TIMEOUT | Dịch vụ ngoài lỗi hoặc quá hạn |
| 500 | INTERNAL_ERROR | Lỗi đã giảm dữ liệu, dùng requestId đối chiếu |

Client chỉ tự refresh một lần khi 401. Không tự retry tạo đơn/refund bằng key mới. Request có kết quả không rõ phải kiểm tra tài nguyên hoặc retry cùng key.

## 2. Xác thực và tài khoản

Access JWT trong cookie `vv_access`; refresh token trong `vv_refresh`. Cookie do backend set, không trả token qua JSON. Mọi auth mutation vẫn kiểm Origin/header; các route PUBLIC nghĩa không cần đăng nhập, không nghĩa bỏ bảo vệ request trình duyệt.

| ID | Method / path | Quyền | Request | Response / lỗi đặc thù |
|---|---|---|---|---|
| API-01 | POST `/auth/register` | PUBLIC | fullName 2–120, email<=254, password 10–128 | 201 UserSafe; trùng email 409 EMAIL_EXISTS |
| API-02 | POST `/auth/login` | PUBLIC | email,password | 200 UserSafe, set cookies; sai credential 401 với thông báo chung |
| API-03 | POST `/auth/refresh` | PUBLIC+refresh cookie | Không body | 200 {authenticated:true}, rotate cookies; 401 token sai/hết |
| API-04 | POST `/auth/logout` | AUTH hoặc refresh hợp lệ | Không body | 204, revoke session và clear cookies; logout lặp 204 |
| API-05 | POST `/auth/forgot-password` | PUBLIC | email | 202 {message}; cùng hình thức dù email không tồn tại |
| API-06 | POST `/auth/reset-password` | PUBLIC+token | token,newPassword | 204, tiêu thụ token; token dùng/hết 400 |
| API-07 | POST `/auth/verify-email` | PUBLIC+token | token | 204; token sai/hết 400 |
| API-08 | POST `/auth/resend-verification` | AUTH | Không body | 202; rate limit; đã verify trả 200 {alreadyVerified:true} |
| API-09 | PUT `/auth/password` | AUTH | currentPassword,newPassword | 204; thu hồi các phiên theo chính sách và yêu cầu login lại |
| API-10 | GET `/me` | AUTH | Không body | 200 UserSafe |
| API-11 | PATCH `/me` | AUTH | fullName?,phone? | 200 UserSafe; không nhận role/status/email ở route này |

UserSafe: id,fullName,email,phone,role,status,emailVerifiedAt. Không có passwordHash. Email chuẩn hóa trim/lowercase; điện thoại chuỗi tối đa 20 ký tự theo quy tắc đầu số được chọn khi triển khai. Password không trim/sửa ngầm và phải kiểm độ dài byte phù hợp thư viện.

Đổi password: thu hồi phiên, clear cookie và buộc đăng nhập lại để giảm nhầm trạng thái. Verify email không tự đổi role; chính sách cơ sở cho phép đặt sau đăng nhập, chưa bắt buộc email verified, có thể bật yêu cầu này bằng thay đổi chính sách được ghi nhận.

## 3. Địa chỉ, sở thích và yêu thích

| ID | Method / path | Quyền | Request | Response |
|---|---|---|---|---|
| API-12 | GET `/me/addresses` | AUTH | Pagination | 200 Address[] của mình |
| API-13 | POST `/me/addresses` | AUTH | AddressWrite | 201 Address |
| API-14 | PATCH `/me/addresses/{id}` | AUTH+owner | Partial AddressWrite | 200 Address, 404 nếu khác chủ |
| API-15 | DELETE `/me/addresses/{id}` | AUTH+owner | Không body | 204 xóa mềm; không sửa snapshot đơn |
| API-16 | GET `/me/preferences` | AUTH | Không body | 200 Preferences, mặc định consent=false |
| API-17 | PUT `/me/preferences` | AUTH | PreferencesWrite đầy đủ | 200 Preferences, thay atomic các bảng liên kết |
| API-18 | GET `/me/favorites` | CUSTOMER | Pagination | 200 DishSummary[] |
| API-19 | PUT `/me/favorites/{dishId}` | CUSTOMER | Không body | 204 thêm idempotent |
| API-20 | DELETE `/me/favorites/{dishId}` | CUSTOMER | Không body | 204 bỏ idempotent |

AddressWrite: recipientName 1–120, phone<=20, addressLine 1–500, deliveryNote?<=500, latitude?/longitude? cặp số hoặc NULL, isDefault boolean. Address thêm id,createdAt,updatedAt. Một mặc định tối đa trên khách do service khóa khi ghi. Nếu xóa mặc định thì không tự chọn địa chỉ khác mà không báo; checkout yêu cầu chọn địa chỉ.

PreferencesWrite:

```json
{"spicyLevel":0,"budgetPerMeal":"70000","personalizationEnabled":true,"dietaryNote":null,"tagPreferences":[{"tagId":"4","preference":"LIKE"}],"ingredientRestrictions":[{"ingredientId":"8","reason":"DISLIKE"}]}
```

spicyLevel NULL hoặc 0–3, budget NULL hoặc Money. tagId/ingredientId phải tồn tại, không trùng; preference LIKE/AVOID, reason DISLIKE/ALLERGY/OTHER. Backend ghi consentedAt khi chuyển false→true. Tắt không xóa đơn, nhưng dừng thu/dùng hành vi cho gợi ý; tác vụ dọn dữ liệu theo chính sách. Không dùng phần tử array như lệnh sửa tùy ý chủ khác.

## 4. API public catalog, nội dung và cấu hình

| ID | Method / path | Quyền | Query | Response |
|---|---|---|---|---|
| API-21 | GET `/categories` | PUBLIC | Không | Category[] active |
| API-22 | GET `/dishes` | PUBLIC | q<=160,categoryId,minPrice,maxPrice,tagIds,sort,page,pageSize | DishSummary[] |
| API-23 | GET `/dishes/by-slug/{slug}` | PUBLIC | slug<=180 | DishDetail hoặc 404 nếu ẩn |
| API-24 | GET `/dishes/{id}` | PUBLIC | Không | DishDetail hoặc 404 |
| API-25 | GET `/dishes/{id}/reviews` | PUBLIC | page,pageSize | ReviewPublic[] VISIBLE |
| API-26 | GET `/ingredients` | PUBLIC | q,page,pageSize | id,code,name,isAllergen |
| API-27 | GET `/tags` | PUBLIC | Không | id,code,name |
| API-28 | GET `/story-sections` | PUBLIC | Không | StorySection[] published, join món hiện hành |
| API-29 | GET `/store` | PUBLIC | Không | StorePublic |

`sort` allowlist recommended/priceAsc/priceDesc/name; recommended ở endpoint public chỉ là thứ tự biên tập, không giả là cá nhân hóa. Giá lọc là giá tối thiểu của biến thể active, chưa gồm options; tagIds là giao các tag yêu cầu. Category ẩn làm món không xuất hiện trong public menu. Món SOLD_OUT có thể hiện để xem, HIDDEN/deleted không hiện. Chỉ gồm món có biến thể active, kể cả sold out. Có thể tìm bằng q chứa chuỗi đã escape tham số, không ghép SQL từ sort.

DishSummary: id,name,slug,categoryId,coverUrl,startingPrice,availability,spicyLevel,tagIds,ratingAverage,ratingCount. ratingCount=0 thì ratingAverage=NULL. Aggregate chỉ tính review hiển thị theo chính sách.

DishDetail bổ sung description,story,ingredientDataStatus,images,ingredients,tags,variants,optionGroups. Variant={id,name,price,isActive}; group={id,name,minSelect,maxSelect,values:[{id,name,extraPrice,isActive}]}. Public chỉ trả cấu hình còn hoạt động. Images có id,url,kind,altText,sortOrder; ingredient có id,name,note,isAllergen. Không coi danh sách trống là không có dị ứng.

StorePublic: name,address,phone,openingHours,acceptingOrders,paymentTimeoutMinutes,deliveryAreas (code,label,fee,addressHints), timezone, orderingAvailable, unavailabilityReason. Không trả secret hoặc thông tin nội bộ.

StorySection: id,dishId,imageUrl,altText,chapterLabel,headline,body,ctaLabel,backgroundColor,textColor,animationPreset,sortOrder,extraAssets, dish={name,slug,startingPrice,availability}. Preset ROLL_LEFT/SLIDE_RIGHT/RISE/STATIC; xóa/ẩn món thì cảnh liên quan không xuất bản public. SOLD_OUT vẫn có thể hiện câu chuyện nhưng CTA mua bị khóa.

## 5. Giỏ hàng

| ID | Method / path | Quyền | Request | Response |
|---|---|---|---|---|
| API-30 | GET `/cart` | CUSTOMER | Không | CartSnapshot |
| API-31 | PUT `/cart` | CUSTOMER | {items:CartLineInput[]} | 200 CartSnapshot, thay snapshot để import không cộng lặp |
| API-32 | POST `/cart/items` | CUSTOMER | CartLineInput | 201 CartSnapshot sau thêm/gộp |
| API-33 | PATCH `/cart/items/{id}` | CUSTOMER+owner | {variantId?,quantity?,optionValueIds?,note?} | 200 CartSnapshot |
| API-34 | DELETE `/cart/items/{id}` | CUSTOMER+owner | Không | 204 |

CartLineInput={dishId,variantId,quantity,optionValueIds:[],note:NULL}. quantity 1–99, note<=500, option ids không trùng. Giới hạn đề xuất 50 dòng mỗi giỏ để bảo vệ request. POST thêm/gộp không có idempotency lưu riêng: client không tự retry khi chưa rõ; GET rồi PUT snapshot để phục hồi. PUT lặp cùng snapshot không cộng thêm lần nữa. Các nhóm options phải đạt min/max và thuộc đúng món.

CartSnapshot: id,items:[{id,dishId,variantId,dishName,variantName,optionValueIds,options,quantity,note,unitPrice,lineTotal,isOrderable,issues:[]}],subtotal,hasIssues,updatedAt. Giá là hiện tại, không cam kết. GET cho thấy dòng đã lỗi thay vì xóa âm thầm. PUT ghi toàn bộ hoặc 422 kèm các dòng lỗi, không ghi một phần rồi giả thành công. Giỏ guest dùng client local; server không nhận userId trong payload.

## 6. Quote và tạo đơn

| ID | Method / path | Quyền | Request | Response |
|---|---|---|---|---|
| API-35 | POST `/checkout/quote` | CUSTOMER | CheckoutInput | 200 Quote |
| API-36 | POST `/orders` | CUSTOMER | {quoteToken}; Idempotency-Key bắt buộc | 201 OrderDetail lần đầu; 200 khi replay hợp lệ |
| API-37 | GET `/orders` | CUSTOMER | status?,page,pageSize | OrderSummary[] của mình |
| API-38 | GET `/orders/by-code/{orderCode}` | CUSTOMER+owner | Không | OrderDetail |
| API-39 | GET `/orders/{id}` | CUSTOMER+owner | Không | OrderDetail |
| API-40 | POST `/orders/{id}/cancel` | CUSTOMER+owner | {reason,commandKey} | {outcome:CANCELLED hoặc REQUESTED,order} |
| API-41 | POST `/orders/{id}/reorder-preview` | CUSTOMER+owner | Không | {items,changes,unavailableItems}; chưa sửa giỏ/tạo đơn |

### 6.1. CheckoutInput

```json
{"items":[{"dishId":"10","variantId":"101","quantity":2,"optionValueIds":["33"],"note":null}],"fulfillmentType":"DELIVERY","recipient":{"name":"Khách thử nghiệm","phone":"0900000000","addressLine":"Địa chỉ minh họa trong vùng giao","serviceAreaCode":"AREA_01","deliveryNote":null},"couponCode":null,"paymentMethod":"COD","customerNote":null}
```

Không dùng cartItemId làm nguồn duy nhất vì guest/login/cart có thể thay đổi. Snapshot explicit cho phép quote và tạo cùng ý định. Hệ thống vẫn kiểm tra lựa chọn với catalog, không tin giá từ client.

| Trường | Điều kiện |
|---|---|
| items | 1–50 dòng, mỗi dòng theo CartLineInput |
| fulfillmentType | DELIVERY hoặc PICKUP |
| recipient.name/phone | Bắt buộc, theo giới hạn địa chỉ |
| recipient.addressLine/serviceAreaCode | Bắt buộc DELIVERY; PICKUP gửi NULL hoặc bỏ |
| serviceAreaCode | Phải nằm trong cấu hình quán; backend kiểm địa chỉ theo quy tắc vùng/hints, mơ hồ trả OUTSIDE_SERVICE_AREA hoặc yêu cầu làm rõ |
| deliveryNote/customerNote | NULL hoặc tối đa 500 |
| couponCode | NULL hoặc 1–40, chuẩn hóa uppercase |
| paymentMethod | COD hoặc VNPAY |

Vùng giao là danh sách do quán xác nhận, chưa có geocoding/GPS tự động; không tuyên bố xác minh tọa độ thật từ việc khách chọn code. Snapshot deliveryAddress ghép địa chỉ và nhãn vùng đã chọn để nhân viên đối chiếu.

### 6.2. Quote response

```json
{"data":{"currency":"VND","subtotal":"132000","foodDiscount":"0","deliveryFee":"15000","shippingDiscount":"0","totalAmount":"147000","lines":[{"dishId":"10","variantId":"101","quantity":2,"basePrice":"59000","optionsPrice":"7000","lineTotal":"132000"}],"coupon":null,"quoteToken":"SIGNED_TOKEN_EXAMPLE","expiresAt":"2026-11-02T08:05:00.000Z"},"meta":{"requestId":"req-demo"}}
```

Token HMAC có sub, dữ liệu chuẩn hóa, giá được báo, expiry và digest. Token là dữ liệu nhạy cảm chứa snapshot, chỉ gửi trong JSON qua HTTPS, không URL/log/localStorage dài hạn. Không giữ tồn/lượt mã. Tiền phần trăm làm tròn nửa lên tới đồng; tiền tệ không đổi.

### 6.3. Tạo đơn và retry

Backend xác minh chữ ký và chủ token trước. Tính `checkoutKey = namespace(userId,Idempotency-Key)` và requestHash trên dữ liệu đã chấp nhận (snapshot món, nhận hàng, coupon, phương thức, tổng tiền), loại các trường token expiry/signature. Cần migration checkout_request_hash trong tài liệu 01.

Nếu đơn cùng key tồn tại: so hash, trả cùng đơn nếu khớp dù quote đã hết hạn; không tái tính giá đơn cũ. Nếu không khớp trả 409 IDEMPOTENCY_CONFLICT. Nếu chưa tồn tại: quote phải còn hạn, tính lại giá/điều kiện và thực hiện transaction. QUOTE_CHANGED trả requiresRequote và thay đổi có thể công bố, không tự tạo đơn với giá mới.

Ví dụ response COD sau tạo:

```json
{"data":{"id":"501","orderCode":"VV-DEMO-501","status":"PENDING_CONFIRMATION","paymentStatus":"UNPAID","paymentMethod":"COD","totalAmount":"147000","nextAction":"TRACK_ORDER"},"meta":{"requestId":"req-demo","replayed":false}}
```

Trực tuyến có tiền phải thu trả PENDING_PAYMENT, nextAction=CREATE_PAYMENT; gọi API-42 sau đó. Đơn total 0 đánh dấu PAID, không tạo payment amount 0. Khi tạo đơn thành công, client GET lại giỏ và chỉ bỏ dòng đã mua nếu không xóa nhầm dòng người dùng vừa chỉnh ở tab khác; PUT snapshot phải do client đối chiếu có chủ đích.

### 6.4. Order DTO và hủy/đặt lại

OrderSummary={id,orderCode,status,paymentStatus,paymentMethod,fulfillmentType,totalAmount,createdAt,completedAt}. OrderDetail bổ sung snapshot recipient, customerNote, subtotal/discounts/fees, items (snapshot tên/giá/options/note), events (dữ liệu công khai cho chủ), paymentDeadline, estimatedReadyAt, availableActions. Không trả error nội bộ hoặc payload đối tác.

Cancel reason 1–500, commandKey UUID; khóa đơn, kiểm chính sách. Nếu chưa được tự hủy thì ghi CANCEL_REQUESTED và trả REQUESTED, giữ status. Retry cùng commandKey không thêm yêu cầu nữa. Staff đọc event để xử lý. Reorder-preview trả món/giá hiện tại và chênh lệch, client chọn PUT /cart sau xem trước; không tự đặt lại với giá cũ.

## 7. Thanh toán, IPN và hoàn tiền

| ID | Method / path | Quyền | Request | Response |
|---|---|---|---|---|
| API-42 | POST `/orders/{id}/payment-attempts` | CUSTOMER+owner | {provider:"VNPAY"} | 201 hoặc 200 PaymentRedirect nếu dùng lại pending |
| API-43 | GET `/orders/{id}/payments` | CUSTOMER+owner | Không | PaymentSafe[] |
| API-44 | GET `/payments/vnpay/return` | PUBLIC+gateway | Query VNPay | 303 tới route kết quả cùng origin; không ghi paid từ redirect |
| API-45 | GET `/payments/vnpay/ipn` | Gateway | Query VNPay có chữ ký | JSON RspCode/Message theo giao thức đối tác |
| API-46 | GET `/admin/payments` | ADMIN | status?,orderId?,from?,to?,page,pageSize | PaymentAdmin[] |
| API-47 | POST `/admin/payments/{id}/reconcile` | ADMIN | {reason,commandKey} | 200 kết quả xác minh; chưa rõ giữ pending/flag, không tự success |
| API-48 | POST `/admin/payments/{id}/refunds` | ADMIN | {amount,reason}; Idempotency-Key | 201 RefundSafe hoặc 200 replay |
| API-49 | POST `/admin/refunds/{id}/commands` | ADMIN | RefundCommand | 200 RefundSafe |

PaymentRedirect={paymentId,merchantReference,status,redirectUrl,expiresAt}. redirectUrl chỉ từ adapter allowlist, không lấy từ client; nếu đơn đã paid/hủy/hết hạn trả 422. Pending chưa rõ thì tái dùng hoặc đối soát, không cứ click là tạo transaction mới.

PaymentSafe={id,provider,amount,currency,status,paidAt,expiresAt}. PaymentAdmin thêm orderId,merchantReference,providerTransactionId,refunds; không secret/raw payload. RefundSafe={id,paymentId,refundReference,amount,reason,status,refundedAt}. Các mã số tiền đều VND chuẩn nội bộ.

### 7.1. VNPay adapter

Giữ đúng tên trường giao thức vnp_* tại adapter; không áp camelCase lên checksum. Dùng hợp đồng của tài khoản sandbox được cấp, kiểm vnp_TmnCode, vnp_TxnRef, chữ ký, vnp_Amount (đơn vị giao thức) và trạng thái phản hồi. Return và IPN có vai trò riêng.

IPN exception không dùng envelope chuẩn và không phụ thuộc cookie. Mapping thường gặp phải kiểm chứng theo hợp đồng VNPay: RspCode `00` ghi nhận, `02` đã xử lý, `01` không tìm thấy, `04` sai số tiền, `97` sai chữ ký, `99` lỗi khác. Không gửi `00` trước khi commit. Chỉ đánh dấu đã xử lý khi cùng transaction đã cập nhật xong; ERROR có thể retry. Giới hạn payload và giảm dữ liệu log; đối tác retry không bị rate-limit trình duyệt cản trở vô lý.

Sự kiện nhận dedupe theo provider+eventKey chuẩn hóa. Chữ ký sai không thay giao dịch. Callback tới đơn đã hủy vẫn ghi khoản thực thu hợp lệ rồi gắn việc hoàn/đối soát, không chuyển lại chờ xác nhận. Thu trùng ở hai attempt phải giữ cả hai giao dịch thật.

### 7.2. RefundCommand

Command={type,commandKey,reason?,providerReference?}. type START_PROCESSING/CONFIRM_MANUAL_SUCCESS/MARK_FAILED. Chuyển hợp lệ: REQUESTED→PROCESSING; REQUESTED/PROCESSING→SUCCEEDED khi đã có chứng từ đối soát; REQUESTED/PROCESSING→FAILED khi xác minh thất bại. Thử lại failed tạo yêu cầu mới có kiểm hạn mức, không ghi đè lịch sử failed.

CONFIRM_MANUAL_SUCCESS bắt buộc providerReference 1–150 và reason giải thích nguồn đối soát; lưu provider_refund_id và order_event. Chỉ dành quy trình thủ công được công bố, không dùng để giả tích hợp gateway. START_PROCESSING chỉ gửi đối tác nếu adapter hoàn đã cấu hình; timeout không đánh dấu thành công. amount>0 và tổng giữ/đã hoàn không vượt payment SUCCEEDED.

Idempotency refundReference namespace từ paymentId+key; replay so amount/reason/requestedBy. commandKey kiểm dưới khóa refund/order; ghi evidence vào event với schema như mục 8.

## 8. API nhân viên và SSE

| ID | Method / path | Quyền | Request/query | Response |
|---|---|---|---|---|
| API-50 | GET `/staff/orders` | STAFF | status?,q?,from?,to?,page,pageSize | OrderSummary[] trong phạm vi công việc |
| API-51 | GET `/staff/orders/{id}` | STAFF | Không | OrderStaffDetail |
| API-52 | POST `/staff/orders/{id}/commands` | Theo command | OrderCommand | 200 OrderStaffDetail hoặc KitchenOrder |
| API-53 | GET `/staff/kitchen/orders` | KITCHEN_ACCESS | status=CONFIRMED/PREPARING/READY,page,pageSize | KitchenOrder[] |
| API-54 | GET `/events` | AUTH | orderId? | text/event-stream, lọc chủ/role |

OrderCommand={type,commandKey,expectedStatus,reason?,estimatedReadyAt?}. type và quyền:

| type | Quyền | Điều kiện |
|---|---|---|
| CONFIRM | STAFF | PENDING_CONFIRMATION, món/tiền đáp ứng |
| REJECT | STAFF | Trước chế biến, reason bắt buộc; chốt CANCELLED và việc hoàn |
| START_PREPARATION | KITCHEN_ACCESS | CONFIRMED→PREPARING |
| MARK_READY | KITCHEN_ACCESS | PREPARING→READY |
| HAND_OVER | STAFF | READY→DELIVERING, chỉ DELIVERY |
| COLLECT_COD | STAFF | COD, số tiền còn phải thu khớp; tạo/xác nhận payment, không tự đổi bước giao |
| COMPLETE | STAFF | READY cho PICKUP hoặc DELIVERING cho DELIVERY; tiền đủ hoặc total=0 |
| DELIVERY_FAILED | STAFF | DELIVERING, reason bắt buộc |
| CANCEL | ADMIN; STAFF chỉ trước PREPARING | Chính sách hủy; reason bắt buộc |
| REPORT_ISSUE | KITCHEN_ACCESS hoặc STAFF | reason bắt buộc, ghi event, không tự đổi tiền |

expectedStatus phải khớp sau khi khóa row, nếu lệch trả STATUS_CONFLICT và allowedActions hiện hành. commandKey lặp cùng nội dung trả trạng thái hiện hành không tạo event trùng; khác nội dung 409. Lưu order_events.note dạng JSON cho command/event có cấu trúc: {commandKey,payloadHash,reason,evidence?}; giới hạn serialize <=1000 ký tự theo CSDL, nếu vượt trả validation. Backend trả note đã chọn lọc và dịch thành thông báo, không render JSON thô. Việc quyết định yêu cầu hủy đọc các CANCEL_REQUESTED event chưa có kết quả và ghi event chấp thuận/từ chối rõ.

COLLECT_COD request thêm amount và currency VND; amount phải bằng số cần thu. KitchenOrder chỉ có id,orderCode,status,createdAt,items,preparationNote/issue cần thiết; response command do bếp gọi phải dùng DTO này, không lộ người nhận/tiền.

SSE ví dụ:

```text
id: 9001
event: order.changed
data: {"orderId":"501","orderCode":"VV-DEMO-501","status":"PREPARING","updatedAt":"2026-11-02T08:10:00.000Z"}

```

Cookie auth, không token trên URL. CUSTOMER chỉ own order, STAFF theo công việc, KITCHEN chỉ dữ liệu bếp. Event là tín hiệu GET lại snapshot; reconnect luôn refetch. Heartbeat 15 giây; khi phiên hết/thu hồi, đóng stream. Client refresh hợp lệ rồi kết nối lại, không loop vô hạn. Không nhận client gửi event để đổi trạng thái qua SSE.

## 9. Quản trị catalog, nội dung, người dùng và báo cáo

| ID | Method / path | Quyền | Request/query | Response |
|---|---|---|---|---|
| API-55 | GET `/admin/categories` | ADMIN | page,pageSize | Category[] cả hidden |
| API-56 | POST `/admin/categories` | ADMIN | CategoryWrite | 201 Category |
| API-57 | PATCH `/admin/categories/{id}` | ADMIN | Partial CategoryWrite,expectedUpdatedAt | 200 Category |
| API-58 | GET `/admin/dishes` | ADMIN | q,categoryId,availability,page,pageSize | AdminDishSummary[] |
| API-59 | GET `/admin/dishes/{id}` | ADMIN | Không | DishAggregate gồm cấu hình active/inactive |
| API-60 | POST `/admin/dishes` | ADMIN | DishAggregateWrite | 201 DishAggregate |
| API-61 | PUT `/admin/dishes/{id}` | ADMIN | DishAggregateWrite,expectedUpdatedAt | 200 aggregate, EDIT_CONFLICT nếu cũ |
| API-62 | PATCH `/staff/dishes/{id}/availability` | STAFF/KITCHEN_ACCESS | {availability,expectedUpdatedAt} | 200 {id,availability,updatedAt}; staff chỉ AVAILABLE/SOLD_OUT |
| API-63 | POST `/admin/uploads` | ADMIN | multipart file | 201 {assetPath,url,mimeType,sizeBytes}; chưa tự gắn món |
| API-64 | GET `/admin/coupons` | ADMIN | q,isActive,page,pageSize | Coupon[] |
| API-65 | POST `/admin/coupons` | ADMIN | CouponWrite | 201 Coupon |
| API-66 | PATCH `/admin/coupons/{id}` | ADMIN | Partial CouponWrite,expectedUpdatedAt | 200 Coupon |
| API-67 | GET `/admin/users` | ADMIN | role,status,q,page,pageSize | UserSafe[] |
| API-68 | POST `/admin/users` | ADMIN | fullName,email,temporaryPassword,role | 201 UserSafe, không trả hash |
| API-69 | PATCH `/admin/users/{id}` | ADMIN | fullName?,phone?,role?,status?,expectedUpdatedAt | 200 UserSafe |
| API-70 | GET `/admin/customers/{id}` | ADMIN | Không | UserSafe và thống kê giao dịch cơ bản |
| API-71 | GET `/admin/customers/{id}/orders` | ADMIN | page,pageSize | OrderSummary[] |
| API-72 | GET `/admin/reviews` | ADMIN | visibility,dishId,page,pageSize | ReviewAdmin[] |
| API-73 | PATCH `/admin/reviews/{id}` | ADMIN | reply?,visibility?,moderationReason?,expectedUpdatedAt | 200 ReviewAdmin |
| API-74 | GET `/admin/story-sections` | ADMIN | Không | StorySection[] cả draft |
| API-75 | POST `/admin/story-sections` | ADMIN | StoryWrite | 201 StorySection |
| API-76 | PATCH `/admin/story-sections/{id}` | ADMIN | Partial StoryWrite,expectedUpdatedAt | 200 StorySection |
| API-77 | GET `/admin/store` | ADMIN | Không | StoreAdmin |
| API-78 | PUT `/admin/store` | ADMIN | StoreWrite,expectedUpdatedAt | 200 StoreAdmin |
| API-79 | GET `/admin/reports/summary` | ADMIN | from,to | ReportSummary |
| API-80 | GET `/admin/reports/top-dishes` | ADMIN | from,to,limit 1–50 | [{dishId,name,quantity,grossItemValue}] |
| API-81 | POST `/admin/ingredients` | ADMIN | {name,code,isAllergen} | 201 Ingredient |
| API-82 | PATCH `/admin/ingredients/{id}` | ADMIN | partial,name/code/isAllergen,expectedUpdatedAt | 200 Ingredient |
| API-83 | POST `/admin/tags` | ADMIN | {name,code} | 201 Tag |
| API-84 | PATCH `/admin/tags/{id}` | ADMIN | partial,name/code,expectedUpdatedAt | 200 Tag |

Không có hard DELETE cho món/biến thể đã tham chiếu. Ẩn món bằng availability=HIDDEN và ngừng biến thể/options bằng isActive=false. API-61 thay cấu hình aggregate trong transaction, các id con đã có không được chuyển sang món khác; id thiếu trong danh sách mới được inactive theo hợp đồng, không xóa snapshot lịch sử. Bảng liên kết tags/ingredients có thể replace atomic.

### 9.1. Schema quản trị

| DTO | Các trường và validation |
|---|---|
| CategoryWrite | name<=100,slug<=140 duy nhất,sortOrder integer,isActive boolean |
| DishAggregateWrite | categoryId,name<=160,slug<=180,description?,story?,spicyLevel NULL/0–3,ingredientDataStatus UNKNOWN/PARTIAL/VERIFIED,availability AVAILABLE/SOLD_OUT/HIDDEN,sortOrder; arrays variants,optionGroups,ingredients,tags,images |
| VariantWrite | id? cho phần tử cũ,name<=100,price Money,isActive |
| GroupWrite | id?,name<=100,minSelect>=0,maxSelect>=min và >=1,isActive,values[] |
| OptionWrite | id?,name<=100,extraPrice Money,isActive; server gán group/dish, không lấy ownership từ client |
| IngredientLink | ingredientId,note?; không trùng |
| ImageWrite | id?,assetPath từ upload hợp lệ,kind COVER/GALLERY/CUTOUT,altText<=255,sortOrder; ít nhất một cover trước mở bán |
| CouponWrite | code<=40,name<=160,discountType FIXED/PERCENT/FREE_SHIPPING,discountValue,minSubtotal,maxDiscount?,startsAt,endsAt,totalLimit?,perUserLimit,isActive |
| StoryWrite | dishId,imageId?,chapterLabel<=100,headline<=200,body,ctaLabel<=100,backgroundColor/textColor #RRGGBB,animationPreset,sortOrder,isPublished,extraAssets? |
| StoreWrite | name<=160,address<=500,phone<=20,openingHours,deliveryRules,acceptingOrders,paymentTimeoutMinutes 1–120 |

Các array của món: variants>=1 khi mở bán, group values hoạt động đủ đạt minSelect; images tối đa đề xuất 12, options tối đa 50/món, ingredients/tags tối đa 50. Không cho id con trùng. Trường TEXT mô tả/câu chuyện giới hạn nghiệp vụ đề xuất 10.000 ký tự để kiểm soát payload. Tổng request JSON tối đa đề xuất 256KB, ngoại lệ upload được cấu hình riêng.

Coupon: FIXED value>0, PERCENT 1–100 có maxDiscount, FREE_SHIPPING value=0. endsAt>startsAt; minSubtotal/maxDiscount>=0, limit dương hoặc NULL. Không sửa code/quy tắc tiền của mã đã dùng theo cách đổi nghĩa lịch sử; tạo mã mới khi thay lớn, bản snapshot đơn vẫn giữ quy tắc cũ.

Story imageId phải thuộc dishId. extraAssets là array tối đa 5 phần tử {assetPath,altText,layer:BACKGROUND/FOREGROUND}; không JS/HTML/URL tùy ý. Draft preview nhận từ GET admin, frontend dựng cùng preset như public. Thứ tự cập nhật bằng sortOrder; frontend preview trước rồi PATCH các mục có expectedUpdatedAt, khi lỗi một phần reload và báo rõ, không giả transaction cả batch.

openingHours={timezone:"Asia/Ho_Chi_Minh",days:[{day:1,intervals:[{start:"08:00",end:"21:00"}]}]}; day 1–7, không trùng, ca không chồng nhau, ca qua đêm phải được chuẩn hóa rõ. deliveryRules={method:"AREA_FIXED",areas:[{code:"AREA_01",label:"Vùng minh họa",fee:"15000",addressHints:["..."],isActive:true}]}; code duy nhất, fee Money, không cho hàm thực thi. GET public chỉ trả phần đã lọc.

API-68 dùng mật khẩu tạm phải trao riêng qua kênh được chủ dự án quyết định; trong demo seed tài khoản thử thay việc gửi mật khẩu. Không cho ADMIN cuối cùng tự khóa/hạ quyền nếu không còn admin active. Role update thu hồi/cập nhật phiên theo auth guard. Bản CSDL chưa có cờ bắt buộc đổi mật khẩu lần đầu; không tuyên bố hỗ trợ tính năng đó nếu chưa migration.

Upload tối đa 8MB một ảnh, kiểm MIME thực và giải mã ảnh, tên mới do server tạo, JPEG/PNG/WebP. Không upload SVG/code hoặc nhận path tùy ý. Trả relative assetPath và public URL; thao tác attach vào ảnh của món thực hiện trong DishAggregateWrite.

ReportSummary={period:{from,to},createdOrderCount,completedOrderCount,cancelledOrderCount,completedOrderValue,collectedAmount,refundedAmount,netCashAmount,newCustomerCount,returningCustomerCount,asOf}. from/to là UTC, nửa mở [from,to), tối đa đề xuất 366 ngày. Đơn hoàn thành xét completedAt, thu xét paidAt, hoàn xét refundedAt. Không nhãn lợi nhuận. Món bán chạy dùng dòng đơn COMPLETED trong kỳ, grossItemValue là trước giảm cấp đơn để tránh giả phân bổ coupon từng món.

## 10. Đánh giá của khách

| ID | Method / path | Quyền | Request | Response |
|---|---|---|---|---|
| API-85 | PUT `/order-items/{id}/review` | CUSTOMER+owner | {rating 1–5,content NULL/<=2000} | 200/201 ReviewPublic; chỉ đơn COMPLETED |

UserId và dishId suy ra từ order item/đơn, không client gán. PUT cùng nội dung là idempotent. Phiên bản cơ sở cho sửa đánh giá của mình khi đơn vẫn hợp lệ; thời hạn giới hạn nếu bổ sung cần cập nhật nghiệp vụ. ReviewPublic={id,rating,content,authorDisplayName,createdAt,reply,repliedAt}; tên hiển thị được giảm dữ liệu, không trả email/phone.

## 11. AI và cá nhân hóa

| ID | Method / path | Quyền | Request/query | Response |
|---|---|---|---|---|
| API-86 | POST `/ai/conversations` | PUBLIC hoặc AUTH | {title?} | 201 {id,title,expiresAt}; guest set secret cookie |
| API-87 | GET `/ai/conversations/{id}` | Owner/guest secret | beforeId?,limit 1–50 | Conversation và Message[] theo thời gian |
| API-88 | POST `/ai/conversations/{id}/messages` | Owner/guest secret | {content 1–2000,requestKey UUID} | 201 AIReply hoặc 200 replay |
| API-89 | DELETE `/ai/conversations/{id}` | Owner/guest secret | Không | 204 xóa mềm, tác vụ dọn dữ liệu |
| API-90 | GET `/recommendations` | PUBLIC hoặc AUTH | limit 1–12 | {mode,items:[RecommendationCard]} |
| API-91 | POST `/me/interactions` | CUSTOMER+consent | {dishId,recommendationId?,eventType,eventKey,occurredAt} | 202; duplicate eventKey không ghi lần hai |
| API-92 | GET `/health` | PUBLIC, tối giản | Không | 200 {status:"ok"}; không config/secret |

Guest dùng cookie HttpOnly `vv_ai_guest` path /api/v1/ai, token ngẫu nhiên đã băm lưu trên mỗi conversation; không trả token thô trong JSON. Giới hạn đề xuất 3 hội thoại đồng thời/phiên, 50 tin người dùng/hội thoại, 10 tin/phút/phiên và 1 request AI đang xử lý/hội thoại. Khi tạo nhiều hội thoại trong cùng guest cookie, dùng một secret cho phiên để truy cập các hội thoại cùng phiên; không rotate làm mất quyền hội thoại cũ. Giới hạn theo IP bổ sung để không bỏ qua bằng tạo cookie mới.

Đăng nhập không tự chuyển hội thoại guest thành dữ liệu tài khoản. Nếu muốn chức năng chuyển, cần endpoint/đồng ý riêng; phiên bản cơ sở tiếp tục truy cập guest bằng cookie và tạo hội thoại account mới khi cần.

Message={id,role,content,createdAt,recommendations?}; không trả raw tool prompt/nội bộ. AIReply={conversationId,userMessageId,assistantMessageId,content,recommendations,warnings}; cảnh báo thiếu dữ liệu là kết quả nghiệp vụ, không nhất thiết HTTP error. Câu hỏi đã lưu nhưng AI timeout trả 504 kèm userMessageId nếu có; retry cùng requestKey tìm lại tin và tiếp tục nếu chưa có reply, không thêm bản user trùng.

requestKey/payloadHash và quan hệ replyTo nằm trong structured_data. Backend khóa hội thoại khi nhận/claim; không giữ transaction suốt HTTP tới model. Claim lưu structured_data trạng thái PROCESSING với lease deadline; request đang chạy khác key trả 409 AI_BUSY. Hết lease thì retry được có kiểm soát. Trước ghi reply phải kiểm claim còn hợp lệ; không ghi hai assistant reply cho một requestKey. Mọi writer đi qua cùng service; chưa có unique index riêng cho JSON nên phải kiểm thử cạnh tranh.

RecommendationCard={id,dishId,dishName,slug,coverUrl,startingPrice,availability,reason,rankPosition,expiresAt,proposedSelection?}. proposedSelection có variantId/quantity/optionValueIds nếu phương án đủ cấu hình; chỉ để mở xác nhận giỏ và phải kiểm lại. Giá tổ hợp nằm trong structured_data dạng có schema, không thay bộ tính giá.

mode=PERSONALIZED chỉ khi có căn cứ và quyền dùng; nếu không thì DECLARED_PREFERENCES hoặc POPULAR. Khách tắt hành vi có thể nhận món phổ biến; điều kiện chủ động nêu cho lần tư vấn hiện tại vẫn được xử lý. Không ghi user_interactions khi chưa đồng ý. eventType VIEW/CLICK_RECOMMENDATION/ADD_TO_CART; recommendationId phải cùng món và cùng chủ/phiên; occurredAt được kiểm lệch giờ, server lưu createdAt để đối chiếu.

### 11.1. Tool nội bộ, không expose làm API công khai

| Tool | Input | Output/giới hạn |
|---|---|---|
| searchMenu | q?,budget?,spicyMax?,tagIds?,avoidIngredientIds?,partySize? | Món thật, tối đa 20 kết quả, tình trạng dữ liệu thành phần |
| getDishDetails | dishIds 1–10 | Biến thể/options/thành phần được phép đọc |
| buildMealOptions | candidateDishIds,budget,partySize | Tối đa 3 tổ hợp, giá do code tính; thiếu dữ liệu thì cảnh báo |

Backend validate mọi tool args dù do model sinh. Không arbitrary SQL, không tool đổi quyền/giá, không tự mua. Ngân sách chưa biết phí giao phải nêu chưa gồm phí; không im lặng đổi nghĩa ngân sách. Thông tin dị ứng thiếu thì không đánh dấu món an toàn.

## 12. Liên kết yêu cầu và điều kiện xuất bản hợp đồng

| FR | Endpoint chính |
|---|---|
| FR-01/02/23 | API-01 đến 11, 67 đến 69 |
| FR-03/04 | API-12 đến 17 |
| FR-05/24/25 | API-28/29, 74 đến 78 |
| FR-06/07/08/22 | API-21 đến 27, 55 đến 63, 81 đến 84 |
| FR-09/10/11 | API-30 đến 36, 64 đến 66 |
| FR-12/16 | API-40, 42 đến 49, 52 |
| FR-13/14/15/17 | API-37 đến 39, 50 đến 54 |
| FR-18/19 | API-41, 73, 85 |
| FR-20/21/28 | API-86 đến 91 |
| FR-26/27 | API-79/80, 18 đến 20 |

Khi lập trình, DTO và Swagger phải hiện đúng request, response, cookie security, enums và error. Xuất OpenAPI từ code rồi kiểm tra frontend contract; không coi bảng endpoint này là file OpenAPI có thể chạy ngay. Việc thay endpoint hoặc trường phải cập nhật tài liệu 02/04 và contract test.

## 13. Checklist kiểm hợp đồng quan trọng

- Ví dụ JSON parse được, id/tiền/time đúng kiểu; DTO không nhận field role/price tùy ý từ khách.
- API public không lộ món ẩn; staff/kitchen trả dữ liệu phù hợp quyền.
- Retry checkout không yêu cầu quote còn hạn nếu đơn cùng hash đã tạo; payload khác bị chặn.
- Callback, COD và refund có kiểm tra tiền gốc, trạng thái và tính lặp.
- Command phía bếp không trả DTO full chứa PII.
- AI requestKey tiếp tục được sau timeout mà không nhân tin hoặc giữ khóa mạng dài.
- SSE, IPN, upload và 204 có content-type/envelope đúng giao thức riêng.
- API mutation cần Origin/header trừ gateway theo hợp đồng, không bỏ qua vì đã có cookie.

## 14. Nguồn kỹ thuật đối chiếu

- VNPay payment/IPN: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
- VNPay query/refund: https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr%26refund.html
- NestJS SSE: https://docs.nestjs.com/techniques/server-sent-events

Khi có tài khoản sandbox, phải thử chữ ký, mã phản hồi và cơ chế retry với cấu hình thật của tài khoản. Bộ tài liệu không chứa credential và không tuyên bố đã kiểm tích hợp đối tác.
