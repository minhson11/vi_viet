"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
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
      // Pleasant kitchen chime chord (E5 -> B5)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // AudioContext not allowed or not supported
    }
  };

  const loadQueue = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const list = await kitchenApi.getKitchenQueue();
      setTickets(list);

      // Play alert chime when new ticket arrives
      if (list.length > prevTicketCountRef.current && prevTicketCountRef.current > 0 && soundEnabled) {
        playKitchenChime();
      }
      prevTicketCountRef.current = list.length;
    } catch (err) {
      console.error("Failed to load kitchen queue:", err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    loadQueue();
    // Auto refresh kitchen queue every 8 seconds
    const interval = setInterval(() => {
      loadQueue(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  // Tick elapsed timer every 10 seconds for smooth UI updates
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
      console.error("Failed to start cooking:", err);
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
      console.error("Failed to finish cooking:", err);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* KDS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-brand-red" />
            <span>Màn hình Bếp KDS - Thắp Lửa Vị Việt</span>
          </h1>
          <p className="text-xs text-ink-muted">
            Điều phối chế biến trực tiếp tại bếp • Nhận đơn tức thì khi lễ tân duyệt
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-surface border border-border p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                filter === "ALL" ? "bg-ink text-surface shadow-xs" : "text-ink-muted hover:text-ink"
              }`}
            >
              Tất cả ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("CONFIRMED")}
              className={`px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${
                filter === "CONFIRMED" ? "bg-amber-600 text-white shadow-xs" : "text-ink-muted hover:text-ink"
              }`}
            >
              <span>Chờ nấu</span>
              <span className="text-[10px] bg-white/20 px-1 rounded-full">{waitingCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("PREPARING")}
              className={`px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${
                filter === "PREPARING" ? "bg-brand-red text-white shadow-xs" : "text-ink-muted hover:text-ink"
              }`}
            >
              <span>Đang nấu</span>
              <span className="text-[10px] bg-white/20 px-1 rounded-full">{preparingCount}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              soundEnabled
                ? "bg-herb/10 border-herb text-herb"
                : "bg-surface border-border text-ink-muted hover:bg-surface-hover"
            }`}
            title={soundEnabled ? "Âm thanh chuông báo bật" : "Âm thanh chuông báo tắt"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadQueue(false)}
            disabled={isLoading}
            title="Làm mới hàng đợi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main KDS Grid */}
      {isLoading && tickets.length === 0 ? (
        <div className="py-20 text-center text-xs text-ink-muted">
          Đang nạp hàng đợi chế biến từ bếp trung tâm...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-16 text-center space-y-3">
          <UtensilsCrossed className="w-12 h-12 text-herb mx-auto opacity-40" />
          <h3 className="font-bold text-base text-ink">Bếp hiện đang thảnh thơi</h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            Chưa có món ăn mới cần chế biến. Khi khách đặt món và lễ tân xác nhận tiếp nhận đơn, vé bếp sẽ tự động xuất hiện tức thì tại đây!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTickets.map((t) => {
            const elapsed = getElapsedMinutes(t.created_at);
            const isUrgent = elapsed >= 20;
            const isWarning = elapsed >= 12 && elapsed < 20;
            const isCooking = t.status === "PREPARING";

            return (
              <div
                key={t.id}
                className={`bg-surface border-2 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all ${
                  isUrgent
                    ? "border-red-500 ring-2 ring-red-300/60 bg-red-500/5 animate-pulse"
                    : isCooking
                    ? "border-brand-red bg-brand-red/5"
                    : isWarning
                    ? "border-amber-400 bg-amber-500/5"
                    : "border-border hover:border-border-strong"
                }`}
              >
                <div className="space-y-3">
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <span className="font-mono font-bold text-base text-ink tracking-tight">
                      #{t.order_code}
                    </span>
                    <Badge
                      variant={isCooking ? "brand" : "warning"}
                      size="sm"
                      className="font-bold uppercase tracking-wider"
                    >
                      {isCooking ? "ĐANG NẤU" : "CHỜ THẮP LỬA"}
                    </Badge>
                  </div>

                  {/* Timer & Fulfillment info */}
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded ${
                        isUrgent
                          ? "bg-red-100 text-red-800"
                          : isWarning
                          ? "bg-amber-100 text-amber-800"
                          : "bg-surface-hover text-ink-muted"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed} phút</span>
                      {isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-red-600 ml-1" />}
                    </span>
                    <span className="text-[11px] font-semibold text-brand-red uppercase">
                      {t.fulfillment_type === "DELIVERY" ? "🛵 Giao tận nơi" : "🥡 Mang đi / Bàn"}
                    </span>
                  </div>

                  {/* Customer General Note */}
                  {t.customer_note && (
                    <div className="p-2.5 bg-amber-500/15 border border-amber-300 rounded-lg text-xs text-amber-950 flex items-start gap-1.5">
                      <FileText className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold text-[10px] uppercase tracking-wider text-amber-900">
                          Lời dặn của khách:
                        </strong>
                        <p className="font-medium italic leading-relaxed">&ldquo;{t.customer_note}&rdquo;</p>
                      </div>
                    </div>
                  )}

                  {/* Items List in this Ticket */}
                  <div className="space-y-2 pt-1">
                    {t.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="bg-surface-hover/70 p-2.5 rounded-lg border border-border/50 text-xs space-y-1"
                      >
                        <div className="flex justify-between items-start font-bold text-ink">
                          <span className="text-sm leading-snug">{it.dish_name}</span>
                          <span className="text-base text-brand-red font-mono font-black ml-2 px-1.5 py-0.2 bg-brand-red/10 rounded">
                            x{it.quantity}
                          </span>
                        </div>

                        {it.variant_name && (
                          <div className="text-[11px] text-ink-muted">
                            Khẩu phần: <span className="font-semibold text-ink">{it.variant_name}</span>
                          </div>
                        )}

                        {it.options && it.options.length > 0 && (
                          <div className="text-[11px] text-ink-muted flex flex-wrap gap-1 pt-0.5">
                            {it.options.map((o, oIdx) => (
                              <span
                                key={oIdx}
                                className="bg-surface px-1.5 py-0.5 rounded border border-border font-medium text-ink"
                              >
                                {o.group_name}: <strong>{o.option_name}</strong>
                              </span>
                            ))}
                          </div>
                        )}

                        {it.note && (
                          <div className="text-[11px] text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded font-bold border border-amber-300 mt-1 inline-block">
                            ⚠️ Dặn dò: {it.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chef Big Action Button */}
                <div className="pt-4 border-t border-border mt-3">
                  {!isCooking ? (
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full h-11 text-sm font-bold bg-brand-red hover:bg-brand-red/90 text-white shadow-xs"
                      onClick={() => handleStartCooking(t.id)}
                      disabled={actionLoadingId === t.id}
                    >
                      <Flame className="w-5 h-5 mr-1.5 text-turmeric animate-bounce" />
                      <span>{actionLoadingId === t.id ? "Đang cập nhật..." : "BẮT ĐẦU NẤU (PREPARING)"}</span>
                    </Button>
                  ) : (
                    <Button
                      variant="herb"
                      size="md"
                      className="w-full h-11 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                      onClick={() => handleFinishCooking(t.id)}
                      disabled={actionLoadingId === t.id}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-1.5" />
                      <span>{actionLoadingId === t.id ? "Đang cập nhật..." : "ĐÃ NẤU XONG (READY)"}</span>
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
