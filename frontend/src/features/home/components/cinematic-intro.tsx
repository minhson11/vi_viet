"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

interface CinematicIntroProps {
  durationMs?: number;
  onFinished?: () => void;
}

type CurtainPhase = "closed" | "closing" | "opening" | "idle";
type CurtainMode = "initial" | "transition";

export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  durationMs = 1400,
  onFinished,
}) => {
  const pathname = usePathname();
  const [phase, setPhase] = useState<CurtainPhase>("closed");
  const [mode, setMode] = useState<CurtainMode>("initial");
  const [progress, setProgress] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPathnameRef = useRef<string>(pathname);
  const isInitialFinishedRef = useRef<boolean>(false);
  const closeStartTimeRef = useRef<number>(0);
  const isWaitingForDataRef = useRef<boolean>(false);

  // Mở rèm (Opening)
  const openCurtains = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    isWaitingForDataRef.current = false;
    setPhase("opening");

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("viviet_intro_dismissed"));
    }

    // Sau khi rèm trượt dạt hoàn toàn sang 2 bên (750ms), đưa về trạng thái idle
    setTimeout(() => {
      setPhase("idle");
      onFinished?.();
    }, 750);
  }, [onFinished]);

  // Đóng rèm (Closing) - Phục vụ chuyển trang & Loading
  const closeCurtains = useCallback((customMode: CurtainMode = "transition") => {
    isWaitingForDataRef.current = true;
    closeStartTimeRef.current = Date.now();
    setMode(customMode);
    setPhase("closing");

    // Timeout an toàn: Nếu sau 3 giây trang không gửi tín hiệu data ready, tự động mở rèm
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    safetyTimeoutRef.current = setTimeout(() => {
      openCurtains();
    }, 3000);
  }, [openCurtains]);

  // Nhận tín hiệu khi trang đã nạp xong toàn bộ dữ liệu (Page Data Ready)
  const handlePageReady = useCallback(() => {
    if (phase === "closing" || phase === "closed") {
      const elapsed = Date.now() - closeStartTimeRef.current;
      // Đảm bảo rèm đã kịp khép kín hoàn toàn (tối thiểu 420ms) trước khi mở ra
      const minCloseTime = 420;
      const remainingDelay = Math.max(0, minCloseTime - elapsed);

      setTimeout(() => {
        openCurtains();
      }, remainingDelay);
    }
  }, [phase, openCurtains]);

  // 1. Quản lý Intro Lần Đầu (Initial Load)
  useEffect(() => {
    if (isInitialFinishedRef.current) return;

    const updateProgress = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const currentPct = Math.min(100, Math.round((elapsed / durationMs) * 100));

      setProgress(currentPct);

      if (elapsed < durationMs) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        isInitialFinishedRef.current = true;
        openCurtains();
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [durationMs, openCurtains]);

  // 2. Theo dõi chuyển trang (Pathname Change)
  useEffect(() => {
    if (lastPathnameRef.current !== pathname) {
      lastPathnameRef.current = pathname;

      // Timeout dự phòng cho các trang tĩnh không gọi API (sau 1.2s tự mở rèm)
      const fallbackTimer = setTimeout(() => {
        if (isWaitingForDataRef.current && (phase === "closing" || phase === "closed")) {
          openCurtains();
        }
      }, 1200);

      return () => clearTimeout(fallbackTimer);
    }
  }, [pathname, phase, openCurtains]);

  // 3. Bắt sự kiện click link nội bộ toàn cục & Custom Events
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Bỏ qua external link, anchor hash (#), new tab, mailto, tel, v.v.
      if (
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.getAttribute("target") === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      const currentPath = window.location.pathname;
      if (href === currentPath || href === window.location.pathname + window.location.search) {
        return;
      }

      closeCurtains("transition");
    };

    const handleExternalClose = () => closeCurtains("transition");
    const handleExternalOpen = () => openCurtains();

    document.addEventListener("click", handleLinkClick, { capture: true });
    window.addEventListener("viviet_curtain_close", handleExternalClose);
    window.addEventListener("viviet_curtain_open", handleExternalOpen);
    window.addEventListener("viviet_loading_start", handleExternalClose);
    window.addEventListener("viviet_loading_end", handleExternalOpen);
    window.addEventListener("viviet_page_ready", handlePageReady);

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      window.removeEventListener("viviet_curtain_close", handleExternalClose);
      window.removeEventListener("viviet_curtain_open", handleExternalOpen);
      window.removeEventListener("viviet_loading_start", handleExternalClose);
      window.removeEventListener("viviet_loading_end", handleExternalOpen);
      window.removeEventListener("viviet_page_ready", handlePageReady);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [closeCurtains, openCurtains, handlePageReady]);

  // Lời nhắn loading chuyển động theo % tiến trình
  let loadingText = "Đang nhóm bếp than hồng...";
  if (progress > 35 && progress <= 75) {
    loadingText = "Ủ hương thảo quả & quế hồi...";
  } else if (progress > 75) {
    loadingText = "Kính mời Quý khách thưởng vị...";
  }

  // Chu vi vòng tròn SVG (r = 52px -> circumference ≈ 326.73px)
  const circleRadius = 52;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circumference - (progress / 100) * circumference;

  const isDismissed = phase === "opening" || phase === "idle";
  const phaseClass = `curtain-${phase} ${isDismissed ? "dismissed" : ""}`;

  return (
    <div
      id="cinematic-intro"
      className={phaseClass}
      role="dialog"
      aria-modal="true"
      aria-label="Màn chào đón và tải trang Vị Việt"
    >
      {/* 2 Cánh rèm sân khấu Michelin */}
      <div className="intro-curtain-left" />
      <div className="intro-curtain-right" />

      {/* Nội dung tâm điểm */}
      <div className="intro-content flex flex-col items-center text-center px-6 max-w-lg w-full">
        {mode === "initial" ? (
          /* ================= CHẾ ĐỘ 1: CHÀO MỪNG LẦN ĐẦU (CIRCULAR PROGRESS QUANH LOGO) ================= */
          <>
            {/* Emblem với Vòng Tròn Loading Hoàng Kim Ôm Sát Quanh Logo */}
            <div className="relative mb-5 flex items-center justify-center">
              {/* SVG Vòng Tròn Tiến Trình */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                  viewBox="0 0 120 120"
                >
                  <defs>
                    <linearGradient id="goldProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <filter id="goldGlowInitial" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Vòng nền mờ đệm */}
                  <circle
                    cx="60"
                    cy="60"
                    r={circleRadius}
                    fill="none"
                    stroke="rgba(217, 119, 6, 0.18)"
                    strokeWidth="3"
                  />

                  {/* Vòng tiến trình sáng rực rỡ ôm sát quanh logo */}
                  <circle
                    cx="60"
                    cy="60"
                    r={circleRadius}
                    fill="none"
                    stroke="url(#goldProgressGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    filter="url(#goldGlowInitial)"
                    className="transition-[stroke-dashoffset] duration-100 ease-out"
                  />
                </svg>

                {/* Khối Logo Vị Việt Trung Tâm */}
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border border-gold/40 p-2 bg-[#1c1917] shadow-[0_0_35px_rgba(217,119,6,0.4)] flex items-center justify-center z-10 glow-halo">
                  <img
                    alt="Logo Vị Việt"
                    className="w-13 h-13 sm:w-15 sm:h-15 object-contain drop-shadow-[0_4px_10px_rgba(217,119,6,0.6)]"
                    src="/logo-emblem.svg"
                  />
                </div>

                {/* Huy hiệu hiển thị % hoặc Michelin Tag đính dưới chân logo */}
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold via-amber-400 to-gold text-white px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase shadow-md whitespace-nowrap z-20 border border-gold/40">
                  {progress < 100 ? `${progress}%` : "MICHELIN SELECTED"}
                </span>
              </div>
            </div>

            {/* Title & Golden Shine */}
            <div className="relative overflow-hidden mb-2">
              <h2 className="font-headline text-3xl sm:text-5xl text-white font-bold tracking-tight">
                VỊ VIỆT
              </h2>
              <div className="gold-shine absolute inset-0 w-28 bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            </div>

            <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-gold font-semibold mb-2">
              TINH HOA ẨM THỰC ĐƯƠNG ĐẠI
            </p>

            <p className="font-headline italic text-white/80 text-xs sm:text-sm max-w-md mb-4">
              Nơi ký ức ngàn năm hội tụ cùng nghệ thuật thị giác và vị giác đỉnh cao
            </p>

            {/* Dòng chữ nấu bếp di sản */}
            <p className="italic text-gold text-xs sm:text-sm font-medium mb-6">
              {loadingText}
            </p>

            {/* Nút Vào Ngay (Skip) */}
            <button
              type="button"
              onClick={openCurtains}
              className="cursor-pointer px-6 py-2.5 rounded-full bg-white/10 hover:bg-gold hover:text-white text-white/90 border border-gold/40 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm"
            >
              Vào Ngay &rarr;
            </button>
          </>
        ) : (
          /* ================= CHẾ ĐỘ 2: CHUYỂN TRANG / LOADING (VÒNG TRÒN XOAY DÍNH QUANH LOGO) ================= */
          <div className="flex flex-col items-center">
            {/* Logo với Vòng Tròn Sáng Xoay Ôm Sát */}
            <div className="relative mb-5 flex items-center justify-center">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 110 110"
                >
                  <defs>
                    <linearGradient id="goldSpinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
                      <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#d97706" stopOpacity="0.15" />
                    </linearGradient>
                    <filter id="goldGlowTransition" x="-20%" y="-20%" width="140%" height="140%">
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
                    stroke="url(#goldSpinGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="80 220"
                    filter="url(#goldGlowTransition)"
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
              <h3 className="font-headline text-2xl sm:text-3xl text-white font-bold tracking-tight">
                VỊ VIỆT
              </h3>
              <div className="gold-shine absolute inset-0 w-24 bg-gradient-to-r from-transparent via-gold/50 to-transparent pointer-events-none" />
            </div>

            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-gold font-semibold">
              ĐANG CHUẨN BỊ BÀN TIỆC...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
