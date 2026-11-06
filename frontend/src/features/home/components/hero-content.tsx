"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Utensils, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroContentData } from "../types/hero.types";

interface HeroContentProps {
  content: HeroContentData;
  eyebrowRef?: React.RefObject<HTMLDivElement | null>;
  titleLine1Ref?: React.RefObject<HTMLDivElement | null>;
  titleLine2Ref?: React.RefObject<HTMLDivElement | null>;
  subTitleRef?: React.RefObject<HTMLParagraphElement | null>;
  descRef?: React.RefObject<HTMLParagraphElement | null>;
  ctaGroupRef?: React.RefObject<HTMLDivElement | null>;
  metricsRef?: React.RefObject<HTMLDivElement | null>;
}

export const HeroContent: React.FC<HeroContentProps> = ({
  content,
  eyebrowRef,
  titleLine1Ref,
  titleLine2Ref,
  subTitleRef,
  descRef,
  ctaGroupRef,
  metricsRef,
}) => {
  return (
    <div className="relative z-30 flex flex-col justify-center text-left max-w-2xl lg:max-w-none">
      {/* ================= 1. EYEBROW BADGE ================= */}
      <div ref={eyebrowRef} className="mb-4 sm:mb-6">
        <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-full bg-surface-warm/90 border border-border shadow-xs backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.24em] font-bold text-primary">
            {content.eyebrow}
          </span>
          {content.eyebrowTag && (
            <>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-[10px] sm:text-[11px] font-semibold text-gold tracking-wide">
                {content.eyebrowTag}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ================= 2. CINEMATIC HEADLINE (DUY NHẤT 1 THẺ H1) ================= */}
      <h1 className="font-headline tracking-tight text-neutral-dark mb-4 select-none">
        {/* Dòng 1: Reveal mask overflow-hidden, đệm padding an toàn cho dấu tiếng Việt */}
        <span className="block overflow-hidden py-1 sm:py-2">
          <span
            ref={titleLine1Ref}
            className="block text-[clamp(2.8rem,7vw,6.5rem)] font-black text-primary uppercase leading-[1.05] tracking-tight"
          >
            {content.titleLine1}
          </span>
        </span>

        {/* Dòng 2: Việt Nam uy nghi kết hợp nét thanh nhã đương đại */}
        <span className="block overflow-hidden py-1 sm:py-2 -mt-1 sm:-mt-2">
          <span
            ref={titleLine2Ref}
            className="block text-[clamp(2.8rem,7vw,6.5rem)] font-normal italic text-neutral-dark leading-[1.05] tracking-normal"
          >
            {content.titleLine2}
          </span>
        </span>
      </h1>

      {/* ================= 3. PHỤ ĐỀ THI VỊ ================= */}
      {content.subTitle && (
        <p
          ref={subTitleRef}
          className="font-headline italic text-base sm:text-xl lg:text-2xl text-gold font-medium mb-4 sm:mb-5 leading-snug"
        >
          &ldquo;{content.subTitle}&rdquo;
        </p>
      )}

      {/* ================= 4. MÔ TẢ TRẢI NGHIỆM ================= */}
      <p
        ref={descRef}
        className="text-sm sm:text-base lg:text-lg text-ink-muted leading-relaxed max-w-xl mb-6 sm:mb-8 font-normal"
      >
        {content.description}
      </p>

      {/* ================= 5. CTA GROUP ================= */}
      <div
        ref={ctaGroupRef}
        className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8 sm:mb-12"
      >
        {/* CTA Chính */}
        <Link href={content.primaryCta.href} className="inline-block">
          <Button
            size="lg"
            variant="primary"
            className="h-12 sm:h-14 px-6 sm:px-8 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all border border-gold/40 flex items-center gap-2.5"
          >
            <Sparkles className="w-4 h-4 text-turmeric" />
            <span>{content.primaryCta.label}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>

        {/* CTA Phụ */}
        <Link href={content.secondaryCta.href} className="inline-block">
          <Button
            size="lg"
            variant="secondary"
            className="h-12 sm:h-14 px-6 sm:px-8 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xs hover:border-primary/50 transition-all flex items-center gap-2"
          >
            <Utensils className="w-4 h-4 text-ink-muted" />
            <span>{content.secondaryCta.label}</span>
          </Button>
        </Link>

        {/* CTA Lối tắt AI */}
        {content.aiAdvisorCta && (
          <Link href={content.aiAdvisorCta.href} className="inline-block">
            <Button
              size="lg"
              variant="outline"
              className="h-12 sm:h-14 px-5 sm:px-6 rounded-full text-xs sm:text-sm font-semibold tracking-wide border-primary/30 text-primary hover:bg-surface-warm transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-primary" />
              <span>{content.aiAdvisorCta.label}</span>
            </Button>
          </Link>
        )}
      </div>

      {/* ================= 6. METRICS DI SẢN BÁO CÔNG ================= */}
      <div
        ref={metricsRef}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-border/70 max-w-xl"
      >
        {content.metrics.map((metric, idx) => (
          <div
            key={idx}
            className="p-3 sm:p-3.5 rounded-2xl bg-surface/75 backdrop-blur-xs border border-border/60 shadow-xs hover:border-primary/30 transition-colors"
          >
            <span className="font-headline text-2xl sm:text-3xl font-bold text-primary block leading-none mb-1.5">
              {metric.value}
            </span>
            <p className="text-[11px] sm:text-xs text-ink font-semibold leading-tight mb-0.5">
              {metric.label}
            </p>
            {metric.sub && (
              <span className="text-[10px] text-ink-muted font-normal block leading-tight">
                {metric.sub}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
