"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, Clock, Zap, Flame } from "lucide-react";
import { Dish } from "@/features/admin-catalog/types";

interface DishHeroGalleryProps {
  dish: Dish;
  galleryImages: string[];
  selectedImageIndex: number;
  onSelectImageIndex: (index: number) => void;
  currentImageUrl: string;
}

export function DishHeroGallery({
  dish,
  galleryImages,
  selectedImageIndex,
  onSelectImageIndex,
  currentImageUrl,
}: DishHeroGalleryProps) {
  const spicyLevel = dish.spicy_level || 0;

  const spicyText = (() => {
    if (spicyLevel === 0) return "Không cay (0/3)";
    if (spicyLevel === 1) return "Cay nhẹ (1/3)";
    if (spicyLevel === 2) return "Cay vừa (2/3)";
    return "Cay nồng (3/3)";
  })();

  return (
    <div className="lg:col-span-7 space-y-4">
      {/* Khung Ảnh Chính Tỷ Lệ Vàng 4:3 */}
      <div className="relative rounded-3xl overflow-hidden bg-surface border border-border shadow-xl group">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={currentImageUrl}
            alt={dish.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 700px"
            className="object-cover object-center transform transition-transform duration-700 hover:scale-105"
          />

          {/* Gradient che nhẹ đáy */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent pointer-events-none" />

          {/* Con Triện Bếp Mẹ Góc Trái */}
          <div className="absolute top-4 left-4 z-10 bg-primary/95 text-cream rounded-2xl px-3.5 py-2 shadow-xl border border-gold/40 flex items-center gap-2 backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-turmeric shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-cream">
              Ẩm Thực Di Sản · Vị Việt
            </span>
          </div>
        </div>
      </div>

      {/* Danh Sách Thumbnail Các Góc Chụp (Nếu có từ 2 ảnh trở lên) */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {galleryImages.map((imgUrl, idx) => {
            const isSelected = idx === selectedImageIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectImageIndex(idx)}
                className={`relative w-20 sm:w-24 aspect-square rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer p-1 bg-surface ${
                  isSelected
                    ? "border-primary ring-3 ring-primary/20 scale-102 shadow-md"
                    : "border-border hover:border-primary/40 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src={imgUrl}
                    alt={`${dish.name} - góc chụp ${idx + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 3 Thẻ Đặc Tính Ẩm Thực: Thời gian chế biến, Năng lượng & Mức độ cay */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        {/* Thẻ 1: Thời gian chế biến */}
        <div className="p-3.5 rounded-2xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
              Thời gian chế biến
            </span>
            <h4 className="text-sm font-bold text-ink font-mono mt-0.5">
              {dish.prep_time_minutes ? `${dish.prep_time_minutes} phút` : "15 phút"}
            </h4>
            <p className="text-[10px] text-ink-muted truncate mt-0.5" title="Dự kiến hiển thị tại màn hình KDS nhà bếp">
              Dự kiến hiển thị tại KDS bếp
            </p>
          </div>
        </div>

        {/* Thẻ 2: Năng lượng (Kcal) */}
        <div className="p-3.5 rounded-2xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
              Năng lượng (Kcal)
            </span>
            <h4 className="text-sm font-bold text-ink font-mono mt-0.5">
              {dish.calories ? `${dish.calories} Kcal` : "450 Kcal"}
            </h4>
            <p className="text-[10px] text-ink-muted truncate mt-0.5" title="Tùy chọn hiển thị cho khách theo dõi dinh dưỡng">
              Theo dõi dinh dưỡng
            </p>
          </div>
        </div>

        {/* Thẻ 3: Mức độ cay */}
        <div className="p-3.5 rounded-2xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              spicyLevel > 0
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-border bg-surface-hover text-ink-muted"
            }`}
          >
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
              Mức độ cay
            </span>
            <h4 className="text-sm font-bold text-ink mt-0.5 flex items-center gap-1.5">
              <span>{spicyText}</span>
            </h4>
            <p className="text-[10px] text-ink-muted truncate mt-0.5">
              {spicyLevel > 0 ? "Gia vị ớt tiêu tươi bản địa" : "Vị thanh dịu, dễ thưởng thức"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
