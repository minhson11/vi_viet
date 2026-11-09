"use client";

import { useCallback, useRef } from "react";

export interface AudioChimeOptions {
  frequencies?: number[]; // Tần số các nốt nhạc (Hz), mặc định D5 (587.33) -> A5 (880)
  duration?: number; // Thời lượng tính bằng giây, mặc định 0.4s
  volume?: number; // Âm lượng từ 0.0 đến 1.0, mặc định 0.2
}

/**
 * Hook phát âm thanh thông báo bằng Web Audio API thuần (không cần nạp file mp3)
 */
export function useAudioNotification() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = useCallback((options?: AudioChimeOptions) => {
    if (typeof window === "undefined") return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtxClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const duration = options?.duration ?? 0.4;
      const volume = options?.volume ?? 0.2;
      const freqs = options?.frequencies ?? [587.33, 880];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freqs[0], ctx.currentTime);
      if (freqs.length > 1) {
        osc.frequency.setValueAtTime(freqs[1], ctx.currentTime + 0.15);
      }

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Bỏ qua lỗi âm thanh nếu trình duyệt chặn autoplay
    }
  }, []);

  return { playChime };
}
