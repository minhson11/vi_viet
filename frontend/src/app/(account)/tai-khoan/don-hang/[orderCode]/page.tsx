"use client";

import React, { use, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatVND } from "@/lib/utils/currency";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChefHat,
  Truck,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Timer,
  RotateCcw,
} from "lucide-react";
import { ordersApi, Order } from "@/features/orders/api/orders.api";

export default function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const resolved = use(params);
  const orderCode = resolved.orderCode;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Đổi ý không muốn đặt nữa");
  const [customReason, setCustomReason] = useState("");
  const [bankName, setBankName] = useState("MB Bank");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Remaining seconds for payment countdown
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const loadOrder = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const data = await ordersApi.getOrderDetail(orderCode);
        setOrder(data);
      } catch (err: any) {
        console.error("Failed to load order:", err);
        if (!isSilent) setErrorMsg(err.message || "Không thể tải chi tiết đơn hàng");
      } finally {
        if (!isSilent) setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [orderCode]
  );

  useEffect(() => {
    loadOrder();
    // Auto-poll every 12 seconds so customer sees live status changes
    const interval = setInterval(() => {
      loadOrder(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [loadOrder]);

  // Payment Countdown Timer effect
  useEffect(() => {
    if (!order || order.status !== "PENDING_PAYMENT" || !order.payment_deadline) {
      setSecondsLeft(null);
      return;
    }

    const calculateRemaining = () => {
      const deadline = new Date(order.payment_deadline!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((deadline - now) / 1000));
      return diff;
    };

    setSecondsLeft(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);

      // Khi hết hạn, reload đơn hàng để cập nhật trạng thái hủy
      if (remaining <= 0) {
        clearInterval(timer);
        setTimeout(() => {
          loadOrder(true);
        }, 1500);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order, loadOrder]);

  // Format countdown string mm:ss
  const formattedCountdown = useMemo(() => {
    if (secondsLeft === null) return null;
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [secondsLeft]);

  // Tiếp tục thanh toán VNPAY
  const handlePayVnpay = async () => {
    if (!order) return;
    setIsPaying(true);
    setErrorMsg(null);
    try {
      const res = await ordersApi.createPaymentAttempt(order.id, "VNPAY");
      const redirectUrl = res.redirectUrl || res.payment_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error("Không nhận được đường dẫn thanh toán từ cổng VNPay.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể khởi tạo thanh toán VNPay. Vui lòng thử lại.");
      setIsPaying(false);
      // Nếu đơn đã hết hạn, tải lại chi tiết
      loadOrder(true);
    }
  };

  const handleConfirmCancel = async () => {
    if (!order) return;
    const finalReason = cancelReason === "Khác" ? customReason : cancelReason;
    if (!finalReason.trim()) {
      alert("Vui lòng nhập lý do hủy đơn.");
      return;
    }

    const isPaid = order.payment_status === "PAID" || order.payment_status === "REFUND_PENDING";
    if (order.payment_method === "VNPAY" && isPaid) {
      if (!bankAccountNumber.trim() || !bankAccountName.trim()) {
        alert("Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản để nhà hàng chuyển khoản hoàn tiền cho bạn.");
        return;
      }
    }

    setIsCancelling(true);
    setErrorMsg(null);
    try {
      const updated = await ordersApi.cancelMyOrder(order.id, {
        reason: finalReason,
        bank_name: bankName,
        bank_account_number: bankAccountNumber.trim(),
        bank_account_name: bankAccountName.trim().toUpperCase(),
      });
      setOrder(updated);
      setIsCancelModalOpen(false);
      setSuccessMsg("Đã gửi yêu cầu hủy đơn và hoàn tiền thành công theo thông tin STK của bạn.");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể hủy đơn hàng vào thời điểm này");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading && !order) {
    return (
      <div className="py-24 text-center text-xs text-ink-muted">
        Đang nạp hành trình đơn hàng #{orderCode}...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-lg font-bold text-ink">Không tìm thấy đơn hàng #{orderCode}</h2>
        <Link href="/tai-khoan/don-hang">
          <Button variant="primary">Về danh sách đơn</Button>
        </Link>
      </div>
    );
  }

  const isPendingPayment = order.status === "PENDING_PAYMENT";
  const isPendingConfirmation = order.status === "PENDING_CONFIRMATION" || order.status === "PENDING";
  const isConfirmed = ["CONFIRMED", "PREPARING", "READY", "DELIVERING", "COMPLETED"].includes(order.status);
  const isCooking = ["PREPARING", "READY", "DELIVERING", "COMPLETED"].includes(order.status);
  const isDelivering = ["READY", "DELIVERING", "COMPLETED"].includes(order.status);
  const isCompleted = order.status === "COMPLETED";
  const isCancelled = order.status === "CANCELLED";
  const isExpired = isCancelled && order.cancel_reason === "Hết thời hạn thanh toán";
  const isRefunded =
    order.payment_status === "REFUNDED" ||
    order.refunds?.some((r) => r.status === "SUCCEEDED");
  const isRefundPending =
    order.payment_status === "REFUND_PENDING" ||
    order.refunds?.some((r) => r.status === "REQUESTED" || r.status === "PROCESSING");
  const succeededRefund = order.refunds?.find((r) => r.status === "SUCCEEDED");

  // Khách được tự hủy nếu chưa vào bếp
  const canCancel = isPendingPayment || isPendingConfirmation;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link
          href="/tai-khoan/don-hang"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-brand-red transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về lịch sử đơn hàng</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadOrder(true)}
            disabled={isRefreshing}
            title="Làm mới trạng thái"
            className="p-1.5 rounded-lg border border-border bg-surface text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand-red" : ""}`} />
          </button>

          <Badge
            variant={
              isCompleted
                ? "success"
                : isRefunded
                ? "success"
                : isRefundPending
                ? "warning"
                : isCancelled
                ? "danger"
                : isPendingPayment
                ? "warning"
                : isPendingConfirmation
                ? "warning"
                : "brand"
            }
          >
            {isCompleted
              ? "Đã hoàn thành"
              : isRefunded
              ? "Đã hoàn tiền"
              : isRefundPending
              ? "Chờ hoàn tiền"
              : isCancelled
              ? "Đã hủy đơn"
              : order.status === "DELIVERING"
              ? "Đang giao tới bạn"
              : order.status === "READY"
              ? "Món ăn đã sẵn sàng"
              : order.status === "PREPARING"
              ? "Bếp Mẹ đang nấu"
              : order.status === "CONFIRMED"
              ? "Quán đã tiếp nhận"
              : isPendingPayment
              ? "Chờ thanh toán VNPay"
              : "Chờ quán xác nhận"}
          </Badge>
        </div>
      </div>

      {/* Floating Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Order Main Title */}
      <div>
        <h1 className="text-xl font-bold font-serif text-ink tracking-tight">
          Hành trình đơn hàng #{order.order_code}
        </h1>
        <p className="text-xs text-ink-muted mt-1 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Đặt lúc {new Date(order.created_at).toLocaleString("vi-VN")} • Phương thức {order.payment_method} (
            {order.payment_status === "PAID"
              ? "Đã thanh toán"
              : order.payment_status === "EXPIRED"
              ? "Hết hạn thanh toán"
              : "Chưa thanh toán"}
            )
          </span>
        </p>
      </div>

      {/* SPECIAL HERO CARD: PENDING_PAYMENT (VNPay Countdown & Action) */}
      {isPendingPayment && (
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
              onClick={handlePayVnpay}
              disabled={isPaying || (secondsLeft !== null && secondsLeft <= 0)}
              className="bg-brand-red hover:bg-brand-red/90 text-cream font-bold shadow-md flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isPaying ? "Đang mở cổng VNPay..." : "Thanh toán VNPay ngay"}</span>
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isCancelling || isPaying}
              className="border-amber-300 text-amber-900 hover:bg-amber-100/60"
            >
              <XCircle className="w-4 h-4 mr-1.5 text-amber-700" />
              <span>Hủy đơn này</span>
            </Button>

            <button
              onClick={() => loadOrder(true)}
              className="text-[11px] text-amber-800 underline hover:text-amber-950 font-medium ml-auto"
            >
              Tôi đã chuyển tiền, kiểm tra lại
            </button>
          </div>
        </div>
      )}

      {/* 5-Step Visual Journey Timeline */}
      {!isCancelled ? (
        <div className="p-5 bg-surface border border-border rounded-xl space-y-4 shadow-xs">
          <div className="grid grid-cols-5 gap-2 text-center text-xs relative">
            {/* Step 1: Chờ xác nhận hoặc Chờ thanh toán */}
            <div
              className={`flex flex-col items-center relative z-10 ${
                isConfirmed
                  ? "text-emerald-600 font-semibold"
                  : isPendingPayment
                  ? "text-amber-600 font-bold"
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

            {/* Step 3: Bếp Mẹ thắp lửa */}
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
          </div>

          {/* Current Journey Explanatory Status Card */}
          <div className="p-3.5 bg-surface-hover/70 rounded-xl border border-border/80 text-xs space-y-1">
            <span className="font-bold text-ink block">
              {isPendingPayment
                ? "💳 Vui lòng hoàn tất thanh toán VNPay trong 15 phút"
                : isPendingConfirmation
                ? "⏳ Nhà hàng đang kiểm tra nguyên liệu và tiếp nhận đơn"
                : order.status === "CONFIRMED"
                ? "✨ Nhà hàng đã xác nhận món ăn và gửi yêu cầu sang Bếp Mẹ"
                : order.status === "PREPARING"
                ? "🔥 Bếp Mẹ đang thắp lửa, tỉ mẩn chế biến từng món ăn"
                : order.status === "READY"
                ? "🥡 Món ăn đã ra lò thơm phức, đang đóng gói kỹ lưỡng"
                : order.status === "DELIVERING"
                ? "🛵 Shipper đang trên đường giao bữa ăn ấm nóng tới bạn"
                : "🎉 Đơn hàng đã hoàn tất trọn vẹn"}
            </span>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              {isPendingPayment
                ? "Sau khi bạn hoàn tất thanh toán trên cổng VNPay, hệ thống sẽ tự động cập nhật và chuyển giao đơn ngay cho nhà hàng."
                : isPendingConfirmation && order.payment_method === "VNPAY" && order.payment_status === "PAID"
                ? "Thanh toán qua VNPay của bạn đã được đối soát thành công. Để đảm bảo chất lượng nguyên liệu tươi ngon nhất trong ngày hoặc trong giờ cao điểm, nhân viên sẽ bấm xác nhận ngay."
                : isPendingConfirmation
                ? "Đơn hàng thanh toán khi nhận (COD) đã được gửi tới hệ thống. Nhân viên nhà hàng sẽ kiểm tra khả năng phục vụ và xác nhận đơn ngay trong giây lát."
                : order.status === "CONFIRMED"
                ? "Tất cả món bạn chọn đều có nguyên liệu tươi mới. Bếp đang bắt đầu chuẩn bị chảo và gia vị."
                : order.status === "PREPARING"
                ? "Các món đang được nấu theo thứ tự và tiêu chuẩn nhiệt độ nghiêm ngặt để đảm bảo tròn vị."
                : order.status === "DELIVERING"
                ? "Tài xế giao hàng đang di chuyển theo địa chỉ bạn cung cấp. Vui lòng để ý điện thoại để nhận món."
                : "Chúc bạn và gia đình có một bữa ăn ngon miệng, đậm đà phong vị Việt!"}
            </p>
          </div>
        </div>
      ) : (
        /* Cancellation & Refund Banner */
        <div className="space-y-4">
          <div className="p-5 bg-red-50 border border-red-200 rounded-2xl space-y-3 text-xs text-red-900">
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
      )}

      {/* Recipient & Delivery Information */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3 text-xs">
        <h3 className="font-bold text-ink-muted uppercase tracking-wider text-[10px]">
          Thông tin giao hàng
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-ink">
          <div className="space-y-1">
            <span className="text-ink-muted text-[11px] block">Người nhận:</span>
            <p className="font-bold text-sm">{order.recipient_name}</p>
            <p className="font-mono text-ink-muted flex items-center gap-1">
              <Phone className="w-3 h-3 text-brand-red" />
              <span>{order.recipient_phone}</span>
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-ink-muted text-[11px] block">Địa chỉ giao:</span>
            {order.delivery_address ? (
              <p className="flex items-start gap-1 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-brand-red shrink-0 mt-0.5" />
                <span>{order.delivery_address}</span>
              </p>
            ) : (
              <p className="italic text-ink-muted">Nhận món tại quầy</p>
            )}
          </div>
          {(order.customer_note || order.delivery_note) && (
            <div className="sm:col-span-2 p-2.5 bg-amber-500/10 border border-amber-300/40 rounded-lg text-amber-900">
              <div className="flex items-center gap-1 font-bold text-[11px]">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Lời dặn của bạn:</span>
              </div>
              <p className="text-xs italic pl-4.5 mt-0.5">
                {order.customer_note || order.delivery_note}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
          Món ăn đã gọi ({order.items?.length || 0})
        </h3>
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface">
          {order.items && order.items.length > 0 ? (
            order.items.map((it, idx) => (
              <div
                key={idx}
                className="p-3.5 flex justify-between items-start text-xs hover:bg-surface-hover/30 transition-colors"
              >
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
                <span className="font-bold text-ink font-mono text-sm shrink-0 ml-4">
                  {formatVND(
                    Number(it.line_total || it.subtotal || (it.unit_price || 0) * it.quantity || 0)
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-ink-muted">
              Đang tải danh sách món...
            </div>
          )}
        </div>
      </div>

      {/* Price Summary */}
      <div className="p-4 bg-surface border border-border rounded-xl space-y-2 text-xs">
        <div className="flex justify-between text-ink-muted">
          <span>Tiền món ăn:</span>
          <span className="font-mono">{formatVND(Number(order.subtotal || 0))}</span>
        </div>
        <div className="flex justify-between text-ink-muted">
          <span>Phí giao hàng:</span>
          <span className="font-mono">{formatVND(Number(order.delivery_fee || order.shipping_fee || 0))}</span>
        </div>
        {Number(order.food_discount || order.discount_amount || 0) > 0 && (
          <div className="flex justify-between text-emerald-600 font-semibold">
            <span>Giảm giá món:</span>
            <span className="font-mono">
              -{formatVND(Number(order.food_discount || order.discount_amount))}
            </span>
          </div>
        )}
        {Number(order.shipping_discount || 0) > 0 && (
          <div className="flex justify-between text-emerald-600 font-semibold">
            <span>Ưu đãi vận chuyển:</span>
            <span className="font-mono">-{formatVND(Number(order.shipping_discount))}</span>
          </div>
        )}
        <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-ink">
          <span>Tổng thanh toán:</span>
          <span className="text-brand-red font-mono text-base">
            {formatVND(Number(order.total_amount || 0))}
          </span>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] border-t border-border/50 text-ink-muted">
          <span className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Phương thức: {order.payment_method === "VNPAY" ? "VNPay QR/Thẻ" : "Tiền mặt (COD)"}</span>
          </span>
          <span
            className={`font-semibold px-2 py-0.5 rounded ${
              order.payment_status === "PAID"
                ? "bg-emerald-100 text-emerald-800"
                : order.payment_status === "EXPIRED"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {order.payment_status === "PAID"
              ? "Đã thanh toán"
              : order.payment_status === "EXPIRED"
              ? "Hết hạn thanh toán"
              : "Chưa thanh toán"}
          </span>
        </div>
      </div>

      {/* Cancellation or Customer Support Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <a
          href="tel:19001234"
          className="text-xs font-semibold text-brand-red flex items-center gap-1.5 hover:underline"
        >
          <Phone className="w-4 h-4" />
          <span>Cần hỗ trợ? Gọi hotline: 1900 1234</span>
        </a>

        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCancelModalOpen(true)}
            disabled={isCancelling}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            <span>Hủy đơn hàng</span>
          </Button>
        )}
      </div>

      {/* Customer Cancellation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Bạn muốn hủy đơn hàng này?"
        description="Đơn hàng chưa được chuyển sang bếp chế biến nên bạn có thể tự hủy miễn phí."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
            >
              Giữ lại đơn
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isCancelling ? "Đang hủy..." : "Xác nhận hủy đơn"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs py-2">
          <div className="space-y-2">
            <label className="font-semibold text-ink block">Vui lòng chọn lý do hủy:</label>
            <div className="space-y-1.5">
              {[
                "Đổi ý không muốn đặt nữa",
                "Muốn thay đổi món ăn hoặc số lượng",
                "Chọn nhầm địa chỉ nhận hàng",
                "Thời gian chờ lâu",
                "Khác",
              ].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    cancelReason === r
                      ? "border-brand-red bg-brand-red/5 font-semibold text-ink"
                      : "border-border hover:bg-surface-hover text-ink-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="cust_cancel_reason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="text-brand-red focus:ring-brand-red"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {cancelReason === "Khác" && (
            <div className="space-y-1 pt-1">
              <label className="font-semibold text-ink block">Lý do cụ thể:</label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do của bạn..."
                rows={3}
                className="w-full p-2.5 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
          )}

          {order.payment_method === "VNPAY" && (order.payment_status === "PAID" || order.payment_status === "REFUND_PENDING") && (
            <div className="p-3.5 bg-emerald-50/80 border-2 border-emerald-300 rounded-xl text-emerald-950 space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thông tin tài khoản nhận lại tiền ({formatVND(Number(order.total_amount))})</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Đơn hàng đã thanh toán qua VNPay. Vui lòng cung cấp số tài khoản để nhà hàng chuyển khoản hoàn tiền ngay:
              </p>

              <div className="space-y-2 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-900 block mb-1">
                    Ngân hàng thụ hưởng:
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {[
                      "MB Bank (Quân Đội)",
                      "Vietcombank (VCB)",
                      "Techcombank (TCB)",
                      "VPBank",
                      "VietinBank (CTG)",
                      "BIDV",
                      "ACB (Á Châu)",
                      "TPBank",
                      "Sacombank",
                      "VIB",
                      "HDBank",
                      "Timo by BVBank",
                      "Cake by VPBank",
                      "Ngân hàng khác",
                    ].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-900 block mb-1">
                      Số tài khoản (STK): <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Nhập số tài khoản..."
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-900 block mb-1">
                      Tên chủ tài khoản: <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Ví dụ: NGUYEN VAN A"
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
