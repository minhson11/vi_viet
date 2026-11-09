"use client";

import React from "react";
import { CheckCircle2, CreditCard, Clock, ChefHat, Truck, Sparkles } from "lucide-react";

interface OrderJourneyTimelineProps {
  isPendingPayment: boolean;
  isConfirmed: boolean;
  isCooking: boolean;
  isDelivering: boolean;
  isCompleted: boolean;
}

export function OrderJourneyTimeline({
  isPendingPayment,
  isConfirmed,
  isCooking,
  isDelivering,
  isCompleted,
}: OrderJourneyTimelineProps) {
  return (
    <div className="p-5 bg-surface border border-border rounded-xl space-y-4 shadow-xs">
      <div className="grid grid-cols-5 gap-2 text-center text-xs relative">
        {/* Step 1: Chờ xác nhận hoặc Chờ thanh toán */}
        <div
          className={`flex flex-col items-center relative z-10 ${
            isConfirmed
              ? "text-emerald-600 font-semibold"
              : "text-amber-600 font-bold"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all ${
              isConfirmed
                ? "bg-emerald-100 text-emerald-700"
                : isPendingPayment
                ? "bg-amber-100 text-amber-700 ring-4 ring-amber-100 animate-pulse"
                : "bg-amber-100 text-amber-700 ring-4 ring-amber-50 animate-pulse"
            }`}
          >
            {isConfirmed ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isPendingPayment ? (
              <CreditCard className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>
          <span className="text-[11px] leading-tight">
            {isPendingPayment ? "Chờ thanh toán" : "Chờ xác nhận"}
          </span>
        </div>

        {/* Step 2: Quán đã tiếp nhận */}
        <div
          className={`flex flex-col items-center relative z-10 ${
            isConfirmed
              ? isCooking
                ? "text-emerald-600 font-semibold"
                : "text-brand-red font-bold"
              : "text-ink-muted"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all ${
              isCooking
                ? "bg-emerald-100 text-emerald-700"
                : isConfirmed
                ? "bg-brand-red text-cream ring-4 ring-brand-red/10"
                : "bg-surface-hover text-ink-muted"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] leading-tight">Tiếp nhận</span>
        </div>

        {/* Step 3: Bếp thắp lửa */}
        <div
          className={`flex flex-col items-center relative z-10 ${
            isCooking
              ? isDelivering
                ? "text-emerald-600 font-semibold"
                : "text-brand-red font-bold"
              : "text-ink-muted"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all ${
              isDelivering
                ? "bg-emerald-100 text-emerald-700"
                : isCooking
                ? "bg-brand-red text-cream ring-4 ring-brand-red/10 animate-pulse"
                : "bg-surface-hover text-ink-muted"
            }`}
          >
            <ChefHat className="w-4 h-4" />
          </div>
          <span className="text-[11px] leading-tight">Bếp nấu</span>
        </div>

        {/* Step 4: Đang giao */}
        <div
          className={`flex flex-col items-center relative z-10 ${
            isDelivering
              ? isCompleted
                ? "text-emerald-600 font-semibold"
                : "text-brand-red font-bold"
              : "text-ink-muted"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all ${
              isCompleted
                ? "bg-emerald-100 text-emerald-700"
                : isDelivering
                ? "bg-brand-red text-cream ring-4 ring-brand-red/10 animate-bounce"
                : "bg-surface-hover text-ink-muted"
            }`}
          >
            <Truck className="w-4 h-4" />
          </div>
          <span className="text-[11px] leading-tight">Đang giao</span>
        </div>

        {/* Step 5: Hoàn thành */}
        <div
          className={`flex flex-col items-center relative z-10 ${
            isCompleted ? "text-emerald-600 font-bold" : "text-ink-muted"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all ${
              isCompleted
                ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                : "bg-surface-hover text-ink-muted"
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[11px] leading-tight">Hoàn tất</span>
        </div>

        {/* Continuous Progress Bar Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-border -z-0">
          <div
            className="h-full bg-brand-red transition-all duration-500"
            style={{
              width: isCompleted
                ? "100%"
                : isDelivering
                ? "75%"
                : isCooking
                ? "50%"
                : isConfirmed
                ? "25%"
                : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
