import React from "react";

export default function Loading() {
  return (
    <div
      id="cinematic-intro"
      className="curtain-closed fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Đang tải trang Vị Việt"
    >
      {/* 2 Cánh rèm sân khấu khép kín */}
      <div className="intro-curtain-left" />
      <div className="intro-curtain-right" />

      {/* Nội dung loading */}
      <div className="intro-content flex flex-col items-center text-center px-6 max-w-lg w-full">
        {/* Logo với Vòng Tròn Sáng Xoay Ôm Sát */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 110 110"
            >
              <defs>
                <linearGradient id="goldSpinGradientLoading" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
                  <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.15" />
                </linearGradient>
                <filter id="goldGlowLoading" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Vòng nền đệm */}
              <circle
                cx="55"
                cy="55"
                r="48"
                fill="none"
                stroke="rgba(217, 119, 6, 0.18)"
                strokeWidth="3"
              />

              {/* Vệt sáng hoàng kim xoay tròn ôm dính quanh logo */}
              <circle
                cx="55"
                cy="55"
                r="48"
                fill="none"
                stroke="url(#goldSpinGradientLoading)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="80 220"
                filter="url(#goldGlowLoading)"
                className="origin-center animate-spin"
                style={{ animationDuration: "0.95s" }}
              />
            </svg>

            {/* Khối Logo Vị Việt */}
            <div className="w-16 h-16 sm:w-19 sm:h-19 rounded-full border border-gold/40 p-2 bg-[#1c1917] shadow-[0_0_30px_rgba(217,119,6,0.45)] flex items-center justify-center z-10 glow-halo">
              <img
                alt="Logo Vị Việt"
                className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-[0_4px_8px_rgba(217,119,6,0.6)]"
                src="/logo-emblem.svg"
              />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden mb-2">
          <h2 className="font-headline text-2xl sm:text-3xl text-white font-bold tracking-tight">
            VỊ VIỆT
          </h2>
          <div className="gold-shine absolute inset-0 w-24 bg-gradient-to-r from-transparent via-gold/50 to-transparent pointer-events-none" />
        </div>

        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-gold font-semibold">
          ĐANG CHUẨN BỊ BÀN TIỆC...
        </p>
      </div>
    </div>
  );
}
