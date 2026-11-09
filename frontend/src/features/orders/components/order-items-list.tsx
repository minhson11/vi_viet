"use client";

import React from "react";
import { Star, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils/currency";
import { Order, OrderItem } from "../api/orders.api";

interface OrderItemsListProps {
  order: Order;
  isCompleted: boolean;
  canCancel: boolean;
  isCancelling: boolean;
  onOpenReviewModal: (item: OrderItem) => void;
  onOpenCancelModal: () => void;
}

export function OrderItemsList({
  order,
  isCompleted,
  canCancel,
  isCancelling,
  onOpenReviewModal,
  onOpenCancelModal,
}: OrderItemsListProps) {
  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.delivery_fee || 0);
  const foodDiscount = Number(order.food_discount || 0);
  const shippingDiscount = Number(order.shipping_discount || 0);
  const totalDiscount = foodDiscount + shippingDiscount;
  const totalAmount = Number(order.total_amount || 0);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
        Món ăn đã gọi ({order.items?.length || 0})
      </h3>
      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface">
        {order.items && order.items.length > 0 ? (
          order.items.map((it, idx) => (
            <div
              key={idx}
              className="p-3.5 flex flex-col gap-2.5 text-xs hover:bg-surface-hover/30 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="font-bold text-ink text-sm">
                    {it.quantity}x {it.dish_name}
                  </span>
                  {it.variant_name && (
                    <p className="text-[11px] text-ink-muted">Khẩu phần: {it.variant_name}</p>
                  )}
                  {it.options && it.options.length > 0 && (
                    <p className="text-[11px] text-ink-muted">
                      Tùy chọn: {it.options.map((o) => o.option_name).join(", ")}
                    </p>
                  )}
                  {it.note && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block border border-amber-200">
                      Ghi chú riêng: {it.note}
                    </p>
                  )}
                </div>
                <span className="font-mono font-bold text-ink text-sm">
                  {formatVND(Number(it.line_total))}
                </span>
              </div>

              {/* KHỐI ĐÁNH GIÁ MÓN KHI ĐƠN HOÀN TẤT */}
              {isCompleted && (
                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  {it.review ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (it.review?.rating || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "text-border"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        Bạn đã đánh giá {it.review.rating} sao
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-ink-muted italic">
                      Bạn đã thưởng thức món này như thế nào?
                    </span>
                  )}

                  <button
                    onClick={() => onOpenReviewModal(it)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red hover:underline cursor-pointer ml-auto"
                  >
                    <Star className="w-3.5 h-3.5 fill-brand-red text-brand-red" />
                    <span>{it.review ? "Chỉnh sửa đánh giá" : "Đánh giá món này"}</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-ink-muted">Không có dữ liệu món ăn</div>
        )}
      </div>

      {/* Pricing Summary */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-2 text-xs">
        <div className="flex justify-between text-ink-muted">
          <span>Tiền món ăn:</span>
          <span className="font-mono text-ink">{formatVND(subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink-muted">
          <span>Phí giao hàng:</span>
          <span className="font-mono text-ink">{formatVND(deliveryFee)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Ưu đãi áp dụng:</span>
            <span className="font-mono">-{formatVND(totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm text-ink pt-2 border-t border-border">
          <span>Tổng thanh toán:</span>
          <span className="font-mono text-brand-red text-base">{formatVND(totalAmount)}</span>
        </div>
      </div>

      {/* Bottom Action: Cancellation Button */}
      {canCancel && (
        <div className="pt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCancelModal}
            disabled={isCancelling}
            className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-semibold"
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            <span>Hủy đơn hàng này</span>
          </Button>
        </div>
      )}
    </div>
  );
}
