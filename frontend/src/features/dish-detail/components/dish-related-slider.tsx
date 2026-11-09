"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";
import { formatVND } from "@/lib/utils/currency";
import { Dish } from "@/features/admin-catalog/types";

interface DishRelatedSliderProps {
  relatedDishes: Dish[];
}

export function DishRelatedSlider({ relatedDishes }: DishRelatedSliderProps) {
  if (relatedDishes.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
      <div className="border-t border-border/70 pt-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              Gợi ý từ Bếp Mẹ
            </span>
            <h3 className="font-headline text-2xl font-black text-ink mt-1">
              Mỹ Vị Di Sản Dùng Kèm Hoàn Hảo
            </h3>
          </div>
          <Link
            href="/thuc-don"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả thực đơn</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {relatedDishes.map((rDish) => (
            <Link
              key={rDish.id}
              href={`/mon/${rDish.slug}`}
              className="group p-3 rounded-2xl bg-surface border border-border/80 shadow-2xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-warm">
                  <Image
                    src={rDish.image_url || "/placeholder-dish.jpg"}
                    alt={rDish.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-ink group-hover:text-primary transition-colors line-clamp-1">
                    {rDish.name}
                  </h4>
                  <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                    {rDish.category?.name || "Mỹ vị truyền thống"}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between mt-auto">
                <span className="text-xs sm:text-sm font-bold font-mono text-primary">
                  {formatVND(Number(rDish.base_price || 0))}
                </span>
                <span className="text-[10px] text-ink-muted group-hover:text-primary transition-colors">
                  Chi tiết →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
