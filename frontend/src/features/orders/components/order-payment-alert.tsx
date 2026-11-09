"use client";

import React from "react";
import { CreditCard, Timer, ExternalLink, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderPaymentAlertProps {
  formattedCountdown: string | null;
  secondsLeft: number | null;
  isPaying: boolean;
  isCancelling: boolean;
  onPayVnpay: () => void;
  onOpenCancelModal: () => void;
  onReloadOrder: () => void;
}

export function OrderPaymentAlert({
  formattedCountdown,
  secondsLeft,
  isPaying,
  isCancelling,
  onPayVnpay,
  onOpenCancelModal,
  onReloadOrder,
}: OrderPaymentAlertProps) {
  return (
    <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Đơn hàng đang chờ thanh toán qua VNPay</span>
          </div>
          <p className="text-xs text-amber-800/90 leading-relaxed">
            Vui lòng hoàn tất thanh toán để quán giữ nguyên liệu tươi mới và chuyển đơn sang bếp chế biến.
          </p>
        </div>

        {/* Countdown Badge */}
        {formattedCountdown && (
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono font-bold text-base shrink-0 self-start sm:self-auto ${
              (secondsLeft || 0) <= 180
                ? "bg-red-100 border-red-300 text-red-700 animate-pulse"
                : "bg-white border-amber-300 text-amber-900 shadow-xs"
            }`}
          >
            <Timer className="w-4 h-4 text-amber-600" />
            <span>{formattedCountdown}</span>
            <span className="text-[10px] font-sans font-normal text-ink-muted">còn lại</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={onPayVnpay}
          disabled={isPaying || (secondsLeft !== null && secondsLeft <= 0)}
          className="bg-brand-red hover:bg-brand-red/90 text-cream font-bold shadow-md flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>{isPaying ? "Đang mở cổng VNPay..." : "Thanh toán VNPay ngay"}</span>
        </Button>

        <Button
          variant="outline"
          size="md"
          onClick={onOpenCancelModal}
          disabled={isCancelling || isPaying}
          className="border-amber-300 text-amber-900 hover:bg-amber-100/60"
        >
          <XCircle className="w-4 h-4 mr-1.5 text-amber-700" />
          <span>Hủy đơn này</span>
        </Button>

        <button
          onClick={onReloadOrder}
          className="text-[11px] text-amber-800 underline hover:text-amber-950 font-medium ml-auto"
        >
          Tôi đã chuyển tiền, kiểm tra lại
        </button>
      </div>
    </div>
  );
}
