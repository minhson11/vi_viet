"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Utensils, Sparkles } from "lucide-react";
import { createHeroTimeline } from "../animations/hero.timeline";

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      createHeroTimeline("#hero-content");
    }
  }, []);

  return (
    <section ref={containerRef} id="hero-content" className="relative py-24 text-center px-4 bg-cream/40">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-red/10 text-brand-red text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-turmeric" />
          <span>Hương vị quê nhà • Đượm nồng bếp mẹ</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold font-serif text-ink tracking-tight">
          VỊ VIỆT <br />
          <span className="text-brand-red">Món Ngon Ký Ức</span>
        </h1>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-ink-muted">
          Những món ăn gói trọn hồn cốt Việt, tỉ mẩn từ khâu chọn gạo, hầm xương cho tới gia vị truyền thống.
        </p>

        <div className="hero-actions flex justify-center gap-4 pt-4">
          <Link href="/thuc-don">
            <Button variant="primary" size="lg">
              <Utensils className="w-5 h-5 mr-2" />
              <span>Khám phá thực đơn</span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

