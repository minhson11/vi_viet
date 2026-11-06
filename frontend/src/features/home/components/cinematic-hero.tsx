"use client";

import React from "react";
import { useHeroAnimation } from "../hooks/use-hero-animation";
import { HeroVisual } from "./hero-visual";
import { HeroContent } from "./hero-content";
import { defaultHeroContent } from "../data/hero-content";
import { HeroContentData } from "../types/hero.types";

interface CinematicHeroProps {
  customContent?: Partial<HeroContentData>;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ customContent }) => {
  const content: HeroContentData = {
    ...defaultHeroContent,
    ...customContent,
  };

  const {
    containerRef,
    eyebrowRef,
    titleLine1Ref,
    titleLine2Ref,
    subTitleRef,
    descRef,
    ctaGroupRef,
    metricsRef,
    visualContainerRef,
    mainImageRef,
    bgTypoRef,
    foregroundBadgesRef,
  } = useHeroAnimation();

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative min-h-[100svh] flex items-center justify-center bg-gradient-to-b from-surface-low via-surface to-surface overflow-hidden pt-24 sm:pt-28 lg:pt-24 pb-12 sm:pb-16 lg:pb-20 border-b border-border/50"
    >
      {/* ================= BACKGROUND TEXTURE & AMBIENT ELEMENTS ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Họa tiết ánh vàng di sản góc trên phải */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
        {/* Họa tiết ấm góc dưới trái */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        {/* Đường chỉ may viền vàng tinh tế chạy dọc 2 bên lề trang (Editorial Border Guides) */}
        <div className="hidden 2xl:block absolute top-0 bottom-0 left-12 w-[1px] bg-gradient-to-b from-transparent via-border/50 to-transparent" />
        <div className="hidden 2xl:block absolute top-0 bottom-0 right-12 w-[1px] bg-gradient-to-b from-transparent via-border/50 to-transparent" />
      </div>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[calc(100svh-9rem)]">
          {/* CỘT NỘI DUNG (EDITORIAL TYPOGRAPHY & INTERACTION) - 7 CỘT TRÊN DESKTOP */}
          <div className="lg:col-span-7 flex flex-col justify-center order-2 lg:order-1 pt-4 lg:pt-0">
            <HeroContent
              content={content}
              eyebrowRef={eyebrowRef}
              titleLine1Ref={titleLine1Ref}
              titleLine2Ref={titleLine2Ref}
              subTitleRef={subTitleRef}
              descRef={descRef}
              ctaGroupRef={ctaGroupRef}
              metricsRef={metricsRef}
            />
          </div>

          {/* CỘT TRỰC QUAN (5+ LAYERS MULTI-DEPTH CULINARY VISUAL) - 5 CỘT TRÊN DESKTOP */}
          <div className="lg:col-span-5 flex items-center justify-center order-1 lg:order-2">
            <HeroVisual
              visual={content.visual}
              containerRef={visualContainerRef}
              mainImageRef={mainImageRef}
              bgTypoRef={bgTypoRef}
              foregroundBadgesRef={foregroundBadgesRef}
            />
          </div>
        </div>
      </div>

      {/* ================= SCROLL DOWN INDICATOR (NHẸ NHÀNG, KHÔNG CẢN TRỞ) ================= */}
      <div className="hidden sm:flex absolute bottom-4 inset-x-0 justify-center pointer-events-none">
        <a
          href="#story"
          className="pointer-events-auto flex flex-col items-center gap-1.5 text-ink-muted/70 hover:text-primary transition-colors py-2 px-4 group"
          aria-label="Cuộn xuống khám phá câu chuyện ẩm thực"
        >
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] font-mono group-hover:tracking-[0.25em] transition-all">
            Cuộn Khám Phá
          </span>
          <div className="w-5 h-8 rounded-full border border-border/80 flex justify-center pt-1.5 bg-surface/50 backdrop-blur-xs">
            <span className="w-1 h-2 rounded-full bg-primary animate-bounce" />
          </div>
        </a>
      </div>
    </section>
  );
};
