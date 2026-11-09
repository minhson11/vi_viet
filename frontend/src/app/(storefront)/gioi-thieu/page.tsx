"use client";

import React from "react";
import Link from "next/link";
import {
  Utensils,
  Sparkles,
  Award,
  Clock,
  ChevronRight,
  Flame,
  CheckCircle2,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fff8f6] text-ink pb-20">
      {/* 1. HERO BANNER: Tinh Hoa Mỹ Vị Đương Đại */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fdeae3] to-[#fff8f6] py-16 sm:py-24 border-b border-[#e2beba]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-gold/40 text-brand-red text-xs font-bold uppercase tracking-widest shadow-2xs mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Thương Hiệu Ẩm Thực Đương Đại Vị Việt</span>
          </div>

          <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-extrabold text-ink tracking-tight leading-tight max-w-4xl mx-auto">
            Gìn Giữ Hồn Cốt Di Sản, <br className="hidden sm:inline" />
            <span className="text-brand-red">Nâng Tầm Mỹ Vị Đương Đại</span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-ink-muted max-w-2xl mx-auto leading-relaxed">
            Vị Việt ra đời từ khát vọng gìn giữ những công thức bí truyền trăm năm của ẩm thực ba miền, 
            kết hợp cùng kỹ nghệ ẩm thực đương đại và giải pháp giao món nóng chuẩn thố sứ sang trọng.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/thuc-don"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-red hover:bg-brand-red-hover text-cream text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md shadow-brand-red/20 active:scale-95 transition-all cursor-pointer"
            >
              <Utensils className="w-4 h-4" />
              <span>Khám Phá Thực Đơn</span>
            </Link>

            <Link
              href="/lien-he"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#fff1eb] text-ink border border-[#e2beba] text-xs sm:text-sm font-semibold hover:text-brand-red shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <span>Liên Hệ & Đặt Bàn</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Họa tiết trang trí nền */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-72 h-72 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. TAM ĐẠI TRIẾT LÝ ẨM THỰC */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            Triết Lý Chế Tác
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-ink mt-2">
            Tam Đại Trụ Cột Tinh Hoa
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-3">
            Mỗi món ăn tại Vị Việt đều được định hình bởi ba nguyên tắc bất di bất dịch, đảm bảo trải nghiệm vị giác hoàn hảo nhất cho thực khách.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Trụ cột 1 */}
          <div className="bg-surface border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-ink mb-2">
              1. Tươi Sống Bản Địa
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              100% nguyên liệu tươi mỗi ngày: Thịt bò tươi từ cao nguyên, hải sản tuyển chọn vùng duyên hải, 
              và các loại thảo mộc, quế hồi hữu cơ thu hoạch trong ngày.
            </p>
          </div>

          {/* Trụ cột 2 */}
          <div className="bg-surface border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-ink mb-2">
              2. Ninh Chậm 48 Giờ
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Nước dùng phở và các món nước được hầm ống tủy bò và thảo mộc tự nhiên ròng rã 48 tiếng, 
              cho vị ngọt thanh nguyên bản từ xương mà không dùng bột ngọt nhân tạo.
            </p>
          </div>

          {/* Trụ cột 3 */}
          <div className="bg-surface border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-herb/15 text-herb flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-ink mb-2">
              3. Thố Sứ Chuẩn Fine-Dining
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Giải pháp đóng gói độc quyền bằng thố sứ và hộp giữ nhiệt sinh học, 
              giữ trọn độ sôi nóng 85°C suốt hành trình giao nhanh 30 phút đến tận tay khách hàng.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CÂU CHUYỆN KHỞI NGUỒN THƯƠNG HIỆU */}
      <section className="bg-surface-warm/40 border-y border-[#e2beba]/40 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Ảnh minh họa thương hiệu */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-4/3 rounded-3xl overflow-hidden border border-[#e2beba]/60 shadow-xl relative">
                <img
                  src="https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1000&q=80"
                  alt="Không gian bếp Vị Việt"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-2xl border border-gold/40 shadow-lg hidden sm:block">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Bí Quyết Trăm Năm</p>
                <p className="text-xs font-extrabold text-ink">Gia vị cổ truyền 3 miền</p>
              </div>
            </div>

            {/* Lời tự sự thương hiệu */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
                Khởi Nguồn Thương Hiệu
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink leading-snug">
                Từ Mâm Cơm Gia Đình Đến <br />
                Đỉnh Cao Ẩm Thực Việt Đương Đại
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Người Việt Nam có quyền tự hào về một nền ẩm thực giàu bản sắc, tinh tế và cân bằng âm dương bậc nhất thế giới. 
                Tuy nhiên, giữa nhịp sống hối hả, việc tìm kiếm một bữa ăn vừa đậm đà hương vị truyền thống chuẩn vị, 
                vừa đảm bảo vệ sinh an toàn và giữ được độ nóng sốt tại nhà hoặc văn phòng là điều không dễ dàng.
              </p>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Vị Việt ra đời để giải quyết bài toán đó. Chúng tôi không chỉ nấu ăn; 
                chúng tôi chắt lọc tinh hoa từ các nghệ nhân phố cổ Hà Nội, các bậc thầy gia vị miền Trung và sự phóng khoáng trù phú của đất phương Nam 
                để mang đến những trải nghiệm ẩm thực đẳng cấp nhất.
              </p>

              <div className="pt-2 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <CheckCircle2 className="w-4 h-4 text-brand-red shrink-0" />
                  <span>100% Không mì chính công nghiệp</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <CheckCircle2 className="w-4 h-4 text-brand-red shrink-0" />
                  <span>Bao bì sinh học thân thiện môi trường</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <CheckCircle2 className="w-4 h-4 text-brand-red shrink-0" />
                  <span>Bếp trung tâm chuẩn HACCP</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <CheckCircle2 className="w-4 h-4 text-brand-red shrink-0" />
                  <span>Cam kết đổi trả nếu món không đạt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CHÂN DUNG NGHỆ NHÂN BẾP TRƯỞNG */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-gold">
          Đội Ngũ Nghệ Nhân
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-ink mt-2 mb-4">
          Tâm Huyết Từ Những Bàn Tay Lành Nghề
        </h2>
        <p className="text-xs sm:text-sm text-ink-muted max-w-xl mx-auto mb-12">
          Đứng sau mỗi mẻ nước dùng, từng lát thịt xá xíu hay mẻ bánh mì giòn tan là đội ngũ đầu bếp với hơn 20 năm kinh nghiệm gìn giữ lửa nghề.
        </p>

        <div className="bg-surface border border-border rounded-3xl p-8 sm:p-10 shadow-xs max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-left">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-brand-red/20 to-gold/30 flex items-center justify-center p-3 shrink-0 border border-gold/40">
            <img
              src="/logo-emblem.svg"
              alt="Bếp Trưởng Vị Việt"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-bold text-ink">
                Hội Đồng Bếp Trưởng Vị Việt
              </h3>
              <span className="text-[10px] bg-brand-red/10 text-brand-red font-bold px-2 py-0.5 rounded-full">
                Artisan Chef
              </span>
            </div>
            <p className="text-xs text-gold font-semibold mb-2">
              Kế Thừa Ẩm Thực Cung Đình &amp; Phố Cổ Ba Miền
            </p>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              &ldquo;Ẩm thực là cây cầu nối liền quá khứ và hiện tại. Chúng tôi không thay đổi hương vị cội nguồn, mà dùng công nghệ và sự chuẩn hóa để hương vị ấy chạm tới thực khách với độ hoàn mỹ cao nhất.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION CUỐI TRANG */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#1c1917] to-[#2c201a] text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3">
            Sẵn Sàng Thưởng Thức Mỹ Vị Di Sản?
          </h2>
          <p className="text-xs sm:text-sm text-white/70 max-w-lg mx-auto mb-8">
            Trải nghiệm các món nước nóng hổi, cơm niêu thơm lừng và món cuốn tinh tế giao tận nơi chỉ trong 30 phút.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/thuc-don"
              className="px-6 py-3 rounded-full bg-brand-red hover:bg-brand-red-hover text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              Đặt Món Giao Nóng Ngay
            </Link>
            <Link
              href="/lien-he"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 active:scale-95 transition-all cursor-pointer"
            >
              Liên Hệ Hệ Thống Atelier
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
