"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrderDetailPage } from "@/features/orders/hooks/use-order-detail-page";
import { OrderJourneyTimeline } from "@/features/orders/components/order-journey-timeline";
import { OrderPaymentAlert } from "@/features/orders/components/order-payment-alert";
import { OrderRefundStatusCard } from "@/features/orders/components/order-refund-status-card";
import { OrderDeliveryInfo } from "@/features/orders/components/order-delivery-info";
import { OrderItemsList } from "@/features/orders/components/order-items-list";
import { OrderCancelDialog } from "@/features/orders/components/order-cancel-dialog";
import { ReviewModal } from "@/features/reviews/components/review-modal";

export default function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const resolved = use(params);
  const orderCode = resolved.orderCode;

  const {
    order,
    isLoading,
    isRefreshing,
    loadOrder,
    errorMsg,
    successMsg,
    isPaying,
    secondsLeft,
    formattedCountdown,
    handlePayVnpay,
    isCancelling,
    isCancelModalOpen,
    setIsCancelModalOpen,
    cancelReason,
    setCancelReason,
    customReason,
    setCustomReason,
    bankName,
    setBankName,
    bankAccountNumber,
    setBankAccountNumber,
    bankAccountName,
    setBankAccountName,
    handleConfirmCancel,
    selectedItemForReview,
    isReviewModalOpen,
    openReviewModal,
    closeReviewModal,
    isPendingPayment,
    isPendingConfirmation,
    isConfirmed,
    isCooking,
    isDelivering,
    isCompleted,
    isCancelled,
    isExpired,
    isRefunded,
    isRefundPending,
    succeededRefund,
    canCancel,
  } = useOrderDetailPage(orderCode);

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

  const badgeVariant = isCompleted
    ? "success"
    : isRefunded
    ? "success"
    : isRefundPending
    ? "warning"
    : isCancelled
    ? "danger"
    : isPendingPayment || isPendingConfirmation
    ? "warning"
    : "brand";

  const badgeLabel = isCompleted
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
    ? "Bếp đang chế biến"
    : order.status === "CONFIRMED"
    ? "Quán đã tiếp nhận"
    : isPendingPayment
    ? "Chờ thanh toán VNPay"
    : "Chờ quán xác nhận";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1. Header & Điều Hướng */}
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
            className="p-1.5 rounded-lg border border-border bg-surface text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand-red" : ""}`}
            />
          </button>

          <Badge variant={badgeVariant}>{badgeLabel}</Badge>
        </div>
      </div>

      {/* 2. Thông Báo Nổi (Success / Error) */}
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

      {/* 3. Tiêu Đề Đơn & Thời Điểm Đặt */}
      <div>
        <h1 className="text-xl font-bold font-serif text-ink tracking-tight">
          Hành trình đơn hàng #{order.order_code}
        </h1>
        <p className="text-xs text-ink-muted mt-1 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Đặt lúc {new Date(order.created_at).toLocaleString("vi-VN")} • Phương thức{" "}
            {order.payment_method} (
            {order.payment_status === "PAID"
              ? "Đã thanh toán"
              : order.payment_status === "EXPIRED"
              ? "Hết hạn thanh toán"
              : "Chưa thanh toán"}
            )
          </span>
        </p>
      </div>

      {/* 4. Thẻ Cảnh Báo Chờ Thanh Toán VNPay (Nếu có) */}
      {isPendingPayment && (
        <OrderPaymentAlert
          formattedCountdown={formattedCountdown}
          secondsLeft={secondsLeft}
          isPaying={isPaying}
          isCancelling={isCancelling}
          onPayVnpay={handlePayVnpay}
          onOpenCancelModal={() => setIsCancelModalOpen(true)}
          onReloadOrder={() => loadOrder(true)}
        />
      )}

      {/* 5. Dòng Thời Gian Trực Quan 5 Bước HOẶC Thẻ Trạng Thái Hủy/Hoàn Tiền */}
      {!isCancelled ? (
        <OrderJourneyTimeline
          isPendingPayment={isPendingPayment}
          isConfirmed={isConfirmed}
          isCooking={isCooking}
          isDelivering={isDelivering}
          isCompleted={isCompleted}
        />
      ) : (
        <OrderRefundStatusCard
          order={order}
          isExpired={isExpired}
          isRefunded={isRefunded}
          isRefundPending={isRefundPending}
          succeededRefund={succeededRefund}
        />
      )}

      {/* 6. Thông Tin Người Nhận & Giao Hàng */}
      <OrderDeliveryInfo order={order} />

      {/* 7. Danh Sách Món Ăn, Chi Tiết Giá & Nút Hủy Đơn */}
      <OrderItemsList
        order={order}
        isCompleted={isCompleted}
        canCancel={canCancel}
        isCancelling={isCancelling}
        onOpenReviewModal={openReviewModal}
        onOpenCancelModal={() => setIsCancelModalOpen(true)}
      />

      {/* 8. Modal Khách Hàng Tự Hủy Đơn & Nhập STK Hoàn Tiền */}
      <OrderCancelDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        isCancelling={isCancelling}
        cancelReason={cancelReason}
        onChangeCancelReason={setCancelReason}
        customReason={customReason}
        onChangeCustomReason={setCustomReason}
        bankName={bankName}
        onChangeBankName={setBankName}
        bankAccountNumber={bankAccountNumber}
        onChangeBankAccountNumber={setBankAccountNumber}
        bankAccountName={bankAccountName}
        onChangeBankAccountName={setBankAccountName}
        onConfirmCancel={handleConfirmCancel}
        order={order}
      />

      {/* 9. Modal Đánh Giá Món Ăn Cho Khách Hàng */}
      {selectedItemForReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={closeReviewModal}
          orderItem={{
            id: selectedItemForReview.id,
            dish_name: selectedItemForReview.dish_name,
            variant_name: selectedItemForReview.variant_name || undefined,
            review: selectedItemForReview.review || null,
          }}
          onSuccess={() => {
            closeReviewModal();
            loadOrder(true);
          }}
        />
      )}
    </div>
  );
}
