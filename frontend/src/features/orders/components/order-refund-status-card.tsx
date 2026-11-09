"use client";

import React from "react";
import Link from "next/link";
import { XCircle, ShoppingBag, RotateCcw, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils/currency";
import { Order } from "../api/orders.api";

interface OrderRefundStatusCardProps {
  order: Order;
  isExpired: boolean;
  isRefunded: boolean;
  isRefundPending: boolean;
  succeededRefund: any;
}

export function OrderRefundStatusCard({
  order,
  isExpired,
  isRefunded,
  isRefundPending,
  succeededRefund,
}: OrderRefundStatusCardProps) {
  return (
    <div className="space-y-3">
      {/* Khung Thông Báo Đã Hủy */}
      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl space-y-3 text-xs text-red-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-red-700">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>
              {isExpired
                ? "Đơn hàng đã tự động hủy do hết thời hạn thanh toán"
                : isRefunded
                ? "Đơn hàng đã hủy & Đã hoàn tiền thành công"
                : "Đơn hàng này đã được hủy"}
            </span>
          </div>

          <Link href="/thuc-don">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-red-200 text-red-700 hover:bg-red-100/60 font-semibold flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Đặt lại bữa ăn</span>
            </Button>
          </Link>
        </div>

        {order.cancel_reason && (
          <p className="text-xs pl-7">
            <strong>Lý do:</strong> {order.cancel_reason}
          </p>
        )}

        {isExpired && (
          <p className="text-[11px] pl-7 text-red-800/80 leading-relaxed">
            * Để đảm bảo nguyên liệu tươi mới nhất không bị lưu giữ quá lâu, các đơn hàng thanh toán online chưa hoàn tất sau 15 phút sẽ tự động được giải phóng để phục vụ thực khách khác.
          </p>
        )}
      </div>

      {/* DÀNH RIÊNG CHO ĐƠN ĐÃ HOÀN TIỀN THÀNH CÔNG */}
      {isRefunded && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-xs space-y-3 text-xs text-emerald-950">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <RotateCcw className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Chi tiết Hoàn tiền</span>
            </div>
            <Badge variant="success" size="sm" className="bg-emerald-600 text-white font-bold">
              Đã hoàn tất
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-emerald-700 block text-[11px]">Số tiền hoàn lại:</span>
              <span className="font-bold text-base text-emerald-900 font-mono">
                {formatVND(Number(succeededRefund?.amount || order.total_amount))}
              </span>
            </div>
            <div>
              <span className="text-emerald-700 block text-[11px]">Phương thức nhận tiền:</span>
              <span className="font-semibold text-emerald-900">
                {order.payment_method === "VNPAY" ? "Cổng VNPay / Thẻ ngân hàng liên kết" : "Chuyển khoản VietQR"}
              </span>
            </div>
            {succeededRefund?.provider_refund_id && (
              <div>
                <span className="text-emerald-700 block text-[11px]">Mã giao dịch đối soát:</span>
                <span className="font-mono text-emerald-900 font-bold">
                  {succeededRefund.provider_refund_id}
                </span>
              </div>
            )}
            {succeededRefund?.refunded_at && (
              <div>
                <span className="text-emerald-700 block text-[11px]">Thời gian hoàn tất:</span>
                <span className="text-emerald-900">
                  {new Date(succeededRefund.refunded_at).toLocaleString("vi-VN")}
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-emerald-800/90 pt-1 border-t border-emerald-200/80 leading-relaxed">
            ✓ Tiền đã được hoàn trả thành công. Tùy theo ngân hàng phát hành thẻ, số dư tài khoản của bạn sẽ được cập nhật trong ngày hoặc 1-3 ngày làm việc.
          </p>
        </div>
      )}

      {/* DÀNH RIÊNG CHO ĐƠN ĐANG CHỜ ĐỐI SOÁT HOÀN TIỀN */}
      {isRefundPending && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-xs space-y-2 text-xs text-amber-950">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Tiến độ Hoàn tiền</span>
            </div>
            <Badge variant="warning" size="sm" className="bg-amber-500 text-white font-bold">
              Đang đối soát
            </Badge>
          </div>
          <p className="leading-relaxed">
            Yêu cầu hoàn trả <strong>{formatVND(Number(order.total_amount))}</strong> của bạn đã được ghi nhận vào hệ thống đối soát. Nhà hàng đang làm việc với cổng thanh toán để chuyển trả lại tài khoản trong 24-48 giờ làm việc.
          </p>
        </div>
      )}

      {/* ĐƠN PAID VNPAY NHƯNG CHƯA TẠO BẢN GHI REFUND */}
      {!isRefunded && !isRefundPending && order.payment_method === "VNPAY" && order.payment_status === "PAID" && (
        <div className="p-3 bg-red-100/70 border border-red-300 rounded-xl text-[11px] text-red-900 leading-relaxed">
          <strong>Lưu ý hoàn tiền:</strong> Khoản tiền bạn đã thanh toán qua VNPay sẽ được nhà hàng đối soát và hoàn trả lại theo quy trình trong 24-48 giờ làm việc. Nếu cần gấp, vui lòng liên hệ hotline 1900 1234.
        </div>
      )}
    </div>
  );
}
