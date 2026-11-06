"use client";

import React from "react";

export const BanhMiScene: React.FC = () => {
  return (
    <div className="py-16 px-4 max-w-5xl mx-auto flex flex-col md:flex-row-reverse items-center gap-8">
      <div className="flex-1 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-turmeric">Phân cảnh 2: Miền Nam</span>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-ink">Bánh Mì Giòn Sài Gòn</h2>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Âm thanh giòn tan khi cắn miếng đầu tiên, pate gan béo ngậy quyện cùng dưa leo giòn mát và sốt bơ trứng nhà làm.
        </p>
      </div>
      <div className="flex-1 aspect-video rounded-2xl bg-surface-hover border border-border flex items-center justify-center text-xs text-ink-light">
        [Phim trường Bánh Mì Phố Thị]
      </div>
    </div>
  );
};

