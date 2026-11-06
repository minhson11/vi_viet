"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, Compass, Flame } from "lucide-react";
import { HeroVisualData } from "../types/hero.types";

interface HeroVisualProps {
  visual: HeroVisualData;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  mainImageRef?: React.RefObject<HTMLDivElement | null>;
  bgTypoRef?: React.RefObject<HTMLDivElement | null>;
  foregroundBadgesRef?: React.RefObject<HTMLDivElement | null>;
}

export const HeroVisual: React.FC<HeroVisualProps> = ({
  visual,
  containerRef,
  mainImageRef,
  bgTypoRef,
  foregroundBadgesRef,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(visual.mainImage);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[420px] sm:min-h-[500px] lg:min-h-[620px] flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {/* ================= LAYER 1: AMBIENT WARMTH & RADIAL GLOW ================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Vầng sáng vàng ấm lan tỏa tự nhiên phía sau đĩa món */}
        <div className="w-[300px] sm:w-[460px] lg:w-[600px] h-[300px] sm:h-[460px] lg:h-[600px] rounded-full bg-gradient-to-tr from-surface-warm/80 via-turmeric-light/60 to-transparent blur-3xl opacity-75 transform -translate-y-4" />
        <div className="w-[220px] sm:w-[340px] lg:w-[440px] h-[220px] sm:h-[340px] lg:h-[440px] rounded-full bg-gold/10 blur-2xl opacity-60" />
      </div>

      {/* ================= LAYER 2: BACKGROUND WATERMARK TYPOGRAPHY ================= */}
      <div
        ref={bgTypoRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden z-0"
      >
        <span className="font-headline text-[16vw] lg:text-[14vw] font-black uppercase tracking-tighter text-primary/[0.045] leading-none select-none whitespace-nowrap transform -translate-y-8">
          VỊ VIỆT
        </span>
        <span className="font-headline italic text-[7vw] lg:text-[5.5vw] font-normal text-gold/[0.07] leading-none select-none whitespace-nowrap transform -translate-y-4">
          Contemporary Heritage
        </span>
      </div>

      {/* ================= LAYER 3: DEEP ORGANIC DROP SHADOW ================= */}
      <div className="absolute bottom-[10%] sm:bottom-[12%] lg:bottom-[8%] w-[68%] sm:w-[62%] lg:w-[58%] h-12 sm:h-16 rounded-[100%] bg-ink/25 blur-2xl transform scale-y-50 pointer-events-none z-10" />

      {/* ================= LAYER 4: MAIN CULINARY SUBJECT (ĐĨA MÓN ĂN CHÍNH) ================= */}
      <div
        ref={mainImageRef}
        className="relative z-20 w-[84%] sm:w-[76%] lg:w-[72%] max-w-[560px] aspect-square flex items-center justify-center"
      >
        {/* Vành viền đĩa gốm mộc & hiệu ứng ánh kim siêu thực */}
        <div className="relative w-full h-full rounded-full p-3 sm:p-4 bg-gradient-to-b from-white via-surface-warm to-surface-low shadow-[0_28px_60px_-15px_rgba(32,23,19,0.22),0_12px_24px_-8px_rgba(183,46,36,0.12)] border border-border/80">
          {/* Lớp lót đĩa sứ tráng men mộc */}
          <div className="relative w-full h-full rounded-full overflow-hidden border border-gold/30 bg-surface">
            {/* Ảnh món ăn chính */}
            <Image
              src={imgSrc}
              alt={visual.alt}
              fill
              priority
              sizes="(max-width: 640px) 84vw, (max-width: 1024px) 50vw, 560px"
              className={`object-cover object-center transform transition-all duration-1000 ${
                isLoaded ? "scale-100 blur-0 opacity-100" : "scale-105 blur-sm opacity-80"
              }`}
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                if (visual.fallbackImage && imgSrc !== visual.fallbackImage) {
                  setImgSrc(visual.fallbackImage);
                }
              }}
            />

            {/* Gradient lụa mờ nhẹ ở đáy đĩa tạo chiều sâu thị giác */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent pointer-events-none" />

            {/* Làn khói hữu cơ tinh tế (Organic Steam SVG) */}
            <div className="absolute inset-x-0 top-1/4 flex justify-center pointer-events-none opacity-40">
              <svg
                width="140"
                height="80"
                viewBox="0 0 140 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-pulse"
              >
                <path
                  d="M40 70C35 50 55 40 45 20C40 10 48 5 46 0"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="steam-line"
                />
                <path
                  d="M70 75C62 55 80 42 72 22C68 12 75 6 73 0"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="steam-line"
                  style={{ animationDelay: "1s" }}
                />
                <path
                  d="M100 68C94 48 108 38 102 18C98 8 104 4 102 0"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="steam-line"
                  style={{ animationDelay: "1.8s" }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ================= LAYER 5: FOREGROUND BADGES & CON TRIỆN TRUYỀN THỐNG ================= */}
        <div
          ref={foregroundBadgesRef}
          className="absolute inset-0 pointer-events-none z-30 flex items-center justify-between"
        >
          {/* Con dấu triện đỏ đồng cổ truyền (Góc trên trái đĩa) */}
          <div className="absolute -top-3 sm:-top-5 -left-2 sm:-left-6 bg-gradient-to-br from-primary to-primary-hover text-cream rounded-2xl p-2.5 sm:p-3 shadow-xl border border-gold/40 flex items-center gap-2 transform -rotate-6 backdrop-blur-xs">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gold/60 flex items-center justify-center shrink-0 bg-primary/80">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-turmeric" />
            </div>
            <div className="text-left pr-1">
              <span className="block text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-turmeric-light leading-none">
                Di Sản Đất Việt
              </span>
              <span className="block text-[11px] sm:text-xs font-headline font-bold text-cream mt-0.5 leading-tight">
                {visual.dishName}
              </span>
            </div>
          </div>

          {/* Badge thố giữ nhiệt 88°C (Góc dưới phải đĩa) */}
          <div className="absolute -bottom-2 sm:-bottom-4 -right-2 sm:-right-4 bg-surface/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border border-border flex items-center gap-2.5 transform rotate-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-surface-warm border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Flame className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="text-left pr-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted">
                  {visual.heatTag || "Thố Nhiệt 88°C"}
                </span>
              </div>
              <span className="block text-[11px] sm:text-xs font-semibold text-ink">
                {visual.origin || "Hà Thành Cổ Truyền"}
              </span>
            </div>
          </div>

          {/* Tag Tọa độ tinh hoa (Góc dưới trái nhẹ) */}
          <div className="hidden sm:flex absolute bottom-6 -left-8 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/80 shadow-md items-center gap-1.5 text-[10px] text-ink-muted">
            <Compass className="w-3 h-3 text-gold" />
            <span className="font-mono tracking-tight">{visual.coordinates || "21.0285° N, 105.8542° E"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
