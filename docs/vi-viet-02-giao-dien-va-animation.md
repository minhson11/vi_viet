# VỊ VIỆT — ĐẶC TẢ GIAO DIỆN, LUỒNG THAO TÁC VÀ ANIMATION

Phiên bản 1.0 · Hoàn thiện ngày 04/11/2026 · Tài liệu thực thi thiết kế, chưa phải giao diện đã được dựng hoặc duyệt hình ảnh.

## 1. Mục tiêu và tài liệu liên quan

Bám FR-01 đến FR-28 và AC của tài liệu nghiệp vụ. Kiến trúc và trách nhiệm frontend/backend xem tài liệu 01; tên endpoint và dữ liệu xem tài liệu 03; công việc kiểm chứng xem tài liệu 04.

Hai mục tiêu song hành: tạo hành trình ẩm thực có hình ảnh/chuyển động mạnh, và hoàn thành đặt món bằng ít bước rõ ràng. Phần khám phá có thể giàu chuyển động; giỏ, checkout và nghiệp vụ nhân viên tập trung độ rõ và phản hồi thao tác.

Thông tin tên thương hiệu, câu chuyện và giá trong mockup là nội dung mẫu. Giá bán hiển thị thực tế luôn từ API. Đây là hướng art direction đã chọn để triển khai thử, không phải kết quả người dùng đã chấm duyệt.

## 2. Design system ban đầu

| Token | Giá trị/định hướng | Sử dụng |
|---|---|---|
| brand-red | #B72E24 | Hero, CTA chính |
| cream | #FFF3DC | Nền/typography tương phản |
| ink | #201713 | Chữ/nền tối |
| herb | #405B42 | Chương cơm và điểm nhấn |
| turmeric | #E6AD36 | Chương bánh mì |
| danger/success | Màu ngữ nghĩa riêng, kiểm tra tương phản | Lỗi/thành công, không chỉ dựa vào màu |
| display | Serif đậm hỗ trợ tiếng Việt, ví dụ Noto Serif | Tiêu đề lớn; kiểm font thực trước chốt |
| body | Sans-serif hỗ trợ tiếng Việt, ví dụ Be Vietnam Pro | Form, giá, thao tác |
| spacing | Bội 4px: 4,8,12,16,24,32,48,64,96 | Khoảng cách nhất quán |
| radius | 12px control, 20px card, pill cho chip | Bo góc theo vai trò |
| content width | Tối đa khoảng 1280px, gutter 24–64px | Trang thao tác |
| display size | clamp 64–180px desktop, 44–76px mobile | Không ép một cỡ cho tất cả tiêu đề |
| text size | Nội dung 16–18px, caption tối thiểu 12px | Đọc rõ; form mobile tối thiểu 16px |

Desktop tham chiếu 1440×900, mobile 390×844. Breakpoint bố cục đề xuất 768px và 1024px. Từ 768 đến 1023 dùng bố cục dọc tương tự mobile, không cố pin nhiều lớp. Chốt font có dấu đầy đủ, tự host khi triển khai nếu phù hợp quyền sử dụng.

Ảnh chân thực, ánh sáng ấm, có bóng đổ mềm và khoảng trống cho chữ. Một món là điểm nhìn chính; nguyên liệu trang trí tối đa 3–5 lớp. Kiểm tra tương phản trên ảnh và khi nền đang chuyển màu, không chỉ ảnh chụp cuối cảnh.

## 3. Điều hướng và thành phần chung

Header: logo, Khám phá, Thực đơn, Câu chuyện, Tư vấn AI, tài khoản, giỏ và Đặt món. Khi cuộn, header gọn nhưng giữ đường vào thực đơn. Mobile dùng thanh dưới Trang chủ/Thực đơn/AI/Giỏ/Tài khoản; không che nút sticky của sheet hoặc bàn phím.

Thành phần dùng chung: Button 4 trạng thái, input/textarea, dropdown, radio, checkbox, filter chip, badge, dish card, quantity stepper, price summary, alert, toast, skeleton, empty/error state, dialog/drawer, pagination và status timeline.

Dialog có focus trap, Escape, nút đóng, trả focus về nút mở và khóa nền đúng cách. Toast không phải nơi duy nhất báo lỗi thanh toán. Nút có spinner giữ kích thước và nhãn tiến trình; không khóa toàn trang vì một thao tác tải ảnh.

## 4. Bản đồ màn hình

Các ký hiệu SCR là mã màn hình, dùng trong kế hoạch và kiểm thử.

| Mã | Route dự kiến | Nội dung/hành động | Vai trò |
|---|---|---|---|
| SCR-01 | `/` | Hero, các chương món, lối thực đơn, AI | Công khai |
| SCR-02 | `/thuc-don` | Tìm, lọc, phân trang, chọn món | Công khai |
| SCR-03 | `/mon/[slug]` | Thông tin, thành phần, đánh giá, mở chọn món | Công khai |
| SCR-04 | Dialog/sheet chọn món | Biến thể, options, số lượng, ghi chú | Công khai |
| SCR-05 | `/gio-hang` | Sửa/xóa, tạm tính, đi checkout | Công khai/giỏ riêng sau login |
| SCR-06 | `/thanh-toan` | Nhận hàng, coupon, quote và xác nhận | CUSTOMER |
| SCR-07 | `/thanh-toan/ket-qua` | Chờ xác minh/thất bại/thành công, xem đơn | Chủ đơn |
| SCR-08 | `/tai-khoan/don-hang/[orderCode]` | Timeline, tiền, hỗ trợ/hủy | Chủ đơn |
| SCR-09 | `/tu-van` | Hội thoại, gợi ý, chuyển lựa chọn sang giỏ | Công khai/phiên riêng |
| SCR-10 | `/dang-nhap` | Đăng nhập, tiếp tục đường dẫn hợp lệ | Công khai |
| SCR-11 | `/dang-ky` | Tạo tài khoản | Công khai |
| SCR-12 | `/quen-mat-khau` | Gửi email reset, thông báo chung | Công khai |
| SCR-13 | `/dat-lai-mat-khau` | Nhập mật khẩu mới qua token, token không lưu log | Chủ token |
| SCR-14 | `/xac-minh-email` | Xác minh, hết hạn, gửi lại | Chủ token |
| SCR-15 | `/tai-khoan` | Hồ sơ, đổi mật khẩu, đăng xuất | Đã đăng nhập |
| SCR-16 | `/tai-khoan/dia-chi` | Thêm/sửa/xóa mềm, mặc định | Chủ dữ liệu |
| SCR-17 | `/tai-khoan/so-thich` | Khẩu vị, thành phần tránh, đồng ý hành vi | Chủ dữ liệu |
| SCR-18 | `/tai-khoan/don-hang` | Lịch sử, lọc, đặt lại | CUSTOMER |
| SCR-19 | Dialog đánh giá | Rating, nhận xét, gửi/sửa | Chủ dòng đơn hoàn thành |
| SCR-20 | `/tai-khoan/yeu-thich` | Món lưu, bỏ yêu thích | CUSTOMER, P2 |
| SCR-21 | `/staff/orders` | Hàng chờ, lọc, đơn cần xử lý | OPERATOR/ADMIN |
| SCR-22 | `/staff/orders/[id]` | Chi tiết, command, COD, sự cố | OPERATOR/ADMIN |
| SCR-23 | `/staff/kitchen` | Thẻ chế biến, ghi chú, bắt đầu/xong | KITCHEN/ADMIN |
| SCR-24 | `/admin` | Chỉ tiêu tổng quan và đơn cần chú ý | ADMIN |
| SCR-25 | `/admin/menu` | Danh mục, món, active/hết | ADMIN |
| SCR-26 | `/admin/menu/[id]` | Form aggregate món/biến thể/options/ảnh | ADMIN |
| SCR-27 | `/admin/promotions` | Coupon, điều kiện, thời hạn, giới hạn | ADMIN |
| SCR-28 | `/admin/customers` | Tra khách và lịch sử theo quyền | ADMIN |
| SCR-29 | `/admin/reviews` | Phản hồi và kiểm duyệt có lý do | ADMIN |
| SCR-30 | `/admin/content` | Chương món, ảnh, preset, thứ tự, preview | ADMIN |
| SCR-31 | `/admin/reports` | Kỳ, số đơn, thu/hoàn, món bán | ADMIN |
| SCR-32 | `/admin/staff` | Nhân viên, role, trạng thái | ADMIN |
| SCR-33 | `/admin/settings` | Thông tin quán, lịch, vùng/phí và timeout | ADMIN |
| SCR-34 | `/admin/payments` | Đối soát, khoản thu thừa và hoàn | ADMIN |

Các route có quyền sai không render nội dung riêng rồi mới ẩn; backend luôn kiểm tra độc lập. Dùng GET by-code cho route đơn công khai về tên nhưng riêng về quyền.

## 5. Trang chủ và cấu trúc kể chuyện

### 5.1. Hero

Nền đỏ son; typography kem “CHẠM VỊ / VIỆT NAM”, bát phở lớn xen trước/sau chữ, 3 lớp nguyên liệu có kiểm soát. Bát chiếm khoảng 55–65% chiều rộng desktop, không che header hoặc CTA. Nội dung phụ một câu và nút Khám phá/Xem thực đơn. Hero cao khoảng một viewport; dùng đơn vị viewport ổn định phù hợp mobile.

Intro tự chạy 0,8–1,2 giây sau khi ảnh chủ đạo sẵn sàng: chữ vào lệch nhịp 100ms, bát nhẹ nhàng vào vị trí, nguyên liệu theo sau. Không chờ tất cả ảnh dưới trang; nếu asset chủ đạo lỗi, nền và CTA vẫn đầy đủ.

### 5.2. Phở, bánh mì, cơm

- Phở: kem, chữ nền PHỞ, bát từ trái vào, câu chuyện “Ấm một bát, nhớ một miền.”, giá hiện hành và chọn món.
- Bánh mì: vàng, bố cục chéo, “Giòn tan. Đậm chất phố.”, các lớp nhân tách nhẹ rồi ghép lại nếu đã có asset phù hợp.
- Cơm: xanh thảo mộc, đĩa đi từ dưới, “Đi xa mấy. Vẫn nhớ bữa cơm.”, nhịp chậm hơn để nghỉ thị giác.
- Sau đó chuyển thực đơn nổi bật, khu gợi ý/AI và footer thông tin quán.

Chữ quảng bá không khẳng định nguồn gốc, thời gian ninh hay giá trị dinh dưỡng khi cửa hàng chưa cung cấp. Giá mockup không hardcode. Khi món hết, CTA đổi trạng thái và vẫn có “Xem thực đơn khác”.

## 6. Hợp đồng animation chung

Tất cả tọa độ dưới đây là giá trị khởi đầu để dựng prototype và đo, không phải giá trị đã thử trên mọi viewport. `p` là tiến độ chuẩn hóa 0–1 của phân cảnh; x/y là transform của container ảnh so với tâm sân khấu. Rotation là xoay mặt phẳng, không mô phỏng bát đổ hoặc xoay 3D.

| Thuộc tính | Desktop >=1024px | Mobile/tablet <1024px |
|---|---|---|
| Cuộn | Native scroll; không hijack wheel | Native touch scroll |
| Phở | Pin khoảng 220–260vh khoảng cuộn, sân khấu 100svh | Không pin; section dọc, reveal theo vùng nhìn |
| Bánh mì | Pin khoảng 160–200vh khi đủ asset | Reveal ngắn, không tách lớp phức tạp |
| Cơm | Reveal trên khoảng 100–130vh, không bắt buộc pin | Reveal nhẹ |
| Scrub | Numeric scrub đề xuất 0,4–0,7s | Reveal 250–450ms hoặc scrub ngắn |
| Easing | Đường chính theo scroll dùng tuyến tính; reveal nội cảnh có ease nhẹ | Ease nhẹ, tránh bounce |
| Chuyển động lặp | Hơi nóng nhẹ, dừng khi ngoài viewport | Tắt hoặc giảm |
| Reduced motion | Không pin/rotation/parallax, hiển thị nội dung tĩnh | Tương tự |

Không dùng snap bắt buộc giữa mọi cảnh. Khi click Xem thực đơn, điều hướng/scroll đến vùng đích có trừ header; reduced motion dùng chuyển ngay. Mở giỏ/dialog không được reset tiến độ hoặc tạo animation mới trùng.

### 6.1. Timeline phở

| Khoảng p | Hình món | Typography/nội dung | Tương tác |
|---|---|---|---|
| 0–0,18 | x: -70vw → -18vw; rotation: -24° → -5°; scale 0,88 → 1 | PHỞ đi nền chậm; nhãn chương hiện | CTA thực đơn trên header luôn có |
| 0,18–0,38 | x: -18vw → -22vw; rotation → 0° | Tiêu đề hai dòng reveal, mỗi dòng lệch khoảng 0,04p | Không có lớp vô hình chặn trỏ |
| 0,38–0,64 | Giữ vị trí, ảnh khoảng 48vw | Đoạn ngắn và ba điểm hương vị hiện tuần tự | Dừng đọc, nội dung không thay quá nhanh |
| 0,64–0,82 | scale 1 → 0,86; x → -25vw | Tên/giá/CTA hiện ổn định | Chọn món mở SCR-04 |
| 0,82–1 | Bát dịch ra mép và opacity về 0 khi không còn nội dung | Nền chuyển về vàng, tiêu đề bánh mì bắt đầu | CTA phở chỉ mất khi cảnh rời |

Chỉ giới hạn các transform trên container ảnh, không làm bát méo. Bóng ở lớp riêng nhưng cùng transform cha. Không xoay 360° ảnh tĩnh để thay mô hình 3D. Cuộn ngược tái hiện timeline cùng vị trí, không kích hoạt intro lại.

### 6.2. Cầu nối hero → phở

Hai section dùng cùng asset master. Cuối hero, bát đi về mép trái; đầu chương phở xuất hiện từ vị trí khớp. Có thể dùng hai instance ảnh và crossfade tại vùng nối; không reparent DOM đang pin chỉ để giữ “một phần tử”. Đảm bảo không thấy hai bát đồng thời hoặc nhảy tỷ lệ. Nền đỏ → kem được che bởi shape mask nhẹ; nếu mask gây giật thì đổi màu nền/crossfade thuần.

### 6.3. Timeline bánh mì

| Khoảng p | Hình món | Nội dung |
|---|---|---|
| 0–0,25 | Ổ từ x +65vw vào x +18vw, xoay -12° về -6° | Chữ lớn bên trái |
| 0,25–0,55 | Lớp vỏ/nhân/rau tách tối đa 24–64px, giữ trục nhìn | Nhãn thành phần xuất hiện, không che món |
| 0,55–0,75 | Các lớp ghép lại đúng vị trí | Đoạn giới thiệu ngắn |
| 0,75–1 | Ổ ổn định, thu nhẹ | Giá và CTA; chuyển sang xanh |

Nếu chưa có ảnh tách lớp cùng góc chụp, dùng ổ nguyên và chuyển động nhỏ; không bịa các lớp ảnh không khớp. Đây là fallback thiết kế, không đánh dấu hoàn thành “tách lớp” nếu chỉ có ảnh nguyên.

### 6.4. Nhịp cơm và chuyển sang thực đơn

Đĩa cơm y 80px → 0, scale 0,94 → 1; title và nội dung hiện cách nhau 100ms. Sau đoạn nghỉ, các thẻ thực đơn xuất hiện theo hàng với stagger tối đa 60ms/thẻ. Không biến toàn bộ thực đơn thành scroll pinned; khách phải lọc và chọn món ngay được.

### 6.5. Cleanup, resize và lỗi

- GSAP context/useGSAP hoặc cơ chế cleanup tương đương, scope theo component; revert khi unmount và đổi breakpoint.
- Tính lại điểm bắt đầu/kết thúc sau ảnh/font sẵn sàng, tránh refresh mỗi frame.
- Khi quay về từ route chi tiết, phục hồi vị trí cuộn khi phù hợp, không tạo pin spacer trùng.
- Reduced motion đọc theo media preference, có thể thêm tùy chọn trong UI; không giấu toàn bộ nội dung vì animation bị tắt.
- Không animate width/height/layout trên mỗi scroll frame khi có thể dùng transform/opacity. Không để React setState từng frame chỉ để kéo ảnh.

## 7. Asset cần chuẩn bị

| Mã | Asset | Yêu cầu ban đầu | Fallback |
|---|---|---|---|
| AS-01 | Bát phở master | PNG/WebP alpha, 1600–2000px, góc cao, bát không cắt mép | Ảnh cover với nền phẳng |
| AS-02 | Chanh/rau/ớt | Cùng ánh sáng và góc nhìn, 3 ảnh tách | Bỏ trang trí |
| AS-03 | Bánh mì nguyên | Ảnh alpha đủ toàn ổ, shadow tách hoặc đồng nhất | Ảnh cover |
| AS-04 | Bánh mì các lớp | 3–4 lớp đồng góc, khớp silhouette | Dùng AS-03, không tách lớp |
| AS-05 | Đĩa cơm | Ảnh alpha chất lượng tương đương | Cover |
| AS-06 | Thumbnail thực đơn | Tỷ lệ 4:3 nhất quán, 640–960px | Placeholder có alt |
| AS-07 | Font/logo | Đủ dấu, quyền sử dụng rõ, logo SVG chỉ từ nguồn dự án tin cậy | Chữ thương hiệu |

Mục tiêu tối ưu đề xuất: asset chủ đạo đã nén dưới khoảng 600 KB nếu chất lượng cho phép, tổng tải đầu trang dưới khoảng 1,5 MB; không preload ảnh mọi chương. Các số là budget kiểm thử, cần báo cáo kết quả thực. Ảnh từ công cụ tạo ảnh phải kiểm hình món, nguồn và quyền trước dùng thật; chưa tạo asset trong bộ tài liệu này.

## 8. Đặc tả luồng chọn món và đặt hàng

### 8.1. SCR-02/03/04 — thực đơn và chọn món

Lọc đồng bộ URL (q/category/minPrice/maxPrice/tags), có xóa tất cả; không tự lọc thuộc tính chưa có dữ liệu. Card có ảnh, tên, giá từ biến thể active, trạng thái và nút chọn. Món hết không cho thêm mới nhưng có thể xem thông tin.

SCR-04 desktop là dialog tối đa khoảng 720px, mobile bottom sheet có vùng cuộn riêng. Radio biến thể bắt buộc; options nhóm min/max hiển thị điều kiện; thêm topping cho thấy giá. Quantity 1–99. Nút sticky “Thêm vào giỏ — [tiền]” không che lỗi. Thành phần chưa xác minh có nhãn phù hợp.

Frontend tính tạm để phản hồi nhanh, backend kiểm lại. Khi thành công cập nhật badge giỏ và toast; không tự chuyển checkout. Khi lỗi món hết giữ lựa chọn và nêu việc cần sửa.

### 8.2. SCR-05 — giỏ

Mỗi dòng có tên/ảnh, biến thể, options, ghi chú, số lượng, sửa/xóa. Tổng là tiền món hiện tại, chưa coi là giá cam kết. Dòng lỗi hiển thị lý do và hành động thay/bỏ. Khách chưa login đi checkout được chuyển đăng nhập rồi quay lại giỏ; không mất bản cục bộ trước khi xác nhận đồng bộ thành công.

Đồng bộ giỏ sau login dùng PUT snapshot sau bước hợp nhất do client trình bày; server kiểm tra, trả dòng đã nhận và lỗi. Không tự replay import có thể cộng số lượng nhiều lần. Đặt lại đơn cũ mở bản xem trước với giá/tình trạng mới, không tạo đơn ngay.

### 8.3. SCR-06 — checkout

Desktop hai cột: nhận hàng bên trái, tóm tắt bên phải; mobile một cột. Lựa chọn giao/nhận đổi trường bắt buộc và phí. Người nhận có tên, điện thoại; giao cần địa chỉ đầy đủ và chọn vùng giao trong danh sách quán. Không hiển thị map hoặc dự đoán vị trí khi chưa có tích hợp.

Coupon ở checkout, trạng thái rõ có/không áp. Hiển thị subtotal, giảm món, phí giao, giảm phí, total. Nhận quote từ server trước xác nhận; thay lựa chọn, địa chỉ, phương thức hoặc coupon thì quote cũ hết giá trị.

| Trạng thái | UI |
|---|---|
| Chưa đủ dữ liệu | Đánh dấu trường cần nhập, không gọi tạo đơn |
| Đang quote | Spinner trong tổng tiền, giữ form |
| Quote hợp lệ | Hiển thị giá cuối và nút xác nhận |
| Quote hết hạn | Nút cập nhật giá; không tự đặt |
| Giá/điều kiện đổi | Dialog so sánh phần thay đổi, khách xác nhận lại |
| Đang tạo đơn | Khóa nút gửi, giữ Idempotency-Key |
| Mất mạng sau gửi | Cho kiểm tra/gửi lại cùng key, không khuyên tạo đơn khác ngay |

### 8.4. SCR-07/08 — kết quả và theo dõi

Redirect từ đối tác chỉ hiện “Đang xác minh” trước khi GET trả kết quả. Không lấy thông báo success từ query làm bằng chứng thu. Hiện mã đơn, tiền đã xác minh, nút xem đơn/thử lại khi đủ điều kiện.

Timeline lấy trạng thái thực và timestamp. Nhận tại quán không có bước đang giao. Hiện riêng thanh toán, hủy và hoàn. Không có progress timer tự hoàn thành đơn. SSE làm tín hiệu refetch; mất kết nối có nhãn nhẹ và nút tải lại, không báo đơn thất bại.

Hủy tự động chỉ khi đủ điều kiện; còn lại nút “Yêu cầu hủy”, form lý do, hiển thị đang chờ xử lý theo event. Không viết “Đã hủy” khi mới gửi yêu cầu.

## 9. Tư vấn AI và sở thích

SCR-09 có câu hỏi gợi ý, hội thoại và card phương án. Dữ liệu card gồm tên, biến thể nếu đã xác định, số phần, tùy chọn, giá và lý do. Nêu rõ phí giao đã/chưa tính. Đang phản hồi có trạng thái ngay; timeout vẫn giữ câu hỏi và cho thử lại.

CTA gợi ý mở bảng xem/chọn cấu hình trước khi thêm giỏ nếu chưa đủ thông tin. Không làm nút “Đặt ngay” thực hiện thanh toán trực tiếp từ câu trả lời. Không có phương án thì hiển thị điều kiện chưa đáp ứng và đề nghị điều chỉnh có xác nhận.

SCR-17 tách “Tôi chủ động cung cấp” và “Cho phép dùng lịch sử/tương tác”. Điều kiện thành phần tránh có lý do do khách khai báo; không gắn nhãn AI biết tình trạng sức khỏe. Toggle cá nhân hóa có giải thích tác dụng; tắt phải có phản hồi thành công và không bị tự bật lại sau login.

## 10. Giao diện nhân viên và quản trị

### 10.1. Tiếp nhận/bếp

SCR-21 dùng tab trạng thái, lọc mã/ngày, thứ tự chờ rõ. SCR-22 hiển thị bản chụp đơn và các command hợp lệ, không dropdown tùy ý mọi trạng thái. Hủy/từ chối có form lý do. Thu COD có tiền cần thu và bước xác nhận rõ, không gắn vào thao tác hoàn thành một cách ngầm định.

SCR-23 tối ưu đọc từ xa: mã, thời gian chờ, số lượng lớn, biến thể/topping/ghi chú. Bếp không thấy dữ liệu thanh toán hoặc địa chỉ không cần thiết. Báo hết món là thao tác nhanh; thay giá chỉ ADMIN. Nếu 409 do màn hình cũ thì tải snapshot mới và yêu cầu người dùng xem lại.

### 10.2. Quản trị catalog và nội dung

Form SCR-26 nhóm: thông tin chung, biến thể, options, thành phần, ảnh. Tối thiểu một biến thể active trước mở bán. Cấu hình đã được đơn tham chiếu chỉ ngừng hoạt động; không xóa cứng. Gửi expectedUpdatedAt để báo xung đột chỉnh sửa.

SCR-30 có danh sách thứ tự, editor nội dung và preview. Dropdown preset 4 loại, color picker có mã hex, chọn ảnh đúng món. Thay đổi chưa lưu có cảnh báo rời trang. Preview reduced motion và mobile. Hiển thị trạng thái draft/published từ isPublished; không xây hệ version nội dung mới ngoài phạm vi.

### 10.3. Tiền, báo cáo và cài đặt

SCR-34 phân biệt payment attempt, khoản đã thu, hoàn đang xử lý, khoản thu thừa. Hoàn tiền cần paymentId, số tiền, lý do, xác nhận và kết quả đối soát. Không có nút success giả trong demo tích hợp.

SCR-31 ghi nhãn rõ kỳ/thời điểm chốt, giá trị đơn hoàn thành, tiền thu, tiền hoàn, dòng tiền thuần; không nhãn lợi nhuận. SCR-33 cấu hình giờ, các ca, ngày nghỉ, vùng/phí và công tắc nhận đơn có xác nhận; không cho nhập API key ở form cửa hàng.

## 11. Chuẩn trạng thái và thông báo

| Tình huống | Mẫu thông báo | Hành động |
|---|---|---|
| Không có món theo lọc | “Chưa có món đáp ứng các lựa chọn này.” | Bỏ lọc/đổi điều kiện |
| Món hết khi checkout | “Phở bò vừa tạm hết. Hãy điều chỉnh giỏ.” | Đổi/bỏ món |
| Giá đổi | “Giá đơn đã thay đổi. Vui lòng xem lại trước khi đặt.” | Xem chênh lệch |
| Coupon hết lượt | “Mã này không còn lượt sử dụng.” | Bỏ/đổi mã |
| AI thiếu thành phần | “Cửa hàng chưa có đủ dữ liệu để xác nhận điều kiện này.” | Hỏi cửa hàng/đổi lựa chọn |
| Request bị trùng khác nội dung | “Yêu cầu đặt đã thay đổi. Hãy kiểm tra đơn trước khi tiếp tục.” | Xem đơn/gửi mới có chủ đích |
| Không đủ quyền | “Bạn không có quyền thực hiện thao tác này.” | Quay lại khu vực phù hợp |
| Lỗi không xác định | “Chưa thể hoàn tất. Mã hỗ trợ: [requestId].” | Thử lại an toàn |

## 12. Nghiệm thu giao diện và chuyển động

- AC-20/21: phân cảnh đọc được, giá/trạng thái đúng, CTA chọn đúng dishId; giảm chuyển động không mất nội dung.
- AC-04/08: khi quote đổi, có so sánh và xác nhận lại; giá tạm không được hiển thị như giá đã chốt.
- AC-09/23: redirect không giả success; SSE ngắt có GET đối soát.
- Bàn phím vào/ra dialog, focus và form error đúng; màn 390px không bị sticky che input/CTA.
- Scroll nhanh, ngược, resize, đổi route, back/forward không trùng pin hoặc nhảy trắng.
- Đo fps/frame time trên thiết bị ghi rõ, hướng đến 60fps desktop; báo kết quả thay vì chỉ mô tả “mượt”.
- Kiểm asset lỗi, JS lỗi/không bật và mạng chậm: nội dung/đường vào thực đơn vẫn tồn tại.

Trước khi đánh dấu duyệt hình ảnh: cần mockup desktop/mobile và storyboard 4 khung phở, 3 khung bánh mì. Trước đánh dấu hoàn thành animation: cần prototype chạy, kiểm trên thiết bị và bằng chứng video/profile. Bộ tài liệu này chưa bao gồm mockup hay prototype chạy.

## 13. Nguồn kỹ thuật đối chiếu

GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ — dùng để đối chiếu pin/scrub và cleanup trong triển khai. Hình ảnh, nội dung và thông số timeline trong tài liệu là thiết kế riêng của dự án.
