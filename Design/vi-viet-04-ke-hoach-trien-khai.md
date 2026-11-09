# VỊ VIỆT — KẾ HOẠCH TRIỂN KHAI VÀ CHECKLIST TIẾN ĐỘ

Phiên bản 1.0 · Hoàn thiện ngày 04/11/2026 · Trạng thái: kế hoạch triển khai; chưa xác nhận bất kỳ chức năng phần mềm nào đã xây dựng.

## 1. Mục tiêu và bộ tài liệu đầu vào

Kế hoạch đưa hệ thống từ đặc tả đến bản đồ án có thể chạy và trình diễn. Mỗi giai đoạn cần có kết quả đầu-cuối, kiểm tra được và có bằng chứng; không đánh dấu hoàn thành chỉ vì đã tạo màn hình hoặc sinh code.

Tài liệu tham chiếu:

1. `vi-viet-phan-tich-nghiep-vu.md`: phạm vi, FR-01–28, BR-01–36 và AC-01–23.
2. `vi-viet-database.zip`: schema 37 bảng, từ điển dữ liệu và giới hạn xác minh hiện tại.
3. `vi-viet-01-kien-truc-he-thong.md`: module, bảo mật, transaction và vận hành.
4. `vi-viet-02-giao-dien-va-animation.md`: SCR-01–34, timeline và asset AS-01–07.
5. `vi-viet-03-dac-ta-api.md`: API-01–92 và DTO.

Các thay đổi cần ghi nhận: bổ sung migration `orders.checkout_request_hash`, mô tả SMTP phục vụ xác minh/reset email, các hợp đồng quote/command chống trùng. Không sửa bản schema gốc rồi coi là chưa có thay đổi.

## 2. Cách dùng checklist

- `[ ]` nghĩa chưa có bằng chứng hoàn thành; `[x]` chỉ dùng khi đạt tiêu chí của đầu việc.
- Mã công việc T0-01…T8-10 ổn định để liên kết commit, issue và bằng chứng kiểm tra.
- Người nhận việc ghi chủ trì, trạng thái, ngày cập nhật và liên kết bằng chứng trong bảng theo dõi. Nếu chưa có người phụ trách thì giữ “Chưa phân công”.
- Trạng thái công việc: TODO, IN_PROGRESS, BLOCKED, REVIEW, DONE. BLOCKED cần nêu việc thiếu cụ thể và tác động.
- Checklist trong tài liệu này khởi tạo tất cả chưa hoàn thành đối với công việc triển khai. Các tài liệu đã được viết không đồng nghĩa các chức năng được xây dựng.
- Một lần nhận việc nên chọn một nhóm có thể hoàn thành đầu-cuối; cập nhật cả kiểm thử, tài liệu và lỗi còn lại trước bàn giao.

Mẫu sổ theo dõi dùng trong repository:

| Mã | Chủ trì | Trạng thái | Phụ thuộc đang thiếu | Commit/bằng chứng | Cập nhật |
|---|---|---|---|---|---|
| T0-01 | Chưa phân công | TODO | Không | Chưa có | Chưa bắt đầu |

Không tự chia sẻ tài khoản, gửi thông báo cho người khác hoặc triển khai public chỉ vì công việc xuất hiện trong kế hoạch. Việc tạo môi trường, credential và triển khai thực hiện theo quyền được giao của dự án.

## 3. Các mốc bàn giao

| Mốc | Kết quả phải trình diễn | Phụ thuộc |
|---|---|---|
| M0 | Hợp đồng chốt và prototype một cảnh phở chạy trên dữ liệu mẫu | Tài liệu/asset ban đầu |
| M1 | Web/API/MySQL chạy, tài khoản/role và migration hoạt động | M0 phần hợp đồng |
| M2 | Món thật từ database, cấu hình tùy chọn và quản trị thực đơn | M1 |
| M3 | Đặt COD → xác nhận → bếp → nhận/giao → thu tiền → hoàn thành | M2 |
| M4 | Coupon và thanh toán trực tuyến với retry, hủy, đối soát/hoàn | M3 |
| M5 | AI gợi ý hợp lệ, chuyển giỏ; cá nhân hóa có kiểm soát | M2 + giỏ M3; tích hợp hoàn chỉnh sau M4 |
| M6 | Trang chủ kể chuyện hoàn chỉnh kết nối món, desktop/mobile | Prototype M0 + API nội dung M2 |
| M7 | Bộ nghiệm thu, demo triển khai và tài liệu bàn giao | M3–M6 |

Không đợi đến M6 mới làm giao diện. Prototype và chuẩn bị asset ở T0; các component và màn hình mua hàng triển khai cùng backend từng giai đoạn. M6 là mốc hoàn thiện chuyển động và tối ưu.

## 4. Giai đoạn 0 — chốt hợp đồng và thử nghiệm thiết kế

**Đầu vào:** bộ tài liệu. **Đầu ra:** quyết định kỹ thuật, phạm vi cố định cho vòng đầu và prototype chuyển động sớm.

- [ ] **T0-01** Đọc/đối chiếu nghiệp vụ, schema và 4 tài liệu; lập danh sách khác biệt, không tự thêm chức năng ngoài phạm vi.
- [ ] **T0-02** Chốt cấu hình một cửa hàng, role, COD/VNPay, quy tắc hủy, coupon và giới hạn phiên bản.
- [ ] **T0-03** Kiểm tra phiên bản Node/Next/Nest/Prisma 7 tương thích MySQL; ghi bản chọn vào quyết định kỹ thuật và lockfile khi khởi tạo.
- [ ] **T0-04** Chốt quy ước id/tiền/time, cookie, origin, lỗi API và Idempotency-Key.
- [ ] **T0-05** Chuẩn bị mockup desktop/mobile hero, thực đơn, chọn món và checkout theo SCR-01–06.
- [ ] **T0-06** Chuẩn bị storyboard 4 khung phở, 3 khung bánh mì và danh sách AS-01–07; ghi asset còn thiếu.
- [ ] **T0-07** Dựng thử phân cảnh phở với dữ liệu mẫu: vào từ trái, dừng, hiện câu chuyện và CTA; chưa cần API.
- [ ] **T0-08** Kiểm prototype trên desktop/mobile, cuộn ngược, resize và reduced motion; ghi vấn đề hiệu năng/asset.
- [ ] **T0-09** Chốt dữ liệu seed minh họa, bảng điều kiện AI và tài khoản thử theo vai trò; không dùng dữ liệu người thật.
- [ ] **T0-10** Lập bảng việc/chủ trì/phụ thuộc và cách lưu bằng chứng; xác nhận tiêu chí M0.

**Điều kiện qua mốc:** không còn bất đồng về trạng thái/tiền trong luồng COD; có một prototype chứng minh hướng animation khả thi, asset thiếu được ghi rõ. Không yêu cầu mọi hình ảnh cuối cùng đã hoàn hảo để bắt đầu nền tảng.

## 5. Giai đoạn 1 — nền tảng, database và xác thực

**Phụ thuộc:** T0-01–04. **Đầu ra:** môi trường chạy, migration/seed và auth theo quyền.

- [ ] **T1-01** Khởi tạo repository/workspaces web và API, TypeScript strict, format/lint và lockfile.
- [ ] **T1-02** Thiết lập Docker Compose MySQL, volume bền vững, SMTP test và cấu hình development không có secret thật trong git.
- [ ] **T1-03** Import schema trên MySQL 8.4 thật; ghi lỗi nếu có, sửa bằng migration có kiểm soát và chạy lại trên database rỗng.
- [ ] **T1-04** Bổ sung migration checkout_request_hash; thiết lập Prisma, kiểm mapping BIGINT/Decimal/UTC và giữ CHECK cần thiết.
- [ ] **T1-05** Seed cửa hàng, role/tài khoản thử, danh mục và dữ liệu tối thiểu; mật khẩu seed băm, chỉ dùng môi trường thử.
- [ ] **T1-06** Dựng envelope response/lỗi, requestId, validation, logging giảm dữ liệu, health và khung Swagger.
- [ ] **T1-07** Làm API-01–04/10: đăng ký, login, refresh rotation, logout, /me; kiểm tra cookie/Origin/header.
- [ ] **T1-08** Làm API-05–09: email xác minh/reset, token có hạn/dùng một lần và đổi mật khẩu thu hồi phiên.
- [ ] **T1-09** Làm guard role/ownership, tài khoản khóa và admin cuối cùng; thử truy cập chéo tài khoản/role.
- [ ] **T1-10** Dựng SCR-10–16, hồ sơ và địa chỉ API-11–15; test nhiều tab refresh và một địa chỉ mặc định.

**Kiểm tra bắt buộc:** AC-01/02, auth cookie không lộ qua JSON/localStorage, email token thử được trong SMTP test, không truy cập MySQL public trong cấu hình triển khai. **Mốc:** M1.

## 6. Giai đoạn 2 — thực đơn, nội dung và giao diện nền

**Phụ thuộc:** M1. **Đầu ra:** thực đơn dùng dữ liệu thật, quản trị được món và dữ liệu cho animation/AI.

- [ ] **T2-01** Tạo module catalog với public API-21–27, lọc/sort/phân trang, loại món ẩn và danh mục inactive.
- [ ] **T2-02** Làm aggregate món/biến thể/nhóm options/values, kiểm ownership con, min/max và soft-disable thay xóa lịch sử.
- [ ] **T2-03** Hoàn thiện quản trị danh mục, thành phần, tags; validation trùng mã, slug và dữ liệu thành phần.
- [ ] **T2-04** Xây upload ảnh kiểm MIME thực, kích thước, tên file và đường dẫn; attach ảnh vào đúng món.
- [ ] **T2-05** Xây store settings/giờ nhận/vùng giao/biểu phí theo schema, API-29/77/78.
- [ ] **T2-06** Xây nội dung story_sections, API-28/74–76; kiểm ảnh thuộc món và preset cho phép.
- [ ] **T2-07** Dựng design tokens và component dùng chung; dialog có focus, form error và trạng thái tải/trống/lỗi.
- [ ] **T2-08** Làm SCR-02/03/04 và SCR-25/26: tìm/lọc, chi tiết và chọn món đầy đủ.
- [ ] **T2-09** Làm thao tác báo hết nhanh cho nhân viên/bếp; giá chỉ ADMIN, xung đột cập nhật trả 409 rõ.
- [ ] **T2-10** Seed bộ thực đơn đại diện: có biến thể, topping, sold-out, hidden và thành phần chưa đủ; kiểm AC-03 và AC-21 phần dữ liệu.

**Điều kiện qua mốc:** frontend chọn đúng biến thể/options thật; server từ chối id con của món khác; quản trị thay giá/ẩn món thể hiện ở public đúng chính sách. **Mốc:** M2.

## 7. Giai đoạn 3 — giỏ, checkout COD và vận hành đầu-cuối

**Phụ thuộc:** M2. **Đầu ra:** khách mua và cửa hàng hoàn thành một đơn COD bằng dữ liệu thật.

- [ ] **T3-01** Làm giỏ guest cục bộ, cart API-30–34, replace snapshot không cộng lặp và xử lý đồng bộ sau login.
- [ ] **T3-02** Làm CheckoutInput, validation lựa chọn/nhận hàng/vùng giao/giờ quán và tính tiền server.
- [ ] **T3-03** Làm quote có HMAC và hạn, hiện tổng/điều kiện; không giữ món hoặc coupon ở bước quote.
- [ ] **T3-04** Làm tạo đơn transaction với snapshot tên/giá/địa chỉ, checkoutKey và requestHash; replay cùng key đúng chủ/payload.
- [ ] **T3-05** Làm SCR-05/06/08 và lịch sử SCR-18, xử lý quote đổi/hết hạn/mạng lỗi sau gửi.
- [ ] **T3-06** Làm state machine và commands cho tiếp nhận/bếp/giao nhận; khóa hàng và ghi event.
- [ ] **T3-07** Làm SCR-21/22/23; Kitchen DTO chỉ có dữ liệu chế biến cần thiết.
- [ ] **T3-08** Làm thu COD và điều kiện hoàn thành, đơn nhận tại quán không có phí/mốc đang giao.
- [ ] **T3-09** Làm hủy/yêu cầu hủy trước và sau xác nhận, báo sự cố và xử lý giao thất bại có người chịu trách nhiệm.
- [ ] **T3-10** Làm SSE cookie auth và GET đối soát khi reconnect; kiểm AC-04/05/06/08/12/13/23.

**Kịch bản qua mốc:** khách đặt → nhân viên xác nhận → bếp chuẩn bị/xong → bàn giao → thu COD → hoàn thành → xem đơn cũ. Không thao tác trực tiếp database để vượt trạng thái. **Mốc:** M3.

## 8. Giai đoạn 4 — ưu đãi, thanh toán, sau bán và báo cáo

**Phụ thuộc:** M3, tài khoản VNPay sandbox đã cấu hình khi kiểm tích hợp thật. **Đầu ra:** giao dịch và ngoại lệ tiền được kiểm chứng.

- [ ] **T4-01** Làm quản trị coupon và quy tắc FIXED/PERCENT/FREE_SHIPPING, snapshot điều kiện trên đơn.
- [ ] **T4-02** Làm reserve/consume/release và khóa chống vượt lượt; test hai yêu cầu dùng lượt cuối.
- [ ] **T4-03** Làm payment attempt, dựng URL từ attempt hiện có và hạn; không tạo attempt mới liên tục khi double-click.
- [ ] **T4-04** Làm VNPay IPN/Return, kiểm chữ ký/số tiền/tham chiếu và sổ event chống lặp; test bằng fixture trước sandbox thật.
- [ ] **T4-05** Làm job hết hạn/đối soát, tiền tới sau hủy và thu thừa hai attempt; giữ đúng dấu vết giao dịch.
- [ ] **T4-06** Làm refund request/commands, giới hạn tổng hoàn, minh chứng thủ công nếu chưa tự động; ADMIN quyết định.
- [ ] **T4-07** Làm SCR-07/27/34, các trạng thái chờ xác minh/lỗi/đối soát/hoàn; không giả success từ redirect.
- [ ] **T4-08** Làm review API-85, SCR-19/29; chỉ chủ đơn hoàn thành và cửa hàng không sửa nội dung khách.
- [ ] **T4-09** Làm báo cáo API-79/80, SCR-24/31; định nghĩa thu/hoàn/giá trị đơn/tiền thuần, tránh JOIN nhân tiền.
- [ ] **T4-10** Kiểm AC-07/09/10/11/14/15/16/22; ghi rõ test mock và sandbox thật, các phần đang BLOCKED vì credential.

**Điều kiện qua mốc:** có bằng chứng payment sandbox xác minh đúng và test ngoại lệ; phần chưa có credential không được đánh dấu hoàn tất tích hợp thật. **Mốc:** M4.

## 9. Giai đoạn 5 — AI và cá nhân hóa

**Phụ thuộc:** catalog, giỏ và quyền sở hữu; có API key riêng khi kiểm provider thật. **Đầu ra:** tư vấn có căn cứ và khách chuyển được phương án vào giỏ.

- [ ] **T5-01** Hoàn thiện API-16/17 và SCR-17, các khai báo sở thích/thành phần tránh, bật/tắt dùng hành vi.
- [ ] **T5-02** Làm bộ lọc món theo tình trạng/điều kiện, phân biệt dữ liệu UNKNOWN/PARTIAL/VERIFIED.
- [ ] **T5-03** Làm tool searchMenu/getDishDetails/buildMealOptions có schema, giới hạn và bộ tính tiền riêng.
- [ ] **T5-04** Làm adapter Gemini, system instruction và tool loop có timeout/giới hạn; không tool arbitrary SQL hoặc mua hàng.
- [ ] **T5-05** Làm hội thoại account/guest bằng secret, requestKey/claim/lease, tiếp tục sau timeout không nhân tin.
- [ ] **T5-06** Làm bộ xếp hạng có giải thích; yêu cầu hiện tại ưu tiên, điều kiện bắt buộc lọc trước điểm sở thích.
- [ ] **T5-07** Dựng SCR-09 và vùng gợi ý; phương án có giá/lý do, mở chọn cấu hình và kiểm lại trước giỏ.
- [ ] **T5-08** Làm tương tác có consent và favorite P2 nếu đủ thời gian; không tự bật cá nhân hóa sau login.
- [ ] **T5-09** Chuẩn bị tối thiểu 30 ca đánh giá gắn điều kiện/đáp án kỳ vọng; bao gồm không có kết quả, ngân sách, dị ứng thiếu dữ liệu và prompt yêu cầu đổi giá/quyền.
- [ ] **T5-10** Chạy AC-17/18/19 và test đồng thời/timeouts; báo độ đúng điều kiện, thời gian và chi phí đo được, ghi model/config.

**Điều kiện qua mốc:** món gợi ý tồn tại, tổng giá đúng bộ tính, thiếu dữ liệu được nêu rõ; AI lỗi vẫn đặt bằng thực đơn được. Không gọi demo echo/món hardcode là tích hợp AI hoàn tất. **Mốc:** M5.

## 10. Giai đoạn 6 — hoàn thiện trải nghiệm cuộn và nội dung

**Phụ thuộc:** prototype T0 và API nội dung/catalog. Có thể chạy song song các giai đoạn 3–5 trên phần frontend ít xung đột. **Đầu ra:** trang chủ có câu chuyện, chuyển động và điểm đặt món hoạt động.

- [ ] **T6-01** Chốt ảnh/phông chữ có nguồn và chất lượng; tối ưu AS-01–07 và lập manifest asset/fallback.
- [ ] **T6-02** Hoàn thiện hero đỏ son/typography nhiều lớp theo SCR-01, fallback tĩnh khi JS/ảnh lỗi.
- [ ] **T6-03** Làm cầu nối hero→phở, timeline p=0–1, scrub/pin và đoạn nghỉ đọc/CTA theo tài liệu 02.
- [ ] **T6-04** Làm chương bánh mì, tách lớp chỉ khi asset thực đáp ứng; ghi giới hạn nếu dùng fallback nguyên ổ.
- [ ] **T6-05** Làm chương cơm và chuyển sang thực đơn/AI, giữ đường đặt nhanh trên header.
- [ ] **T6-06** Nối story_sections, trạng thái/giá và đúng dishId; CTA mở cấu hình thật, món hết không mua được.
- [ ] **T6-07** Hoàn thiện SCR-30 preview desktop/mobile/reduced motion, preset và xuất bản nội dung.
- [ ] **T6-08** Kiểm resize, back/forward, đổi route, cuộn nhanh/ngược, dialog và cleanup để không trùng pin spacer.
- [ ] **T6-09** Đo asset tải đầu, frame time/fps và tác động layout; điều chỉnh theo thiết bị thật, không chỉ máy phát triển.
- [ ] **T6-10** Chạy AC-20/21, kiểm bàn phím/focus/tương phản/mobile, lưu video/profile và danh sách nội dung đã chốt.

**Điều kiện qua mốc:** khách vẫn tìm/đặt được khi giảm chuyển động, CTA xuyên suốt đúng món, có bằng chứng desktop/mobile. **Mốc:** M6.

## 11. Giai đoạn 7 — tích hợp, vận hành thử và bàn giao

**Phụ thuộc:** các mốc chức năng. **Đầu ra:** bản demo chạy được và bằng chứng nghiệm thu.

- [ ] **T7-01** Chạy đủ AC-01–23; ghi kết quả pass/fail/block và issue, không thay bằng số lượng test đã viết.
- [ ] **T7-02** Chạy test cạnh tranh và retry trên MySQL thật: checkout, lượt coupon, status, IPN và refund.
- [ ] **T7-03** Chạy smoke Playwright trên các luồng khách/tiếp nhận/bếp/admin; dùng role fixtures riêng.
- [ ] **T7-04** Kiểm DTO/Swagger/contract frontend so với API-01–92; chỉ tính endpoint đã triển khai, cập nhật phần P2 nếu hoãn.
- [ ] **T7-05** Thử mạng chậm/ngắt, AI lỗi, SSE mất và callback trễ; giữ đúng đơn/tiền và thông báo.
- [ ] **T7-06** Kiểm log/secret/upload/ownership; loại credential và dữ liệu thật khỏi seed, hình minh họa, mã nguồn bàn giao.
- [ ] **T7-07** Build Docker production, reverse proxy HTTPS, volume, healthcheck và tắt port database public.
- [ ] **T7-08** Sao lưu MySQL+ảnh, phục hồi trên môi trường riêng và chạy smoke sau restore; ghi thời điểm/môi trường thực.
- [ ] **T7-09** Hoàn thiện README, .env.example, migration/seed, hướng dẫn vai trò, hạn chế và kịch bản demo.
- [ ] **T7-10** Đóng lỗi nghiêm trọng, chốt phiên bản/tag, tổng hợp bằng chứng, xác nhận M7 theo phạm vi đã cam kết.

Triển khai public hoặc thanh toán thật là bước riêng theo quyền chủ dự án; staging/sandbox và gói build có thể được chuẩn bị trước để duyệt.

## 12. Giai đoạn 8 — phần mở rộng có điều kiện

Những đầu việc này không phải điều kiện của M7 trừ khi đã cam kết trong phạm vi. Không bắt đầu chỉ để tăng số tính năng khi P1 còn lỗi.

- [ ] **T8-01** Hoàn thiện favorite FR-27 nếu chưa làm, kiểm quyền và trạng thái món đã lưu.
- [ ] **T8-02** Hoàn thiện dashboard tương tác FR-28 bằng số liệu thực đã có, phân biệt impression/click/add-to-cart.
- [ ] **T8-03** Thiết kế attribution từ gợi ý qua giỏ đến order_items trước khi báo conversion mua theo từng gợi ý.
- [ ] **T8-04** Đánh giá cần cột/index requestKey riêng cho AI/commands khi khối lượng vượt giới hạn prototype.
- [ ] **T8-05** Đánh giá queue email/outbox khi cần gửi bền vững; ghi tiêu chí kích hoạt thay vì cài trước.
- [ ] **T8-06** Đánh giá pub/sub/limiter chia sẻ khi tăng nhiều backend instance; có test nhất quán trước scale.
- [ ] **T8-07** Đề xuất quản lý suất theo ngày/kho chỉ khi có yêu cầu, dữ liệu và nghiệp vụ bổ sung.
- [ ] **T8-08** Đề xuất lịch đặt trước/nhiều chi nhánh chỉ sau khi phân tích trạng thái và dữ liệu liên quan.
- [ ] **T8-09** Thử 3D nếu ảnh 2D không thể đạt ý đồ hình ảnh và ngân sách hiệu năng cho phép.
- [ ] **T8-10** Ghi quyết định triển khai/hoãn từng mở rộng cùng lý do, tác động và tài liệu cần sửa.

## 13. Phụ thuộc và phân bổ thời gian tham khảo

Nếu một người thực hiện, khoảng 8–12 tuần là khung lập kế hoạch tham khảo, phụ thuộc kinh nghiệm, asset, thời gian học và quyền truy cập dịch vụ; không phải cam kết đã ước lượng từ tốc độ làm việc thực tế.

| Chặng | Phần việc | Khoảng thời gian tham khảo | Có thể chuẩn bị song song |
|---|---|---|---|
| A | T0 + T1 | 1–2 tuần | Ảnh, storyboard, đăng ký sandbox |
| B | T2 | 1–1,5 tuần | UI component, nội dung món |
| C | T3 | 1,5–2 tuần | Animation dựa mock đã chốt contract |
| D | T4 | 1–1,5 tuần | Dataset AI và thực đơn xác minh |
| E | T5 | 1–1,5 tuần | Hoàn thiện asset/story |
| F | T6 | 1–1,5 tuần | Có thể bắt đầu sớm và tích hợp dần |
| G | T7 | 1–2 tuần | Tài liệu demo, phân tích kết quả |

Tổng không cộng máy móc khi công việc gối nhau. Cập nhật ước lượng sau M1 và M3 bằng thời gian thực đã dùng. Không ấn định ngày lịch khi chưa biết hạn nộp.

Khi có nhiều người làm, chốt hợp đồng API trước, một người chịu trách nhiệm mỗi migration và tránh sửa cùng file hợp đồng trong cùng thời điểm. Việc phân công thực tế điền vào sổ theo dõi; tài liệu không tự tạo tác vụ hoặc gửi lời mời cho người khác.

## 14. Dữ liệu mẫu và ma trận kiểm tra

| Nhóm | Bộ mẫu cần có |
|---|---|
| Tài khoản | Mỗi role, khách thứ hai để test chéo, tài khoản LOCKED, phiên hết hạn |
| Thực đơn | Phở/bánh mì/cơm/đồ uống, nhiều biến thể, nhóm bắt buộc/tùy chọn, sold-out/hidden |
| Thành phần | VERIFIED/PARTIAL/UNKNOWN, thành phần bị tránh, trường hợp không xác minh dị ứng |
| Giỏ | Cấu hình giống/khác ghi chú, số lượng biên, option của món khác, giá thay đổi |
| Ưu đãi | Fixed/percent/free-shipping, hết hạn, thiếu ngưỡng, hết lượt, lượt cuối |
| Đơn | Giao/nhận tại quán, mỗi trạng thái, total 0 hợp lệ, hủy trước/sau xác nhận |
| Tiền | COD, pending/failed/success, callback lặp/trễ, thu thừa, hoàn một phần và hoàn lỗi |
| AI | Khách mới/cũ, consent on/off, yêu cầu ngân sách/khẩu vị, thiếu dữ liệu, timeout |
| Nội dung | Phân cảnh draft/published, ảnh thiếu, món hết/ẩn, reduced motion |

Không dùng tài khoản hoặc thông tin thanh toán thật để tạo fixture. Mỗi test liên quan tiền phải nêu đơn vị và trạng thái gốc.

### 14.1. Liên kết nghiệm thu với nhóm việc

| Tiêu chí | Nhóm việc chịu trách nhiệm | Bằng chứng tối thiểu |
|---|---|---|
| AC-01/02 | T1-07–10 | Test quyền/token và response đã giảm dữ liệu |
| AC-03/21 | T2-02/08/10, T6-06 | Test cấu hình khác món và CTA đúng dữ liệu |
| AC-04/05/06/08 | T3-02–05 | Test quote, tổng tiền, điều kiện và retry |
| AC-07 | T4-01/02 | Test đồng thời giữ lượt cuối |
| AC-09/10/11/14 | T4-03–06 | Test IPN/refund, log/trạng thái đối chiếu |
| AC-12/13 | T3-06–09 | Test role/state/COD |
| AC-15/16 | T4-08, T7-01 | Đơn cũ giữ giá, đặt lại giá mới, review đúng chủ |
| AC-17/18/19 | T5-01–10 | Bộ ca AI và kết quả consent |
| AC-20 | T0-07/08, T6-08–10 | Video/profile desktop/mobile/reduced motion |
| AC-22 | T4-09 | Bộ số liệu có nhiều payment/refund, tổng độc lập |
| AC-23 | T3-10, T7-05 | Ngắt/reconnect và GET snapshot |

## 15. Definition of Done và báo cáo tiến độ

Một đầu việc DONE khi: đáp ứng yêu cầu liên quan; validation/role/error đầy đủ; test phù hợp đã chạy; không dùng dữ liệu giả thay tích hợp đã hứa; docs/migration cập nhật; không đưa secret vào mã; có commit và bằng chứng. Việc tạo tài liệu hoặc sinh code chỉ là một phần của đầu việc.

Các lỗi chặn bàn giao: truy cập chéo dữ liệu, tính sai tiền, tạo/thu/hoàn trùng, chuyển trạng thái trái phép, đơn mất sau tạo, AI bịa món được mua, hoặc thao tác chính không dùng được trên mobile. Lỗi thẩm mỹ nhỏ có thể ghi backlog nếu không vi phạm tiêu chí giao diện trọng tâm.

Mẫu báo cáo cuối mỗi mốc:

| Nội dung | Cách ghi |
|---|---|
| Đã xong | Mã T, kết quả quan sát được, commit và bằng chứng |
| Chưa xong | Mã T và phần còn thiếu, không ghi chung “đang tối ưu” |
| Đang bị chặn | Credential/asset/quyết định nào thiếu, việc bị ảnh hưởng |
| Chất lượng | AC pass/fail/block và lỗi nghiêm trọng còn mở |
| Tiếp theo | 3–5 đầu việc cụ thể theo phụ thuộc |
| Thay đổi | Quy tắc/contract/schema nào đổi và tài liệu đã cập nhật |

## 16. Kiểm soát thay đổi và bàn giao

Thay đổi nghiệp vụ cập nhật tài liệu gốc và mã FR/BR/AC liên quan; thay API cập nhật DTO/Swagger/UI; thay schema thêm migration có kiểm tra dữ liệu cũ; thay animation cập nhật timeline/storyboard và profile nếu ảnh hưởng hiệu năng.

Gói bàn giao đồ án cần mã nguồn/lockfile, migration/seed, README cấu hình, bản build hoặc môi trường demo đã cho phép, bộ 6 tài liệu, kết quả test, asset có nguồn và kịch bản trình diễn theo vai trò. Các phần sandbox, giả lập, thủ công và chưa hỗ trợ phải được ghi rõ.

Bắt đầu thực hiện từ T0/T1, đồng thời thử cảnh phở sớm theo T0-07. Luồng chức năng đầu tiên cần hoàn thành là đặt COD qua tiếp nhận, bếp và bàn giao; đó là nền để bổ sung thanh toán và AI mà không mất tính thống nhất nghiệp vụ.
