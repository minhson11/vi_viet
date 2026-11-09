"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ordersApi, Order, OrderItem } from "../api/orders.api";
import { useOrderEvents } from "./use-order-events";

export function useOrderDetailPage(orderCode: string) {
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

  // Review modal state
  const [selectedItemForReview, setSelectedItemForReview] = useState<OrderItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Payment Countdown
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
    const interval = setInterval(() => {
      loadOrder(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [loadOrder]);

  // Nhận thông báo SSE thời gian thực khi trạng thái đơn đổi
  useOrderEvents(
    useCallback(
      (ev) => {
        if (ev.orderCode === orderCode) {
          loadOrder(true);
        }
      },
      [orderCode, loadOrder]
    )
  );

  // Countdown timer effect
  useEffect(() => {
    if (!order || order.status !== "PENDING_PAYMENT" || !order.payment_deadline) {
      setSecondsLeft(null);
      return;
    }

    const calculateRemaining = () => {
      const deadline = new Date(order.payment_deadline!).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((deadline - now) / 1000));
    };

    setSecondsLeft(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        setTimeout(() => {
          loadOrder(true);
        }, 1500);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order, loadOrder]);

  const formattedCountdown = useMemo(() => {
    if (secondsLeft === null) return null;
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [secondsLeft]);

  // Tiếp tục thanh toán VNPAY
  const handlePayVnpay = useCallback(async () => {
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
      loadOrder(true);
    }
  }, [order, loadOrder]);

  // Hủy đơn & Yêu cầu hoàn tiền
  const handleConfirmCancel = useCallback(async () => {
    if (!order) return;
    const finalReason = cancelReason === "Khác" ? customReason : cancelReason;
    if (!finalReason.trim()) {
      alert("Vui lòng nhập lý do hủy đơn.");
      return;
    }

    const isPaid = order.payment_status === "PAID" || order.payment_status === "REFUND_PENDING";
    if (order.payment_method === "VNPAY" && isPaid) {
      if (!bankAccountNumber.trim() || !bankAccountName.trim()) {
        alert(
          "Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản để nhà hàng chuyển khoản hoàn tiền cho bạn."
        );
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
  }, [order, cancelReason, customReason, bankName, bankAccountNumber, bankAccountName]);

  const openReviewModal = useCallback((item: OrderItem) => {
    setSelectedItemForReview(item);
    setIsReviewModalOpen(true);
  }, []);

  const closeReviewModal = useCallback(() => {
    setIsReviewModalOpen(false);
    setSelectedItemForReview(null);
  }, []);

  // Status flags
  const isPendingPayment = order?.status === "PENDING_PAYMENT";
  const isPendingConfirmation =
    order?.status === "PENDING_CONFIRMATION" || order?.status === "PENDING";
  const isConfirmed = Boolean(
    order && ["CONFIRMED", "PREPARING", "READY", "DELIVERING", "COMPLETED"].includes(order.status)
  );
  const isCooking = Boolean(
    order && ["PREPARING", "READY", "DELIVERING", "COMPLETED"].includes(order.status)
  );
  const isDelivering = Boolean(
    order && ["READY", "DELIVERING", "COMPLETED"].includes(order.status)
  );
  const isCompleted = order?.status === "COMPLETED";
  const isCancelled = order?.status === "CANCELLED";
  const isExpired = Boolean(isCancelled && order?.cancel_reason === "Hết thời hạn thanh toán");
  const isRefunded = Boolean(
    order?.payment_status === "REFUNDED" ||
      order?.refunds?.some((r) => r.status === "SUCCEEDED")
  );
  const isRefundPending = Boolean(
    order?.payment_status === "REFUND_PENDING" ||
      order?.refunds?.some((r) => r.status === "REQUESTED" || r.status === "PROCESSING")
  );
  const succeededRefund = order?.refunds?.find((r) => r.status === "SUCCEEDED");
  const canCancel = Boolean(isPendingPayment || isPendingConfirmation);

  return {
    order,
    isLoading,
    isRefreshing,
    loadOrder,
    errorMsg,
    successMsg,
    // Payment
    isPaying,
    secondsLeft,
    formattedCountdown,
    handlePayVnpay,
    // Cancellation
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
    // Review
    selectedItemForReview,
    isReviewModalOpen,
    openReviewModal,
    closeReviewModal,
    // Status flags
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
  };
}
