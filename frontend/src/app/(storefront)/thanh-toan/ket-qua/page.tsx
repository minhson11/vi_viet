"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShoppingBag,
  Flame,
  Clock,
  PhoneCall,
  RotateCcw,
} from "lucide-react";
import { formatVND } from "@/lib/utils/currency";

function PaymentResultContent() {
  const searchParams = useSearchParams();

  const responseCode = searchParams.get("vnp_ResponseCode") || searchParams.get("responseCode");
  const status = searchParams.get("status");
  const orderCode =
    searchParams.get("orderCode") ||
    searchParams.get("vnp_TxnRef") ||
    searchParams.get("merchantRef") ||
    "";
  const amountStr = searchParams.get("vnp_Amount") || searchParams.get("amount");
  const paymentMethod = searchParams.get("payment_method") || (responseCode ? "VNPAY" : "COD");
  const failureMessage = searchParams.get("message");

  // Xử lý số tiền: VNPAY nhân 100 lần đơn vị VND
  let amount = 0;
  if (amountStr) {
    const rawVal = Number(amountStr);
    if (!isNaN(rawVal)) {
      amount = rawVal >= 100000 && rawVal % 100 === 0 ? rawVal / 100 : rawVal;
    }
  }

  // Giao dịch thành công nếu responseCode === "00" hoặc status === "success"
  const isSuccess = responseCode === "00" || status === "success";

  return (
    <div className="max-w-lg w-full bg-white border border-[#e2beba]/60 rounded-3xl p-8 sm:p-10 shadow-xl shadow-red-950/5 text-center space-y-6">
      {/* Icon Trạng Thái */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm ${
          isSuccess
            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}
      >
        {isSuccess ? <CheckCircle2 className="w-11 h-11" /> : <XCircle className="w-11 h-11" />}
      </div>

      {/* Tiêu đề & Lời nhắn */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-turmeric block">
          {isSuccess ? "Đơn Hàng Đã Được Tiếp Nhận" : "Giao Dịch Chưa Hoàn Tất"}
        </span>
        <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#1c1917]">
          {isSuccess
            ? paymentMethod === "VNPAY"
              ? "Thanh Toán Thành Công!"
              : "Đặt Món Thành Công!"
            : "Thanh Toán Không Thành Công"}
        </h1>
        <p className="text-xs sm:text-sm text-[#5a413d] max-w-sm mx-auto leading-relaxed pt-1">
          {isSuccess
            ? "Bếp Mẹ đã nhận đơn và đang chuẩn bị những nguyên liệu tươi ngon nhất để thắp lửa phục vụ bàn tiệc của quý khách."
            : failureMessage ||
              "Giao dịch qua cổng ngân hàng bị gián đoạn hoặc quý khách đã hủy thanh toán. Vui lòng thử lại hoặc chọn hình thức COD."}
        </p>
      </div>

      {/* Thông tin biên lai đơn hàng */}
      {orderCode && (
        <div className="p-5 bg-[#fff8f6] rounded-2xl border border-[#e2beba]/50 text-xs space-y-2.5 text-left shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[#8e706c]">Mã đơn mỹ vị:</span>
            <span className="font-mono font-bold text-[#1c1917] text-sm bg-white px-2.5 py-0.5 rounded-lg border border-[#e2beba]/40">
              {orderCode}
            </span>
          </div>

          {amount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[#8e706c]">Số tiền thanh toán:</span>
              <span className="font-mono font-bold text-primary text-base">
                {formatVND(amount)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-[#8e706c]">Phương thức:</span>
            <span className="font-semibold text-[#1c1917]">
              {paymentMethod === "VNPAY" ? "VNPAY QR / Thẻ Ngân Hàng" : "Thanh toán khi nhận món (COD)"}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#e2beba]/30">
            <span className="text-[#8e706c]">Trạng thái bếp:</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-emerald-500" />
              <span>{isSuccess ? "Đang xếp lịch nấu tươi" : "Chờ thanh toán lại"}</span>
            </span>
          </div>
        </div>
      )}

      {/* Cam kết phục vụ */}
      {isSuccess && (
        <div className="text-[11px] text-[#8e706c] bg-[#fff1eb]/60 rounded-xl p-3 border border-primary/10 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span>Thời gian giao dự kiến: <strong>30 - 45 phút</strong> trong thố nhiệt chuyên dụng 88°C.</span>
        </div>
      )}

      {/* Các nút hành động chính */}
      <div className="flex flex-col gap-3 pt-2">
        {isSuccess ? (
          <Link href={orderCode ? `/tai-khoan/don-hang/${orderCode}` : "/tai-khoan/don-hang"}>
            <Button
              variant="primary"
              size="lg"
              className="w-full py-4 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Theo dõi tiến độ đơn hàng</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/thanh-toan">
            <Button
              variant="primary"
              size="lg"
              className="w-full py-4 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              <span>Thử thanh toán lại</span>
            </Button>
          </Link>
        )}

        <Link href="/thuc-don">
          <Button
            variant="outline"
            size="md"
            className="w-full py-3 rounded-full text-xs font-bold text-[#5a413d] border-[#e2beba] hover:bg-[#fff8f6] cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 mr-1.5" />
            <span>Tiếp tục khám phá thực đơn</span>
          </Button>
        </Link>
      </div>

      {/* Hotline chăm sóc khách hàng */}
      <div className="pt-2 text-[11px] text-[#b39591] flex items-center justify-center gap-1.5 border-t border-[#e2beba]/30">
        <PhoneCall className="w-3.5 h-3.5 text-primary" />
        <span>Hotline chăm sóc ẩm thực Vị Việt: <strong className="text-primary font-mono font-bold">1900 6868</strong></span>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#fff8f6]">
      <Suspense
        fallback={
          <div className="text-center text-xs text-[#8e706c] flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span>Đang xác thực kết quả giao dịch...</span>
          </div>
        }
      >
        <PaymentResultContent />
      </Suspense>
    </div>
  );
}
