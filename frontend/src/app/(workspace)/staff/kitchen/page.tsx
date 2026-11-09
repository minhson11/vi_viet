"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  RefreshCw,
  Flame,
  AlertTriangle,
  Volume2,
  VolumeX,
  FileText,
  UtensilsCrossed,
} from "lucide-react";
import { kitchenApi, KitchenQueueItem } from "@/features/kitchen/api/kitchen.api";
import { useOrderEvents } from "@/features/orders/hooks/use-order-events";

export default function KitchenPage() {
  const [tickets, setTickets] = useState<KitchenQueueItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "CONFIRMED" | "PREPARING">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevTicketCountRef = useRef(0);

  const playKitchenChime = () => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // AudioContext fallback
    }
  };

  const loadQueue = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const list = await kitchenApi.getKitchenQueue();
      setTickets(list);

      // Phát chuông báo khi có vé gọi món mới
      if (list.length > prevTicketCountRef.current && prevTicketCountRef.current > 0 && soundEnabled) {
        playKitchenChime();
      }
      prevTicketCountRef.current = list.length;
    } catch (err) {
      console.error("Lỗi tải hàng đợi bếp:", err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    loadQueue();
    // Tự động làm mới mỗi 8 giây
    const interval = setInterval(() => {
      loadQueue(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  // Lắng nghe sự kiện SSE thời gian thực từ Backend
  useOrderEvents(
    useCallback(() => {
      loadQueue(true);
    }, [loadQueue])
  );

  // Cập nhật bộ đếm thời gian trôi qua mỗi 10 giây
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleStartCooking = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await kitchenApi.startCooking(orderId);
      await loadQueue(true);
    } catch (err) {
      console.error("Lỗi bắt đầu nấu:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFinishCooking = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await kitchenApi.finishCooking(orderId);
      await loadQueue(true);
    } catch (err) {
      console.error("Lỗi hoàn tất nấu:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getElapsedMinutes = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const preparingCount = tickets.filter((t) => t.status === "PREPARING").length;
  const waitingCount = tickets.filter((t) => t.status === "CONFIRMED").length;

  const filteredTickets = tickets.filter((t) => {
    if (filter === "CONFIRMED") return t.status === "CONFIRMED";
    if (filter === "PREPARING") return t.status === "PREPARING";
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. THANH ĐIỀU KHIỂN BẾP (KDS CONTROL BAR) */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-red text-cream flex items-center justify-center font-bold shadow-xs">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
                <span>Màn Hình Bếp KDS</span>
                <span className="text-[11px] bg-brand-red/10 text-brand-red font-bold px-2 py-0.5 rounded-full">
                  Thắp Lửa Vị Việt
                </span>
              </h1>
              <p className="text-xs text-ink-muted mt-0.5">
                Bảng vé bếp trực quan thời gian thực • Chữ lớn độ tương phản cao cho đầu bếp
              </p>
            </div>
          </div>
        </div>

        {/* Bộ đếm & Bộ lọc trạng thái */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Tabs chuyển trạng thái */}
          <div className="flex items-center gap-1 bg-surface-warm/60 border border-[#e2beba]/60 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filter === "ALL"
                  ? "bg-ink text-surface shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Tất cả ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("CONFIRMED")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === "CONFIRMED"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-amber-800 hover:bg-amber-100/50"
              }`}
            >
              <span>Chờ nấu</span>
              <span className="text-[10px] bg-white/30 px-1.5 py-0.2 rounded-full font-black">
                {waitingCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("PREPARING")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === "PREPARING"
                  ? "bg-brand-red text-white shadow-xs"
                  : "text-brand-red hover:bg-brand-red/10"
              }`}
            >
              <span>Đang nấu</span>
              <span className="text-[10px] bg-white/30 px-1.5 py-0.2 rounded-full font-black">
                {preparingCount}
              </span>
            </button>
          </div>

          {/* Bật/Tắt chuông báo */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              soundEnabled
                ? "bg-herb/15 border-herb/40 text-herb font-bold shadow-2xs"
                : "bg-surface border-border text-ink-muted hover:bg-surface-hover"
            }`}
            title={soundEnabled ? "Chuông báo vé mới đang BẬT" : "Chuông báo vé mới đang TẮT"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Nút Làm mới thủ công */}
          <button
            type="button"
            onClick={() => loadQueue(false)}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-ink transition-colors cursor-pointer disabled:opacity-50"
            title="Cập nhật hàng đợi ngay"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-red" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. LƯỚI VÉ BẾP CHẾ BIẾN (KITCHEN TICKETS GRID) */}
      {isLoading && tickets.length === 0 ? (
        <div className="py-24 text-center text-xs text-ink-muted bg-surface rounded-2xl border border-border">
          <RefreshCw className="w-8 h-8 text-brand-red animate-spin mx-auto mb-3" />
          <p className="font-semibold text-ink">Đang nạp dữ liệu hàng đợi từ bếp trung tâm...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-16 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-herb/10 text-herb flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-lg text-ink">Bếp Hiện Đang Thảnh Thơi</h3>
          <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
            Hiện không có món nào cần nấu. Khi khách đặt món và lễ tân xác nhận, vé bếp sẽ tự động xuất hiện tức thì kèm chuông báo tại đây!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredTickets.map((t) => {
            const elapsed = getElapsedMinutes(t.created_at);
            const isUrgent = elapsed >= 20;
            const isWarning = elapsed >= 12 && elapsed < 20;
            const isCooking = t.status === "PREPARING";

            return (
              <div
                key={t.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all border-2 ${
                  isUrgent
                    ? "border-red-500 ring-2 ring-red-400/50 bg-red-50/20"
                    : isCooking
                    ? "border-brand-red ring-1 ring-brand-red/30 bg-[#fdf8f6]"
                    : isWarning
                    ? "border-amber-400 bg-amber-50/20"
                    : "border-border hover:border-brand-red/50"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Header vé bếp: Mã đơn & Trạng thái */}
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <span className="font-mono font-black text-xl text-ink tracking-tight">
                      #{t.order_code}
                    </span>
                    <span
                      className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        isCooking
                          ? "bg-brand-red text-white shadow-xs"
                          : "bg-amber-500 text-white shadow-xs"
                      }`}
                    >
                      {isCooking ? "🔥 ĐANG NẤU" : "⏳ CHỜ THẮP LỬA"}
                    </span>
                  </div>

                  {/* Bộ đếm thời gian & Hình thức nhận món */}
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                        isUrgent
                          ? "bg-red-600 text-white animate-pulse"
                          : isWarning
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-[#fdeae3] text-brand-red"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed} phút</span>
                      {isUrgent && <AlertTriangle className="w-3.5 h-3.5 ml-1 text-white" />}
                    </span>

                    <span className="text-[11px] font-extrabold uppercase text-ink-muted">
                      {t.fulfillment_type === "DELIVERY" ? "🛵 Giao Tận Nơi" : "🥡 Dùng Tại Bàn"}
                    </span>
                  </div>

                  {/* Lời dặn chung của khách hàng (Nếu có) */}
                  {t.customer_note && (
                    <div className="p-3 bg-amber-100/90 border-2 border-amber-400 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-black text-[10px] uppercase tracking-wider text-amber-900">
                          LỜI DẶN ĐẶC BIỆT:
                        </strong>
                        <p className="font-bold italic leading-relaxed">&ldquo;{t.customer_note}&rdquo;</p>
                      </div>
                    </div>
                  )}

                  {/* DANH SÁCH MÓN ĂN - CHỮ LỚN CHO ĐẦU BẾP DỄ NHÌN */}
                  <div className="space-y-2.5 pt-1">
                    {t.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="bg-[#fff8f6] p-3 rounded-xl border border-[#e2beba]/60 space-y-1.5 shadow-2xs"
                      >
                        {/* Tên món & Số lượng cực lớn */}
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-base sm:text-lg font-black text-ink leading-tight">
                            {it.dish_name}
                          </span>
                          <span className="text-xl sm:text-2xl text-white bg-brand-red font-mono font-black px-2.5 py-0.5 rounded-lg shrink-0 shadow-xs">
                            x{it.quantity}
                          </span>
                        </div>

                        {/* Khẩu phần / Biến thể */}
                        {it.variant_name && (
                          <div className="inline-block text-xs font-bold text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/60">
                            Khẩu phần: <strong>{it.variant_name}</strong>
                          </div>
                        )}

                        {/* Topping & Tùy chọn đi kèm */}
                        {it.options && it.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {it.options.map((o, oIdx) => (
                              <span
                                key={oIdx}
                                className="bg-white px-2 py-0.5 rounded border border-border text-[11px] font-semibold text-ink"
                              >
                                {o.group_name}: <strong>{o.option_name}</strong>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Dặn dò riêng từng món */}
                        {it.note && (
                          <div className="p-1.5 bg-red-100/90 text-red-950 font-black text-[11px] rounded border border-red-300 block">
                            ⚠️ Dặn món: {it.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. NÚT ĐIỀU PHỐI TRẠNG THÁI TO RÕ CHO ĐẦU BẾP (1 CHẠM LÀ XONG) */}
                <div className="pt-4 border-t border-border mt-4">
                  {!isCooking ? (
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full h-12 text-sm sm:text-base font-black bg-brand-red hover:bg-brand-red-hover text-white shadow-md active:scale-95 transition-all cursor-pointer rounded-xl flex items-center justify-center gap-2"
                      onClick={() => handleStartCooking(t.id)}
                      disabled={actionLoadingId === t.id}
                    >
                      <Flame className="w-5 h-5 text-turmeric animate-bounce" />
                      <span>{actionLoadingId === t.id ? "Đang Cập Nhật..." : "🔥 BẮT ĐẦU NẤU"}</span>
                    </Button>
                  ) : (
                    <Button
                      variant="herb"
                      size="md"
                      className="w-full h-12 text-sm sm:text-base font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md active:scale-95 transition-all cursor-pointer rounded-xl flex items-center justify-center gap-2"
                      onClick={() => handleFinishCooking(t.id)}
                      disabled={actionLoadingId === t.id}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{actionLoadingId === t.id ? "Đang Cập Nhật..." : "✅ ĐÃ NẤU XONG (BÁO READY)"}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
