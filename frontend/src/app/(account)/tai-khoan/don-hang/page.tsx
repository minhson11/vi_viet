"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils/currency";
import {
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Clock,
  CreditCard,
  ChefHat,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { ordersApi, Order } from "@/features/orders/api/orders.api";

type TabKey =
  | "ALL"
  | "PENDING_PAYMENT"
  | "PENDING_CONFIRMATION"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED_REFUND";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");

  const loadMyOrders = async () => {
    setIsLoading(true);
    try {
      const res = await ordersApi.getMyOrders({ limit: 100 });
      setOrders(res.items);
    } catch (err) {
      console.error("Failed to load my orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMyOrders();
  }, []);

  // Filter orders by tab
  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case "PENDING_PAYMENT":
        return orders.filter((o) => o.status === "PENDING_PAYMENT");
      case "PENDING_CONFIRMATION":
        return orders.filter(
          (o) => o.status === "PENDING_CONFIRMATION" || o.status === "PENDING"
        );
      case "PROCESSING":
        return orders.filter((o) =>
          ["CONFIRMED", "PREPARING", "READY", "DELIVERING"].includes(o.status)
        );
      case "COMPLETED":
        return orders.filter((o) => o.status === "COMPLETED");
      case "CANCELLED_REFUND":
        return orders.filter(
          (o) =>
            o.status === "CANCELLED" ||
            o.status === "DELIVERY_FAILED" ||
            o.payment_status === "REFUNDED" ||
            o.payment_status === "REFUND_PENDING"
        );
      case "ALL":
      default:
        return orders;
    }
  }, [orders, activeTab]);

  // Count items per tab
  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING_PAYMENT: orders.filter((o) => o.status === "PENDING_PAYMENT").length,
      PENDING_CONFIRMATION: orders.filter(
        (o) => o.status === "PENDING_CONFIRMATION" || o.status === "PENDING"
      ).length,
      PROCESSING: orders.filter((o) =>
        ["CONFIRMED", "PREPARING", "READY", "DELIVERING"].includes(o.status)
      ).length,
      COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
      CANCELLED_REFUND: orders.filter(
        (o) =>
          o.status === "CANCELLED" ||
          o.status === "DELIVERY_FAILED" ||
          o.payment_status === "REFUNDED" ||
          o.payment_status === "REFUND_PENDING"
      ).length,
    };
  }, [orders]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "ALL", label: "Tất cả", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { key: "PENDING_PAYMENT", label: "Chờ thanh toán", icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: "PENDING_CONFIRMATION", label: "Chờ xác nhận", icon: <Clock className="w-3.5 h-3.5" /> },
    { key: "PROCESSING", label: "Đang chế biến & giao", icon: <ChefHat className="w-3.5 h-3.5" /> },
    { key: "COMPLETED", label: "Đã hoàn thành", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { key: "CANCELLED_REFUND", label: "Đã hủy & Hoàn tiền", icon: <RotateCcw className="w-3.5 h-3.5" /> },
  ];

  const getStatusBadge = (order: Order) => {
    const isRefunded =
      order.payment_status === "REFUNDED" ||
      order.refunds?.some((r) => r.status === "SUCCEEDED");
    const isRefundPending =
      order.payment_status === "REFUND_PENDING" ||
      order.refunds?.some((r) => r.status === "REQUESTED" || r.status === "PROCESSING");

    if (order.status === "CANCELLED") {
      if (isRefunded) {
        return (
          <Badge
            variant="success"
            size="sm"
            className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3 text-emerald-600" />
            <span>Đã hoàn tiền</span>
          </Badge>
        );
      }
      if (isRefundPending) {
        return (
          <Badge
            variant="warning"
            size="sm"
            className="bg-amber-50 text-amber-800 border-amber-300 font-bold flex items-center gap-1"
          >
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Chờ hoàn tiền</span>
          </Badge>
        );
      }
      return (
        <Badge variant="danger" size="sm" className="font-semibold">
          Đã hủy đơn
        </Badge>
      );
    }

    switch (order.status) {
      case "PENDING_CONFIRMATION":
        return (
          <Badge
            variant="warning"
            size="sm"
            className="bg-amber-500/15 text-amber-700 border-amber-300 font-bold flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            <span>Chờ quán xác nhận</span>
          </Badge>
        );
      case "PENDING_PAYMENT":
      case "PENDING":
        return (
          <Badge
            variant="warning"
            size="sm"
            className="bg-amber-100 text-amber-900 border-amber-300 font-bold flex items-center gap-1"
          >
            <CreditCard className="w-3 h-3 text-amber-700" />
            <span>Chờ thanh toán VNPay</span>
          </Badge>
        );
      case "CONFIRMED":
        return <Badge variant="info" size="sm">Quán đã tiếp nhận</Badge>;
      case "PREPARING":
        return <Badge variant="brand" size="sm">Bếp Mẹ đang nấu</Badge>;
      case "READY":
        return (
          <Badge
            variant="success"
            size="sm"
            className="bg-emerald-50 text-emerald-700 border-emerald-300"
          >
            Món sẵn sàng
          </Badge>
        );
      case "DELIVERING":
        return (
          <Badge
            variant="brand"
            size="sm"
            className="bg-blue-50 text-blue-700 border-blue-300"
          >
            Đang giao tới bạn
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã hoàn thành</span>
          </Badge>
        );
      case "DELIVERY_FAILED":
        return <Badge variant="danger" size="sm">Giao thất bại</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{order.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-lg font-bold text-ink flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-red" />
            <span>Lịch sử đơn hàng</span>
          </h1>
          <p className="text-xs text-ink-muted">
            Theo dõi lộ trình giao hàng, hóa đơn và tiến độ hoàn tiền các bữa ăn
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMyOrders} disabled={isLoading}>
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Tabs bar */}
      <div className="border-b border-border -mx-2 px-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max pb-2">
          {tabs.map((t) => {
            const count = counts[t.key] || 0;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-brand-red text-cream shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-surface-hover"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? "bg-cream/20 text-cream"
                        : "bg-surface-hover text-ink border border-border"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-ink-muted">
          Đang nạp lịch sử đơn hàng của bạn...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-ink-muted mx-auto opacity-40" />
          <h3 className="font-bold text-sm text-ink">
            {activeTab === "ALL"
              ? "Bạn chưa có đơn hàng nào"
              : `Không có đơn hàng nào trong mục "${tabs.find((t) => t.key === activeTab)?.label}"`}
          </h3>
          <p className="text-xs text-ink-muted">
            Khám phá thực đơn phong phú của Vị Việt và đặt ngay một bữa ăn ấm nóng chuẩn vị!
          </p>
          <Link href="/thuc-don" className="inline-block mt-2">
            <Button variant="primary" size="sm">
              Khám phá thực đơn
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => {
            const isRefunded =
              ord.payment_status === "REFUNDED" ||
              ord.refunds?.some((r) => r.status === "SUCCEEDED");
            const isRefundPending =
              ord.payment_status === "REFUND_PENDING" ||
              ord.refunds?.some((r) => r.status === "REQUESTED" || r.status === "PROCESSING");
            const succeededRefund = ord.refunds?.find((r) => r.status === "SUCCEEDED");
            const refundAmount = succeededRefund ? succeededRefund.amount : ord.total_amount;

            return (
              <div
                key={ord.id || ord.order_code}
                className="border border-border rounded-xl p-4 bg-surface hover:border-brand-red/40 transition-colors space-y-3 shadow-2xs"
              >
                {/* Order Top Line */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm text-ink">
                      #{ord.order_code}
                    </span>
                    <span className="text-xs text-ink-muted ml-3">
                      {new Date(ord.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  {getStatusBadge(ord)}
                </div>

                {/* Items preview */}
                {ord.items && ord.items.length > 0 && (
                  <p className="text-xs text-ink font-medium leading-relaxed">
                    {ord.items
                      .map((it) => `${it.quantity}x ${it.dish_name}`)
                      .join(", ")}
                  </p>
                )}

                {/* SPECIAL REFUND BANNER (Nếu đơn đã hoàn tiền hoặc đang chờ hoàn) */}
                {isRefunded && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <div>
                        <span className="font-bold block">
                          Đã hoàn trả thành công {formatVND(Number(refundAmount))}
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          {succeededRefund?.provider_refund_id
                            ? `Mã đối soát: ${succeededRefund.provider_refund_id}`
                            : "Tiền đã được chuyển trả về phương thức thanh toán ban đầu"}
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm" className="bg-emerald-600 text-white font-bold shrink-0">
                      Đã hoàn tất
                    </Badge>
                  </div>
                )}

                {isRefundPending && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                      </div>
                      <div>
                        <span className="font-bold block">
                          Đang đối soát hoàn tiền ({formatVND(Number(refundAmount))})
                        </span>
                        <span className="text-[11px] text-amber-700">
                          Nhà hàng đang tiến hành đối soát và chuyển trả lại tài khoản của bạn
                        </span>
                      </div>
                    </div>
                    <Badge variant="warning" size="sm" className="bg-amber-500 text-white font-bold shrink-0">
                      Đang xử lý
                    </Badge>
                  </div>
                )}

                {/* Footer Line */}
                <div className="flex items-center justify-between pt-2 border-t border-border/80">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-muted">Tổng thanh toán:</span>
                    <span className="font-bold text-sm text-brand-red font-mono">
                      {formatVND(Number(ord.total_amount || 0))}
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      ({ord.payment_method === "VNPAY" ? "VNPay" : "COD"})
                    </span>
                  </div>

                  <Link href={`/tai-khoan/don-hang/${ord.id || ord.order_code}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1 hover:border-brand-red text-xs">
                      <span>Xem hành trình</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
