"use client";

import React from "react";

export const RiceScene: React.FC = () => {
  return (
    <div className="py-16 px-4 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
      <div className="flex-1 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-turmeric">Phân cảnh 3: Sum vầy</span>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-ink">Mâm Cơm Niêu Gia Đình</h2>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Cơm niêu cháy giòn đáy nồi, ăn cùng tộ cá bống kho tiêu keo sánh và bát canh cua đồng mồng tơi mướt mát.
        </p>
      </div>
      <div className="flex-1 aspect-video rounded-2xl bg-surface-hover border border-border flex items-center justify-center text-xs text-ink-light">
        [Phim trường Cơm Niêu Đầm Ấm]
      </div>
    </div>
  );
};

