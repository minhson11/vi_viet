"use client";

import React from "react";

export const PhoScene: React.FC = () => {
  return (
    <div className="py-16 px-4 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
      <div className="flex-1 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-turmeric">Phân cảnh 1: Miền Bắc</span>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-ink">Bát Phở Nóng Sáng Mùa Đông</h2>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Nồi nước dùng sôi lăn tăn toả làn khói nghi ngút mùi gừng nướng, thảo quả, quế chi và hành hoa thái nhỏ...
        </p>
      </div>
      <div className="flex-1 aspect-video rounded-2xl bg-surface-hover border border-border flex items-center justify-center text-xs text-ink-light">
        [Phim trường Phở Bò Bếp Mẹ]
      </div>
    </div>
  );
};

