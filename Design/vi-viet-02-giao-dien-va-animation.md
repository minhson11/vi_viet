# VỊ VIỆT — ĐẶC TẢ THIẾT KẾ GIAO DIỆN VÀ HỆ THỐNG CHUYỂN ĐỘNG

Phiên bản 2.0 · Cập nhật ngày 05/11/2026 · Tài liệu thiết kế frontend, chưa phải giao diện đã dựng hoặc duyệt hình ảnh.

## 1. Mục đích tài liệu

Tài liệu này trả lời bốn câu hỏi triển khai:

1. Hiệu ứng xuất hiện ở trang nào và vị trí nào?
2. Hiệu ứng bắt đầu, diễn tiến và kết thúc ra sao?
3. Nội dung nào được phép thay đổi mà không phải sửa mã animation?
4. Khi thiết bị yếu, màn hình nhỏ hoặc người dùng giảm chuyển động thì giao diện thay đổi thế nào?

Các tên món trong tài liệu chỉ là ví dụ dữ liệu. Hệ thống không phụ thuộc vào Phở, Bánh mì, Cơm hoặc bất kỳ món cụ thể nào. Quản trị viên có thể thay món, ảnh, màu, câu chuyện, thứ tự và kiểu chuyển động bằng cấu hình nội dung. Giá, trạng thái còn món và định danh món luôn lấy từ API.

Phạm vi chuyển động mạnh tập trung ở trang khám phá và các điểm kể chuyện. Thực đơn, giỏ hàng, thanh toán, tài khoản và trang quản trị ưu tiên tốc độ thao tác, tính rõ ràng và phản hồi trạng thái.

## 2. Nguyên tắc trải nghiệm

### 2.1. Hai chế độ giao diện

| Chế độ | Khu vực | Mục tiêu | Mức chuyển động |
|---|---|---|---|
| Khám phá | Trang chủ, trang câu chuyện, đầu trang chi tiết món | Gây ấn tượng, kể chuyện, dẫn vào sản phẩm | Mạnh, có scroll-linked scene |
| Giao dịch | Thực đơn, chọn món, giỏ, checkout, tài khoản, staff/admin | Tìm và hoàn thành tác vụ nhanh | Nhẹ, ngắn, không pin dài |

Chuyển động không được ngăn người dùng đi thẳng đến thực đơn. Header luôn có nút “Xem thực đơn”; mobile có điều hướng cố định. Không dùng hiệu ứng chỉ để kéo dài thời gian xem.

### 2.2. Ngôn ngữ thị giác

| Token | Giá trị khởi đầu | Vai trò |
|---|---|---|
| brand-red | `#B72E24` | Điểm nhận diện, CTA chính |
| cream | `#FFF3DC` | Nền ấm, vùng kể chuyện |
| ink | `#201713` | Chữ và nền tương phản |
| herb | `#405B42` | Màu phụ tự nhiên |
| turmeric | `#E6AD36` | Màu phụ ấm |
| display | Serif đậm hỗ trợ tiếng Việt | Tiêu đề sân khấu |
| body | Sans-serif hỗ trợ tiếng Việt | Nội dung và thao tác |
| spacing | Bội 4px | Nhịp bố cục |
| radius | 12px control, 20px card | Phân cấp thành phần |

Màu nền của mỗi phân cảnh là dữ liệu cấu hình, không gắn cố định với loại món. Phải kiểm tra tương phản chữ ở cả đầu, giữa và cuối quá trình đổi màu.

## 3. Bản đồ vùng giao diện và hiệu ứng

### 3.1. Trang chủ `/`

| Vùng | Mã | Vị trí | Hiệu ứng chính | Mục đích |
|---|---|---|---|---|
| Header | HOME-H01 | Cố định phía trên | FX-01 thu gọn header | Giữ điều hướng khi cuộn |
| Hero | HOME-S01 | Màn hình đầu | FX-02 intro sân khấu | Tạo ấn tượng thương hiệu |
| Cầu nối | HOME-T01 | Giữa hero và câu chuyện đầu | FX-07 chuyển cảnh | Nối hai không gian không bị cắt |
| Danh sách câu chuyện | HOME-S02..Sn | Sau hero | FX-03 scene cuộn | Kể chuyện cho nội dung nổi bật |
| Chuyển giữa hai câu chuyện | HOME-T02..Tn | Cuối mỗi scene | FX-07 chuyển cảnh | Đổi màu, nhịp và chủ thể |
| Thực đơn nổi bật | HOME-SM01 | Sau các scene | FX-08 reveal card | Chuyển từ cảm xúc sang mua hàng |
| Khối tư vấn AI | HOME-AI01 | Sau thực đơn nổi bật | FX-09 conversational reveal | Dẫn vào tư vấn |
| Footer | HOME-F01 | Cuối trang | FX-10 reveal tĩnh | Kết thúc nhẹ, không pin |

Trang chủ không được viết cứng số lượng scene. Frontend render mảng `storySections[]` đã publish; có thể là 0, 1 hoặc nhiều nội dung. Nếu không có scene, hero chuyển trực tiếp sang thực đơn nổi bật.

### 3.2. Các trang còn lại

| Trang/vùng | Hiệu ứng được dùng | Không dùng |
|---|---|---|
| `/thuc-don` | FX-01, FX-08, FX-11 filter transition | Pin, parallax lớn, đổi nền liên tục |
| `/mon/[slug]` | FX-12 product intro, FX-13 gallery, FX-06 micro interaction | Scroll hijacking, chủ thể lăn xuyên trang |
| Dialog/sheet chọn món | FX-05 open/close, FX-06 trạng thái nút | Background parallax khi dialog mở |
| `/gio-hang` | FX-14 thêm/xóa dòng, FX-06 phản hồi giá | Stagger dài, animation trì hoãn cập nhật |
| `/thanh-toan` | FX-15 chuyển bước/trạng thái quote | Pin, chuyển cảnh điện ảnh |
| `/tu-van` | FX-09 tin nhắn/card gợi ý | Typing giả kéo dài, auto-scroll giật |
| Tài khoản | FX-05, FX-06, skeleton nhẹ | Reveal theo cuộn phức tạp |
| Staff/Admin | FX-06, FX-16 cập nhật bảng/trạng thái | Parallax, chữ khổng lồ, pin |

## 4. Mô hình nội dung động cho phân cảnh

Mỗi câu chuyện là một `StorySection`, không phải component riêng cho từng món.

```ts
type StorySection = {
  id: string;
  order: number;
  status: "draft" | "published";
  eyebrow?: string;
  title: string;
  description: string;
  backgroundText?: string;
  theme: { background: string; foreground: string; accent: string };
  media: {
    kind: "transparent-image" | "photo" | "video";
    desktopUrl: string;
    mobileUrl?: string;
    alt: string;
    focalPoint?: { x: number; y: number };
    layers?: Array<{ url: string; depth: number; alt: string }>;
  };
  motionPreset: "roll-in" | "float-in" | "rise-up" | "split-layers" | "cinematic" | "minimal";
  entranceSide?: "left" | "right" | "bottom";
  linkedDishId?: string;
  cta?: { label: string; href: string };
};
```

`linkedDishId` có thể rỗng nếu scene chỉ kể câu chuyện thương hiệu. Khi món bị ngừng bán, scene vẫn hiển thị nếu nội dung còn publish nhưng CTA đổi thành “Khám phá thực đơn”; không để liên kết hỏng.

`motionPreset` chỉ quyết định cách chuyển động. Loại món, danh mục hoặc tên món không quyết định animation. Ví dụ món nước, món nướng hoặc đồ uống đều có thể dùng `float-in` nếu asset phù hợp.

## 5. Hợp đồng chuyển động chung

### 5.1. Điều khiển bằng cuộn

- Dùng native scroll; không chặn hoặc thay đổi quãng lăn chuột của người dùng.
- Desktop từ 1024px: scene kể chuyện có thể pin; tablet/mobile không pin dài.
- `p` là tiến độ của một scene từ 0 đến 1, được tính bởi vùng cuộn của chính scene.
- Chuyển động bám cuộn dùng scrub đề xuất 0,45–0,7 giây để lọc rung bánh xe nhưng vẫn phản hồi nhanh.
- Cuộn ngược phải đảo đúng timeline; không chạy lại intro tự động và không nhảy về đầu.
- Không snap bắt buộc giữa các scene.
- Khi dialog mở, timeline nền tạm dừng và khóa cuộn; khi đóng, giữ nguyên tiến độ trước đó.

### 5.2. Độ dài và bố cục scene

| Thiết bị | Sân khấu | Khoảng cuộn | Cách trình bày |
|---|---:|---:|---|
| Desktop >= 1024px | 100svh | 180–240vh/scene | Pin sân khấu, chủ thể và chữ chuyển theo timeline |
| Tablet 768–1023px | Tự động, tối thiểu 90svh | Theo nội dung | Không pin; reveal khi vào viewport |
| Mobile < 768px | Tự động | Theo nội dung | Ảnh trên/chữ dưới hoặc ngược lại; chuyển động 250–450ms |

Khoảng cuộn là token cấu hình của preset, không nhập tự do cho từng món. Chỉ tăng khi storyboard chứng minh người dùng cần thêm thời gian đọc.

### 5.3. Thứ tự lớp trong sân khấu

| Lớp | z-index gợi ý | Nội dung | Chuyển động |
|---|---:|---|---|
| Background | 0 | Màu/texture | Chuyển màu hoặc scale rất nhẹ |
| Background text | 1 | Chữ trang trí lớn | Dịch 3–6% ngược hướng chủ thể |
| Media shadow | 2 | Bóng chủ thể | Đi cùng transform cha, opacity riêng |
| Primary media | 3 | Ảnh/video chính | Preset scene |
| Decorations | 4 | Tối đa 3–5 lớp | Parallax nhỏ theo depth |
| Story copy | 5 | Eyebrow/title/body | Reveal tuần tự |
| CTA | 6 | Hành động | Hiện sau nội dung, luôn bấm được |
| Header | 50 | Điều hướng | Không bị scene che |

## 6. Thư viện hiệu ứng chi tiết

### FX-01 — Header thu gọn theo cuộn

**Dùng tại:** mọi trang public; kích hoạt sau khi `scrollY > 48px`.

- Trạng thái đầu: cao 88px desktop/72px mobile, nền trong suốt hoặc theo hero.
- Trạng thái gọn: cao 64px/56px, nền có độ đục 92–96%, blur 10–14px, đường viền dưới 1px.
- Logo scale 1 → 0,88; khoảng cách menu giảm 16–20%.
- Thời lượng 220ms, `ease-out`; không bám scrub từng pixel.
- Khi cuộn xuống nhanh có thể ẩn 12–16px theo trục y; khi cuộn lên hiện lại trong 180ms.
- Header không biến mất khi focus bàn phím nằm bên trong.

### FX-02 — Intro sân khấu hero

**Dùng tại:** `HOME-S01`, chỉ chạy một lần khi tải trang mới và media chính đã sẵn sàng; không chạy lại khi back về vị trí giữa trang.

| Mốc | Diễn tiến |
|---|---|
| 0–160ms | Nền hiện ngay; navigation có thể dùng; không để màn hình trắng |
| 120–520ms | Eyebrow opacity 0→1, y 16→0 |
| 200–760ms | Hai dòng tiêu đề vào lệch nhau 90–120ms; clip-path hoặc mask theo dòng |
| 300–900ms | Media chính scale 0,92→1, y 36→0, rotation tùy preset tối đa ±6° |
| 520–1050ms | Lớp trang trí vào theo depth, mỗi lớp lệch 60–90ms |
| 850–1200ms | Nội dung phụ và CTA opacity 0→1, y 12→0 |

Nếu ảnh chưa tải sau 1,5 giây, hiển thị chữ/CTA trước; ảnh fade-in sau, không khởi động lại toàn timeline.

### FX-03 — Scene kể chuyện theo cuộn

**Dùng tại:** mỗi `HOME-S02..Sn` trên desktop. Đây là khung chung cho mọi preset.

| Tiến độ p | Giai đoạn | Media | Nội dung | Nền |
|---:|---|---|---|---|
| 0–0,12 | Chuẩn bị | Ngoài khung hoặc nhỏ hơn | Chưa hiện | Nhận màu từ scene trước |
| 0,12–0,32 | Đưa chủ thể vào | Di chuyển đến điểm nhìn chính | Eyebrow hiện ở cuối đoạn | Chuyển dần sang theme mới |
| 0,32–0,52 | Nêu chủ đề | Ổn định, chuyển động nhỏ | Title reveal từng dòng | Background text dịch chậm |
| 0,52–0,72 | Khoảng đọc | Giữ vị trí | Description hiện, tối đa 2–3 đoạn ngắn | Màu ổn định |
| 0,72–0,88 | Chuyển đổi | Thu nhẹ hoặc dịch sang bên | CTA/tên/giá hiện nếu có | Accent xuất hiện |
| 0,88–1 | Bàn giao | Ra khỏi điểm nhìn hoặc crossfade | Copy giảm nhấn | Bắt đầu cầu nối scene sau |

Khoảng `p=0,52–0,72` là thời gian đọc, không tiếp tục thay chữ liên tục. CTA phải đủ thời gian đứng yên để bấm; vùng bấm không đi theo media.

### FX-04 — Các preset chuyển động chủ thể

| Preset | Điểm đầu | Điểm chính | Điểm ra | Phù hợp khi |
|---|---|---|---|---|
| `roll-in` | x ±65vw, rotation ±18° | x ±16–22vw, rotation 0° | x ±32vw, scale 0,88 | Chủ thể có silhouette tròn/gọn; xoay vẫn tự nhiên |
| `float-in` | x ±45vw, y 40px, scale 0,9 | x ±18vw, y 0, scale 1 | y -32px, opacity 0 | Ảnh không phù hợp “lăn” |
| `rise-up` | y 60–100px, scale 0,92 | y 0, scale 1 | y -24px, scale 0,96 | Đĩa/hộp/ly nhìn từ trên hoặc bán nghiêng |
| `split-layers` | Media nguyên | Các layer tách 24–64px theo depth | Ghép lại chính xác | Có asset tách lớp cùng góc và ánh sáng |
| `cinematic` | scale 1,08, crop rộng | scale 1, pan 3–6% | crossfade | Ảnh nền/photo không có alpha |
| `minimal` | opacity 0, y 24px | opacity 1, y 0 | opacity 0, y -16px | Asset yếu hoặc cần ưu tiên hiệu năng |

Với `roll-in`, hệ thống chỉ xoay trong mặt phẳng 2D; không xoay 360°, không làm ảnh trông như bát/đĩa bị đổ. Nếu silhouette không phù hợp, editor phải chuyển sang `float-in` hoặc `rise-up`.

### FX-05 — Dialog và bottom sheet

**Dùng tại:** chọn món, đăng nhập nhanh, xác nhận, đánh giá.

- Desktop: backdrop opacity 0→0,48 trong 180ms; dialog opacity 0→1, y 16→0, scale 0,98→1 trong 220ms.
- Mobile: sheet y 100%→0 trong 280–340ms; không bounce.
- Đóng nhanh hơn mở khoảng 15%; hoàn tất focus trap trước khi người dùng tab.
- Khi lỗi validation, scroll đến lỗi đầu tiên với chuyển động ngắn; reduced motion chuyển ngay.

### FX-06 — Micro interaction

**Dùng tại:** nút, chip, card, stepper, icon yêu thích, trạng thái lưu.

- Hover card: y 0→-4px, shadow tăng nhẹ, 160–200ms; ảnh scale tối đa 1,03.
- Press button: scale 1→0,98 trong 80ms rồi về 1; không làm layout đổi.
- Add-to-cart thành công: badge giỏ scale 1→1,16→1 trong 260ms; toast xuất hiện đồng thời.
- Loading: spinner trong nút, giữ nguyên chiều rộng; nội dung có `aria-live` phù hợp.
- Error: viền/màu và thông báo; rung ngang tối đa 4px, 2 nhịp, không dùng lặp lại.

### FX-07 — Chuyển cảnh giữa hai scene

**Dùng tại:** `HOME-T01..Tn`, chiếm phần cuối scene hiện tại và đầu scene kế tiếp.

1. Trong `p=0,82–0,9`, nội dung cũ giảm nhấn; CTA vẫn bấm được.
2. Trong `p=0,88–0,96`, background chuyển màu bằng crossfade hoặc shape mask.
3. Trong `p=0,9–1`, media cũ rời điểm nhìn; media mới chỉ xuất hiện tối đa 15% opacity.
4. Scene mới nhận trạng thái tại `p=0`; media mới vào theo preset của nó khi tiếp tục cuộn.

Nếu hai scene dùng cùng asset, có thể crossfade hai instance ở vị trí khớp nhau. Không reparent DOM đang pin. Nếu mask làm giảm frame rate, fallback sang crossfade màu 240–360ms.

### FX-08 — Reveal lưới thực đơn

**Dùng tại:** `HOME-SM01` và `/thuc-don` khi trang/lọc trả dữ liệu mới.

- Section title opacity 0→1, y 20→0 trong 320ms khi 20% vùng vào viewport.
- Card stagger tối đa 40–60ms/card, giới hạn 6 card đầu; các card sau hiện cùng lúc.
- Khi lọc: card cũ fade 120ms; skeleton chỉ hiện nếu chờ quá 180ms; card mới fade/y trong 220ms.
- Không chạy lại toàn bộ reveal khi tăng số lượng hoặc yêu thích một món.

### FX-09 — Tư vấn AI

**Dùng tại:** khối AI trang chủ và `/tu-van`.

- Tin nhắn mới: opacity 0→1, y 10→0, 180–240ms.
- Card gợi ý: stagger tối đa 70ms, không quá 4 card.
- Chỉ auto-scroll nếu người dùng cách cuối hội thoại dưới 120px; nếu đã đọc phía trên, hiện nút “Có gợi ý mới”.
- Trạng thái đang xử lý phản ánh thời gian chờ thật; không giả gõ từng ký tự để kéo dài câu trả lời.

### FX-10 — Footer reveal

**Dùng tại:** cuối trang public. Nội dung opacity 0→1, y 20→0 trong 300ms khi vào viewport. Các nhóm liên kết stagger 50ms, tối đa bốn nhóm. Không pin footer.

### FX-11 — Bộ lọc thực đơn

**Dùng tại:** `/thuc-don`. Desktop mở panel bằng opacity và y 8px trong 180ms. Mobile mở bottom sheet theo FX-05. Chip đổi nền/màu 140ms; số kết quả cập nhật sau API. Không animate chiều cao toàn danh sách theo từng frame.

### FX-12 — Mở đầu trang chi tiết món

**Dùng tại:** đầu `/mon/[slug]`. Ảnh chính opacity 0→1, scale 1,03→1 trong 400ms; tiêu đề và metadata reveal lệch 80ms. Không pin. Shared visual transition chỉ dùng khi được hỗ trợ; fallback là fade.

### FX-13 — Gallery

Ảnh đổi bằng crossfade 180–240ms. Thumbnail active có viền/indicator, không chỉ scale. Swipe mobile theo native gesture; không ép quán tính tùy chỉnh.

### FX-14 — Cập nhật giỏ hàng

- Thêm dòng: opacity 0→1, y -8→0, 180ms.
- Xóa: dòng collapse 180–220ms sau khi server chấp nhận.
- Đổi số lượng: giá cũ crossfade sang giá mới 160ms; không đếm số giả trước phản hồi server.
- Lỗi: giữ dòng và lựa chọn, hiển thị lý do tại chính dòng.

### FX-15 — Checkout

Chuyển giao hàng/nhận tại quán bằng crossfade trường liên quan 180ms. Khi quote cập nhật, giữ layout và dùng trạng thái tại tổng tiền. Giá mới highlight nhẹ 600–900ms; nếu tổng thay đổi cần xác nhận lại, mở khối so sánh chứ không chỉ flash màu.

### FX-16 — Staff/Admin

Hàng mới trong bảng highlight 1–1,5 giây rồi trở lại nền; badge trạng thái crossfade 160ms. Không tự di chuyển hàng khi nhân viên đang thao tác; sắp xếp lại sau khi command thành công và giữ focus hợp lý.

## 7. Responsive và giảm chuyển động

### 7.1. Tablet/mobile

Trên màn hình dưới 1024px, FX-03 chuyển từ timeline pin sang bố cục tài liệu:

1. Media reveal khi 15–25% section vào viewport.
2. Title và description hiện sau media 80–120ms.
3. CTA nằm trong luồng nội dung, không trôi theo ảnh.
4. Parallax layer bị tắt hoặc giới hạn 6–10px.
5. Mỗi section cao theo nội dung; không tạo khoảng trắng 200vh.

### 7.2. `prefers-reduced-motion`

- Tắt pin, scrub, rotation, parallax, layer split và hiệu ứng lặp.
- Giữ bố cục cuối cùng có đủ title, description, media và CTA.
- Fade tối đa 120ms hoặc chuyển ngay nếu người dùng tắt hoàn toàn.
- Không dùng `display: none` cho nội dung vốn phụ thuộc timeline.

### 7.3. Thiết bị yếu và lỗi asset

Khi có frame drop kéo dài hoặc asset không hợp lệ, scene dùng preset `minimal`. Nếu media lỗi, hiển thị nền, chữ, CTA và placeholder có alt. Video không tự chạy khi tiết kiệm dữ liệu hoặc mạng yếu; dùng poster.

## 8. Yêu cầu asset độc lập nội dung

| Loại | Yêu cầu | Dùng với preset | Fallback |
|---|---|---|---|
| Transparent hero | WebP/AVIF/PNG alpha, không cắt mép, 1600–2000px | roll-in, float-in, rise-up | Photo crop + cinematic |
| Photo landscape | 16:9 hoặc 4:3, có focal point | cinematic | minimal |
| Layer set | 3–5 ảnh cùng góc, ánh sáng, silhouette khớp | split-layers | Ảnh nguyên |
| Short video | 4–8 giây, loop kín, poster, không âm thanh tự phát | cinematic | poster |
| Menu thumbnail | 4:3 đồng nhất, 640–960px | card reveal | placeholder |

Editor phải preview asset với preset trước publish. Không cho chọn `split-layers` nếu chưa đủ layer. Không mặc định `roll-in` cho mọi ảnh; silhouette và hướng nhìn phải phù hợp.

Budget khởi đầu: media chủ đạo dưới khoảng 600KB nếu vẫn đạt chất lượng; tổng tải đầu trang hướng tới dưới 1,5MB; lazy-load scene sau. Đây là ngưỡng kiểm thử, không phải tuyên bố đã đạt.

## 9. Giao diện quản trị nội dung chuyển động

Tại `/admin/content`, mỗi scene có:

- Bật/tắt publish và kéo thả thứ tự.
- Nhập eyebrow, title, description, background text.
- Chọn màu nền/chữ/accent có cảnh báo tương phản.
- Chọn media desktop/mobile và focal point.
- Chọn một trong sáu `motionPreset`; preview desktop, tablet, mobile và reduced motion.
- Liên kết tùy chọn với món hoặc URL CTA.
- Cảnh báo asset/preset không tương thích.
- Nút “Xem trước toàn trang” để kiểm tra cả chuyển cảnh trước và sau.

Không cho người quản trị nhập trực tiếp tọa độ GSAP, selector hoặc JavaScript. Các thông số kỹ thuật nằm trong preset có version để frontend kiểm soát chất lượng.

## 10. Quy tắc triển khai frontend

- Mỗi scene có component chung `StoryScene`; preset là chiến lược transform, không tạo component theo tên món.
- Scope animation theo component; cleanup khi unmount, đổi breakpoint hoặc route.
- Chỉ animate `transform` và `opacity` trên scroll khi có thể; tránh width/height/top/left mỗi frame.
- Không dùng React state cho từng frame; timeline cập nhật DOM/ref trong phạm vi kiểm soát.
- Tính lại mốc sau khi font/media sẵn sàng; không refresh mỗi frame.
- Khi back/forward, phục hồi scroll hợp lý và không tạo pin spacer trùng.
- Media trang trí dùng `pointer-events: none`; CTA và nội dung giữ vùng tương tác ổn định.
- Mọi chuyển động phải hoạt động khi cuộn nhanh, cuộn ngược, resize và đổi orientation.

## 11. Luồng giao dịch và trạng thái bắt buộc

Phần giao dịch gồm thực đơn, chi tiết món, chọn cấu hình, giỏ, checkout, kết quả, theo dõi đơn, tư vấn AI, tài khoản, staff và admin. Chuyển động chỉ dùng FX-05, FX-06 và FX-08 đến FX-16 theo bản đồ mục 3.2.

Giá frontend chỉ là phản hồi tạm; backend xác nhận lại. Khi món hết hoặc giá đổi, giữ dữ liệu người dùng, chỉ rõ phần phải sửa. Redirect thanh toán chỉ hiển thị “Đang xác minh” trước khi API trả kết quả. SSE là tín hiệu tải lại trạng thái, không phải nguồn sự thật duy nhất.

## 12. Ma trận nghiệm thu animation

| Mã | Trường hợp kiểm thử | Kết quả đạt |
|---|---|---|
| MOT-01 | Thay toàn bộ món/nội dung scene trong CMS | Trang vẫn chạy, không sửa component/timeline |
| MOT-02 | `storySections=[]` | Hero nối trực tiếp thực đơn, không khoảng trắng/pin lỗi |
| MOT-03 | 1, 3 và 6 scene | Thứ tự, transition và scroll length đúng |
| MOT-04 | Cuộn nhanh từ đầu đến cuối | Không màn trắng, CTA không mắc kẹt, không duplicate pin |
| MOT-05 | Cuộn ngược | Timeline đảo đúng, không replay hero intro |
| MOT-06 | Resize qua breakpoint giữa scene | Cleanup và dựng layout mới không nhảy về đầu |
| MOT-07 | Mở/đóng dialog trong scene pin | Nền giữ đúng tiến độ; focus và scroll lock đúng |
| MOT-08 | Asset chính lỗi | Copy, CTA và fallback vẫn dùng được |
| MOT-09 | Layer set thiếu | Preset fallback, không hiển thị layer lệch |
| MOT-10 | Reduced motion | Đủ nội dung, không pin/rotation/parallax |
| MOT-11 | Mobile 390px | Không sticky che CTA/input, không vùng cuộn giả dài |
| MOT-12 | Keyboard-only | Focus thấy rõ, thứ tự tab đúng, animation không giấu nội dung |
| MOT-13 | Mạng chậm | Hero copy/CTA sẵn sàng trước media; layout không dịch mạnh |
| MOT-14 | Route back/forward | Vị trí cuộn hợp lý, không có spacer thừa |
| MOT-15 | Hiệu năng desktop | Đo frame time trên thiết bị ghi rõ; hướng tới 60fps, báo số thực |
| MOT-16 | Hiệu năng mobile | Không long task kéo dài; giảm về minimal khi cần |

## 13. Deliverable cần có trước khi lập trình

Tài liệu đặc tả chưa thay thế sản phẩm thiết kế trực quan. Trước khi triển khai chính thức cần:

1. Wireframe toàn trang desktop và mobile, thể hiện từng vùng HOME-*.
2. Visual mockup cho hero, một scene chuẩn, thực đơn và trạng thái fallback.
3. Storyboard 5 khung cho mỗi preset được chọn: vào, định vị, đọc, CTA, rời cảnh.
4. Motion prototype gồm hero, hai scene dùng hai preset khác nhau và chuyển cảnh.
5. Video/profile kiểm tra cuộn nhanh, ngược, resize, mobile và reduced motion.
6. Bảng asset thật của cửa hàng; chỉ chốt preset sau khi xem asset thực tế.

Không đánh dấu “đã hoàn thành animation” chỉ dựa trên thông số tài liệu. Cần prototype chạy và nghiệm thu bằng ma trận MOT.

## 14. Nguồn kỹ thuật đối chiếu

GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ — đối chiếu pin, scrub, refresh và lifecycle khi triển khai. Các mã vùng, preset và timeline trong tài liệu là thiết kế riêng của dự án Vị Việt.
