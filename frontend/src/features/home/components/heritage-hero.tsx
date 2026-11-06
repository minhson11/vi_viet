"use client";

import React from "react";

export const HeritageHero: React.FC = () => {
  return (
    <section
      id="home"
      className="relative min-h-[82vh] flex items-center justify-center bg-gradient-to-b from-[#fff1eb] via-[#fff8f6] to-[#fff8f6] overflow-hidden py-20 border-b border-[#e2beba]/30"
    >
      <div className="max-w-5xl mx-auto px-6 w-full text-center flex flex-col items-center relative z-10">
        {/* Sub-badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#fdeae3] border border-[#e2beba] shadow-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs uppercase tracking-[0.22em] font-bold text-primary">
            Ẩm Thực Đương Đại · Di Sản Ngàn Năm · Michelin Selected 2024
          </span>
        </div>

        {/* Tiêu đề Typography uy nghi */}
        <h1 className="font-headline text-4xl sm:text-6xl lg:text-7xl font-bold text-primary leading-[1.15] tracking-tight mb-4">
          Bản Giao Hưởng <br />
          <span className="text-[#1c1917] italic font-normal">
            Vị Giác Đất Việt
          </span>
        </h1>

        {/* Phụ đề thi vị */}
        <p className="font-headline italic text-lg sm:text-2xl text-gold font-medium mb-6">
          “Nơi Ký Ức Hương Vị Tái Sinh Trong Nghệ Thuật Ẩm Thực Mới”
        </p>

        {/* Mô tả trải nghiệm */}
        <p className="text-base sm:text-lg text-[#5a413d] leading-relaxed max-w-2xl mx-auto mb-10 font-normal">
          Đắm chìm vào không gian ẩm thực đa giác quan, nơi từng hạt ngọc trời
          dẻo thơm, cọng thảo mộc sương sớm miền Tây Bắc và giọt nước mắm nhĩ cổ
          truyền Phú Quốc được nâng tầm thành kiệt tác thị giác và vị giác đương
          đại.
        </p>

        {/* Cụm nút hành động */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <a
            href="#story"
            className="px-8 py-4 rounded-full bg-primary hover:bg-primary-hover text-white border border-gold/40 text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            Khám Phá Câu Chuyện Ẩm Thực
          </a>
          <a
            href="#menu"
            className="px-7 py-4 rounded-full bg-white hover:bg-[#fff1eb] text-[#1c1917] border border-[#e2beba] text-xs font-bold uppercase tracking-wider shadow-sm hover:border-primary/50 transition-all"
          >
            Xem Thực Đơn Hôm Nay
          </a>
          <a
            href="/tu-van"
            className="px-7 py-4 rounded-full bg-[#fdeae3] hover:bg-white text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
          >
            Tư Vấn Khẩu Vị AI
          </a>
        </div>

        {/* Thống kê di sản bên dưới */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 pt-8 border-t border-[#e2beba]/50 w-full max-w-3xl">
          <div className="text-center p-3 rounded-2xl bg-white/70 border border-[#e2beba]/40 shadow-sm">
            <span className="font-headline text-3xl font-bold text-primary block">
              48h+
            </span>
            <p className="text-xs text-[#5a413d] font-medium mt-1">
              Ninh thảo quả &amp; tủy bò
            </p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-white/70 border border-[#e2beba]/40 shadow-sm">
            <span className="font-headline text-3xl font-bold text-secondary block">
              100%
            </span>
            <p className="text-xs text-[#5a413d] font-medium mt-1">
              Nông sản bản địa hữu cơ
            </p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-white/70 border border-[#e2beba]/40 shadow-sm">
            <span className="font-headline text-3xl font-bold text-gold block">
              03 Miền
            </span>
            <p className="text-xs text-[#5a413d] font-medium mt-1">
              Hành trình vị giác di sản
            </p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-white/70 border border-[#e2beba]/40 shadow-sm">
            <span className="font-headline text-3xl font-bold text-primary block">
              30 Phút
            </span>
            <p className="text-xs text-[#5a413d] font-medium mt-1">
              Giao nóng thố nhiệt 88°C
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

