"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ChefHat,
  Truck,
  Clock,
  AlertTriangle,
  Phone,
  MapPin,
  FileText,
  Volume2,
  VolumeX,
} from "lucide-react";
import { formatVND } from "@/lib/utils/currency";
import { ordersApi, Order } from "@/features/orders/api/orders.api";

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("PENDING_CONFIRMATION");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelTargetOrder, setCancelTargetOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("Hết nguyên liệu tươi sống");
  const [customReason, setCustomReason] = useState("");

  // Auto refresh & sound notification
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevPendingCountRef = useRef(0);

  const loadOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await ordersApi.adminFindAll({
        status: filter === "all" ? undefined : filter,
        search: searchTerm || undefined,
        limit: 100,
      });
      setOrders(res.items);

      // Check for new pending confirmation orders to alert staff
      const pendingCount = res.items.filter(
        (o) => o.status === "PENDING_CONFIRMATION" || o.status === "PENDING"
      ).length;

      if (pendingCount > prevPendingCountRef.current && prevPendingCountRef.current > 0) {
        if (soundEnabled && typeof window !== "undefined") {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
          } catch {
            // Ignore sound errors
          }
        }
      }
      prevPendingCountRef.current = pendingCount;
    } catch (err: any) {
      console.error("Failed to load staff orders:", err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [filter, searchTerm, soundEnabled]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Polling auto-refresh every 12 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadOrders(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadOrders]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Quick Action: Confirm Order
  const handleConfirmOrder = async (orderId: string, orderCode: string) => {
    setActionLoadingId(orderId);
    try {
      await ordersApi.adminUpdateStatus(orderId, {
        status: "CONFIRMED",
        note: "Lễ tân đã tiếp nhận và xác nhận đơn hàng thành công",
      });
      showNotification(`Đã xác nhận đơn #${orderCode}! Đơn đã được chuyển tự động sang Màn hình Bếp KDS.`);
      await loadOrders(true);
    } catch (err: any) {
      showNotification(err.message || "Không thể xác nhận đơn hàng", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Cancel / Reject Order
  const handleRejectOrder = async () => {
    if (!cancelTargetOrder) return;
    const finalReason = cancelReason === "Khác" ? customReason : cancelReason;
    if (!finalReason.trim()) {
      alert("Vui lòng nhập lý do từ chối đơn hàng.");
      return;
    }

    setActionLoadingId(cancelTargetOrder.id);
    try {
      await ordersApi.adminUpdateStatus(cancelTargetOrder.id, {
        status: "CANCELLED",
        cancel_reason: finalReason,
        note: `Nhân viên hủy đơn: ${finalReason}`,
      });
      showNotification(`Đã từ chối đơn #${cancelTargetOrder.order_code}. Lý do: ${finalReason}`);
      setCancelTargetOrder(null);
      setCustomReason("");
      await loadOrders(true);
    } catch (err: any) {
      showNotification(err.message || "Không thể hủy đơn hàng", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Move to PREPARING
  const handleMoveToPreparing = async (orderId: string, orderCode: string) => {
    setActionLoadingId(orderId);
    try {
      await ordersApi.adminUpdateStatus(orderId, {
        status: "PREPARING",
        note: "Bếp bắt đầu chế biến",
      });
      showNotification(`Đơn #${orderCode} đã được chuyển sang trạng thái Đang nấu.`);
      await loadOrders(true);
    } catch (err: any) {
      showNotification(err.message || "Thao tác thất bại", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Move to READY
  const handleMoveToReady = async (orderId: string, orderCode: string) => {
    setActionLoadingId(orderId);
    try {
      await ordersApi.adminUpdateStatus(orderId, {
        status: "READY",
        note: "Món ăn đã sẵn sàng đóng gói",
      });
      showNotification(`Đơn #${orderCode} đã nấu xong, sẵn sàng đóng gói & giao hàng.`);
      await loadOrders(true);
    } catch (err: any) {
      showNotification(err.message || "Thao tác thất bại", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Move to DELIVERING
  const handleMoveToDelivering = async (orderId: string, orderCode: string) => {
    setActionLoadingId(orderId);
    try {
      await ordersApi.adminUpdateStatus(orderId, {
        status: "DELIVERING",
        note: "Bàn giao đơn cho shipper xuất phát",
      });
      showNotification(`Đơn #${orderCode} đang được giao tới khách hàng.`);
      await loadOrders(true);
    } catch (err: any) {
      showNotification(err.message || "Thao tác thất bại", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Move to COMPLETED
  const handleMoveToCompleted = async (orderId: string, orderCode: string) => {
    setActionLoadingId(orderId);
    try {
      await ordersApi.adminUpdateStatus(orderId, {
        status: "COMPLETED",
        note: "Đã giao thành công cho khách hàng",
      });
      showNotification(`Đơn #${orderCode} đã hoàn tất thành công!`);
      await loadOrders(true);
    } catch (err: any) {
      showNotification(err.message || "Thao tác thất bại", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return (
          <Badge variant="warning" size="sm" className="bg-amber-500/15 text-amber-700 border-amber-300 font-bold animate-pulse">
            Chờ quán xác nhận
          </Badge>
        );
      case "PENDING_PAYMENT":
      case "PENDING":
        return <Badge variant="warning" size="sm">Chờ thanh toán</Badge>;
      case "CONFIRMED":
        return <Badge variant="info" size="sm">Đã xác nhận</Badge>;
      case "PREPARING":
        return <Badge variant="brand" size="sm">Bếp đang nấu</Badge>;
      case "READY":
        return <Badge variant="success" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-300">Món sẵn sàng</Badge>;
      case "DELIVERING":
        return <Badge variant="brand" size="sm" className="bg-blue-50 text-blue-700 border-blue-300">Đang giao hàng</Badge>;
      case "COMPLETED":
        return <Badge variant="success" size="sm">Hoàn thành</Badge>;
      case "CANCELLED":
        return <Badge variant="danger" size="sm">Đã hủy</Badge>;
      case "DELIVERY_FAILED":
        return <Badge variant="danger" size="sm">Giao thất bại</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getPaymentBadge = (method: string, payStatus: string) => {
    const isPaid = payStatus === "PAID";
    if (method === "VNPAY") {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
            isPaid
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-amber-100 text-amber-800 border border-amber-300"
          }`}
        >
          {isPaid ? "✓ VNPAY (Đã thanh toán)" : "⏳ VNPAY (Chưa thanh toán)"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        💵 COD (Thu tiền khi nhận)
      </span>
    );
  };

  const pendingCount = orders.filter(
    (o) => o.status === "PENDING_CONFIRMATION" || o.status === "PENDING"
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-red" />
            <span>Điều phối Đơn hàng Vị Việt (Staff)</span>
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Tiếp nhận, kiểm tra khả năng phục vụ và xác nhận đơn hàng tức thì cho nhà bếp
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red w-48 sm:w-60"
            />
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              soundEnabled
                ? "bg-herb/10 border-herb text-herb font-medium"
                : "bg-surface border-border text-ink-muted hover:bg-surface-hover"
            }`}
            title={soundEnabled ? "Âm thanh chuông báo bật" : "Âm thanh chuông báo tắt"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-medium transition-colors ${
              autoRefresh
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-surface border-border text-ink-muted hover:bg-surface-hover"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-ink-muted"
              }`}
            />
            <span>{autoRefresh ? "Tự động (12s)" : "Thủ công"}</span>
          </button>

          <Button variant="outline" size="sm" onClick={() => loadOrders(false)} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Floating Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto no-scrollbar">
        {[
          { key: "PENDING_CONFIRMATION", label: "Chờ xác nhận", badgeCount: pendingCount },
          { key: "all", label: "Tất cả đơn" },
          { key: "CONFIRMED", label: "Đã xác nhận" },
          { key: "PREPARING", label: "Bếp đang nấu" },
          { key: "READY", label: "Món sẵn sàng" },
          { key: "DELIVERING", label: "Đang giao" },
          { key: "COMPLETED", label: "Hoàn thành" },
          { key: "CANCELLED", label: "Đã hủy" },
          { key: "PENDING_PAYMENT", label: "Chờ VNPAY" },
        ].map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-brand-red text-cream shadow-xs"
                  : "bg-surface text-ink-muted hover:bg-surface-hover hover:text-ink"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.badgeCount === "number" && tab.badgeCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-cream text-brand-red" : "bg-amber-500 text-white"
                  }`}
                >
                  {tab.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      {isLoading && orders.length === 0 ? (
        <div className="py-16 text-center text-xs text-ink-muted">
          Đang tải danh sách đơn hàng...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-ink-muted mx-auto opacity-30" />
          <h3 className="font-bold text-sm text-ink">Không có đơn hàng nào</h3>
          <p className="text-xs text-ink-muted">
            Không tìm thấy đơn hàng nào thuộc danh mục &quot;{filter}&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((ord) => {
            const isTargetLoading = actionLoadingId === ord.id;
            const isPendingConf = ord.status === "PENDING_CONFIRMATION" || ord.status === "PENDING";

            return (
              <div
                key={ord.id}
                className={`bg-surface border rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between transition-all ${
                  isPendingConf
                    ? "border-amber-400 bg-amber-500/5 ring-1 ring-amber-300"
                    : "border-border hover:border-brand-red/40"
                }`}
              >
                {/* Header card info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-ink tracking-tight">
                      #{ord.order_code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(ord.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ink-muted border-b border-border/60 pb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-ink-muted" />
                      {new Date(ord.created_at).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      • {new Date(ord.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    {getPaymentBadge(ord.payment_method, ord.payment_status)}
                  </div>

                  {/* Customer details */}
                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{ord.recipient_name}</span>
                      <a
                        href={`tel:${ord.recipient_phone}`}
                        className="font-mono text-brand-red font-semibold flex items-center gap-1 hover:underline"
                        title="Gọi điện cho khách"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{ord.recipient_phone}</span>
                      </a>
                    </div>

                    {ord.delivery_address && (
                      <div className="flex items-start gap-1.5 text-ink-muted">
                        <MapPin className="w-3.5 h-3.5 text-brand-red shrink-0 mt-0.5" />
                        <p className="line-clamp-2 text-[11px]">{ord.delivery_address}</p>
                      </div>
                    )}

                    {/* Customer note / delivery note */}
                    {(ord.customer_note || ord.delivery_note) && (
                      <div className="p-2 bg-amber-500/10 border border-amber-300/40 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <p className="line-clamp-2">
                          <strong className="font-semibold">Lời dặn:</strong>{" "}
                          {ord.customer_note || ord.delivery_note}
                        </p>
                      </div>
                    )}

                    {/* Items preview */}
                    {ord.items && ord.items.length > 0 && (
                      <div className="pt-2 border-t border-border/50 text-[11px] space-y-1 text-ink">
                        {ord.items.slice(0, 3).map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="line-clamp-1 font-medium">
                              {it.quantity}x {it.dish_name}
                              {it.variant_name ? ` (${it.variant_name})` : ""}
                            </span>
                            <span className="font-mono text-ink-muted shrink-0 ml-2">
                              {formatVND(Number(it.line_total || it.subtotal || 0))}
                            </span>
                          </div>
                        ))}
                        {ord.items.length > 3 && (
                          <span className="text-[10px] text-ink-muted italic block">
                            + {ord.items.length - 3} món khác...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer & Operations */}
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-ink-muted block uppercase font-bold tracking-wider">
                        Tổng tiền:
                      </span>
                      <span className="font-bold text-sm text-brand-red font-mono">
                        {formatVND(Number(ord.total_amount || 0))}
                      </span>
                    </div>

                    <Link href={`/staff/orders/${ord.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1">
                        <span>Chi tiết</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>

                  {/* 1-Click Operations based on state machine */}
                  {isPendingConf && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isTargetLoading}
                        onClick={() => handleConfirmOrder(ord.id, ord.order_code)}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isTargetLoading ? "Đang xử lý..." : "Xác nhận đơn"}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isTargetLoading}
                        onClick={() => setCancelTargetOrder(ord)}
                        className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 font-medium flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </Button>
                    </div>
                  )}

                  {ord.status === "CONFIRMED" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isTargetLoading}
                      onClick={() => handleMoveToPreparing(ord.id, ord.order_code)}
                      className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <ChefHat className="w-3.5 h-3.5 text-brand-red" />
                      <span>Chuyển bếp nấu (PREPARING)</span>
                    </Button>
                  )}

                  {ord.status === "PREPARING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isTargetLoading}
                      onClick={() => handleMoveToReady(ord.id, ord.order_code)}
                      className="w-full h-8 text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Báo nấu xong (READY)</span>
                    </Button>
                  )}

                  {ord.status === "READY" && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isTargetLoading}
                      onClick={() => handleMoveToDelivering(ord.id, ord.order_code)}
                      className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Bàn giao giao hàng (DELIVERING)</span>
                    </Button>
                  )}

                  {ord.status === "DELIVERING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isTargetLoading}
                      onClick={() => handleMoveToCompleted(ord.id, ord.order_code)}
                      className="w-full h-8 text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hoàn tất đơn (COMPLETED)</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection / Cancellation Modal */}
      <Modal
        isOpen={!!cancelTargetOrder}
        onClose={() => setCancelTargetOrder(null)}
        title={`Từ chối đơn hàng #${cancelTargetOrder?.order_code}`}
        description="Vui lòng chọn lý do từ chối để hệ thống gửi thông báo và hủy đơn hàng minh bạch."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelTargetOrder(null)}
              disabled={!!actionLoadingId}
            >
              Quay lại
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRejectOrder}
              disabled={!!actionLoadingId}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {actionLoadingId ? "Đang hủy..." : "Xác nhận từ chối đơn"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs py-2">
          <div className="space-y-2">
            <label className="font-semibold text-ink block">Lý do từ chối / hủy đơn:</label>
            <div className="space-y-1.5">
              {[
                "Hết nguyên liệu tươi sống cho món ăn",
                "Quán đang quá tải giờ cao điểm không kịp phục vụ",
                "Khách hàng gọi điện yêu cầu hủy đơn",
                "Không thể liên lạc xác nhận với số điện thoại của khách",
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
                    name="cancel_reason"
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
              <label className="font-semibold text-ink block">Nhập lý do chi tiết:</label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do cụ thể..."
                rows={3}
                className="w-full p-2.5 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
          )}

          {cancelTargetOrder?.payment_method === "VNPAY" && cancelTargetOrder?.payment_status === "PAID" && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-[11px] leading-relaxed">
              ⚠️ <strong>Lưu ý:</strong> Đơn hàng này khách đã thanh toán qua VNPAY. Sau khi hủy, hệ thống sẽ ghi nhận trạng thái và nhân viên kế toán sẽ tiến hành hoàn tiền cho khách.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
