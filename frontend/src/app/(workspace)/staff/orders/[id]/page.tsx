"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Truck,
  Clock,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  History,
  AlertTriangle,
} from "lucide-react";
import { formatVND } from "@/lib/utils/currency";
import { ordersApi, Order } from "@/features/orders/api/orders.api";

export default function StaffOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = use(params);
  const orderId = resolved.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cancellation modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Hết nguyên liệu tươi sống");
  const [customReason, setCustomReason] = useState("");

  const loadOrderDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ordersApi.adminFindOne(orderId);
      setOrder(data);
    } catch (err: any) {
      console.error("Failed to load order detail:", err);
      setErrorMsg(err.message || "Không thể tải chi tiết đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleUpdateStatus = async (
    newStatus: string,
    note?: string,
    cancel_reason?: string
  ) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const updated = await ordersApi.adminUpdateStatus(orderId, {
        status: newStatus,
        note: note || `Nhân viên chuyển trạng thái sang ${newStatus}`,
        cancel_reason,
      });
      setOrder(updated);
      showNotification(`Chuyển trạng thái sang "${newStatus}" thành công!`);
    } catch (err: any) {
      showNotification(err.message || "Không thể chuyển trạng thái đơn hàng", true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    const finalReason = cancelReason === "Khác" ? customReason : cancelReason;
    if (!finalReason.trim()) {
      alert("Vui lòng nhập lý do từ chối/hủy đơn.");
      return;
    }
    await handleUpdateStatus("CANCELLED", `Nhân viên hủy đơn: ${finalReason}`, finalReason);
    setIsCancelModalOpen(false);
    setCustomReason("");
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-ink-muted">
        Đang nạp chi tiết đơn hàng #{orderId}...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-lg font-bold text-ink">Không tìm thấy đơn hàng</h2>
        <Link href="/staff/orders">
          <Button variant="primary">Quay lại danh sách đơn</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return (
          <Badge variant="warning" size="md" className="bg-amber-500/15 text-amber-700 border-amber-300 font-bold animate-pulse">
            Chờ quán xác nhận
          </Badge>
        );
      case "PENDING_PAYMENT":
      case "PENDING":
        return <Badge variant="warning" size="md">Chờ thanh toán</Badge>;
      case "CONFIRMED":
        return <Badge variant="info" size="md">Đã xác nhận</Badge>;
      case "PREPARING":
        return <Badge variant="brand" size="md">Bếp đang nấu</Badge>;
      case "READY":
        return <Badge variant="success" size="md" className="bg-emerald-50 text-emerald-700 border-emerald-300">Món sẵn sàng</Badge>;
      case "DELIVERING":
        return <Badge variant="brand" size="md" className="bg-blue-50 text-blue-700 border-blue-300">Đang giao hàng</Badge>;
      case "COMPLETED":
        return <Badge variant="success" size="md">Hoàn thành</Badge>;
      case "CANCELLED":
        return <Badge variant="danger" size="md">Đã hủy</Badge>;
      case "DELIVERY_FAILED":
        return <Badge variant="danger" size="md">Giao thất bại</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status}</Badge>;
    }
  };

  const isPendingConf = order.status === "PENDING_CONFIRMATION" || order.status === "PENDING";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/staff/orders"
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-brand-red transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách đơn</span>
        </Link>

        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
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

      {/* Main Order Card */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-6">
        {/* Order Header Summary */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-serif text-ink tracking-tight">
                Đơn hàng #{order.order_code}
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-surface-hover border border-border text-ink">
                {order.fulfillment_type === "PICKUP" ? "Mang đi / Tự lấy" : "Giao tận nơi"}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1.5 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Thời gian đặt: {new Date(order.created_at).toLocaleString("vi-VN")}
              </span>
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-xs text-ink-muted">Tổng thanh toán:</span>
            <div className="text-2xl font-bold text-brand-red font-mono">
              {formatVND(Number(order.total_amount || 0))}
            </div>
            <div className="flex sm:justify-end items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-ink-muted" />
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  order.payment_status === "PAID"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {order.payment_method === "VNPAY"
                  ? order.payment_status === "PAID"
                    ? "VNPAY - Đã thanh toán"
                    : "VNPAY - Chờ thanh toán"
                  : "COD - Thu tiền mặt khi nhận"}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-surface-hover/60 p-4 rounded-xl border border-border/80">
          <div className="space-y-2">
            <span className="font-bold text-ink-muted uppercase tracking-wider text-[10px] block">
              Thông tin Người nhận
            </span>
            <div className="space-y-1">
              <p className="font-bold text-sm text-ink">{order.recipient_name}</p>
              <a
                href={`tel:${order.recipient_phone}`}
                className="font-mono text-brand-red font-semibold flex items-center gap-1.5 hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{order.recipient_phone}</span>
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-ink-muted uppercase tracking-wider text-[10px] block">
              Địa chỉ & Lời dặn giao hàng
            </span>
            <div className="space-y-1 text-ink">
              {order.delivery_address ? (
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-red shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{order.delivery_address}</p>
                </div>
              ) : (
                <p className="text-ink-muted italic">Khách nhận tại nhà hàng</p>
              )}
            </div>
          </div>

          {(order.customer_note || order.delivery_note) && (
            <div className="md:col-span-2 p-3 bg-amber-500/10 border border-amber-300/60 rounded-lg text-amber-900">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Lời dặn riêng từ khách hàng:</span>
              </div>
              <p className="text-xs italic pl-5">
                &ldquo;{order.customer_note || order.delivery_note}&rdquo;
              </p>
            </div>
          )}

          {order.cancel_reason && (
            <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Lý do hủy đơn:</span>
              </div>
              <p className="text-xs pl-5">{order.cancel_reason}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Danh sách Món ăn ({order.items?.length || 0})
          </h3>
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface">
            {order.items && order.items.length > 0 ? (
              order.items.map((it, idx) => (
                <div key={idx} className="p-3.5 flex justify-between items-start text-xs hover:bg-surface-hover/30 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-ink">
                      {it.quantity}x {it.dish_name}
                    </span>
                    {it.variant_name && (
                      <p className="text-ink-muted text-[11px]">
                        Khẩu phần: <span className="font-medium text-ink">{it.variant_name}</span>
                      </p>
                    )}
                    {it.options && it.options.length > 0 && (
                      <div className="text-ink-muted text-[11px] flex flex-wrap gap-1.5 pt-0.5">
                        {it.options.map((o, oIdx) => (
                          <span
                            key={oIdx}
                            className="bg-surface-hover px-1.5 py-0.5 rounded border border-border/60 text-ink"
                          >
                            {o.group_name}: <strong>{o.option_name}</strong>
                            {Number(o.extra_price || o.price_adjustment || 0) > 0 &&
                              ` (+${formatVND(Number(o.extra_price || o.price_adjustment))})`}
                          </span>
                        ))}
                      </div>
                    )}
                    {it.note && (
                      <p className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] mt-1 inline-block border border-amber-200">
                        Ghi chú: {it.note}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-sm text-ink font-mono shrink-0 ml-4">
                    {formatVND(Number(it.line_total || it.subtotal || (it.unit_price || 0) * it.quantity || 0))}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-ink-muted">
                Chi tiết danh sách món chưa được nạp
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-surface-hover/40 p-4 rounded-xl border border-border text-xs space-y-2 max-w-sm ml-auto">
          <div className="flex justify-between text-ink-muted">
            <span>Tiền món ăn:</span>
            <span className="font-mono">{formatVND(Number(order.subtotal || 0))}</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Phí vận chuyển:</span>
            <span className="font-mono">{formatVND(Number(order.delivery_fee || order.shipping_fee || 0))}</span>
          </div>
          {Number(order.food_discount || order.discount_amount || 0) > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Ưu đãi giảm giá món:</span>
              <span className="font-mono">
                -{formatVND(Number(order.food_discount || order.discount_amount))}
              </span>
            </div>
          )}
          {Number(order.shipping_discount || 0) > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Ưu đãi phí vận chuyển:</span>
              <span className="font-mono">-{formatVND(Number(order.shipping_discount))}</span>
            </div>
          )}
          <div className="pt-2 border-t border-border flex justify-between font-bold text-base text-ink">
            <span>Tổng thanh toán:</span>
            <span className="text-brand-red font-mono">
              {formatVND(Number(order.total_amount || 0))}
            </span>
          </div>
        </div>

        {/* Order Event Timeline History */}
        {order.events && order.events.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Nhật ký xử lý đơn hàng</span>
            </h3>
            <div className="divide-y divide-border border border-border rounded-xl p-3 bg-surface text-xs space-y-2">
              {order.events.map((ev, eIdx) => (
                <div key={eIdx} className="pt-2 first:pt-0 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{ev.to_status}</span>
                      {ev.from_status && (
                        <span className="text-ink-muted text-[11px]">(từ {ev.from_status})</span>
                      )}
                    </div>
                    {ev.note && <p className="text-ink-muted text-[11px]">{ev.note}</p>}
                  </div>
                  <span className="text-[11px] text-ink-muted font-mono shrink-0">
                    {new Date(ev.created_at).toLocaleTimeString("vi-VN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action transitions toolbar (Machine State) */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
          {/* Step 1: PENDING_CONFIRMATION */}
          {isPendingConf && (
            <Button
              variant="primary"
              size="md"
              onClick={() => handleUpdateStatus("CONFIRMED", "Lễ tân đã tiếp nhận và xác nhận đơn hàng")}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>Tiếp nhận & Xác nhận đơn (CONFIRMED)</span>
            </Button>
          )}

          {/* Step 2: CONFIRMED */}
          {order.status === "CONFIRMED" && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleUpdateStatus("PREPARING", "Chuyển đơn xuống Bếp Mẹ chế biến")}
              disabled={actionLoading}
              className="font-bold text-ink"
            >
              <ChefHat className="w-4 h-4 text-brand-red mr-1.5" />
              <span>Chuyển bếp nấu (PREPARING)</span>
            </Button>
          )}

          {/* Step 3: PREPARING */}
          {order.status === "PREPARING" && (
            <Button
              variant="outline"
              size="md"
              onClick={() => handleUpdateStatus("READY", "Món ăn đã chế biến xong, sẵn sàng")}
              disabled={actionLoading}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
              <span>Báo Bếp đã xong (READY)</span>
            </Button>
          )}

          {/* Step 4: READY */}
          {order.status === "READY" && (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleUpdateStatus("DELIVERING", "Bàn giao đơn cho shipper xuất bến")}
                disabled={actionLoading}
                className="font-bold"
              >
                <Truck className="w-4 h-4 mr-1.5" />
                <span>Bàn giao Shipper (DELIVERING)</span>
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => handleUpdateStatus("COMPLETED", "Khách tự lấy món tại quầy hoàn tất")}
                disabled={actionLoading}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Hoàn tất tại quầy (COMPLETED)</span>
              </Button>
            </>
          )}

          {/* Step 5: DELIVERING */}
          {order.status === "DELIVERING" && (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleUpdateStatus("COMPLETED", "Shipper đã giao thành công và thu tiền")}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Giao hàng thành công (COMPLETED)</span>
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => handleUpdateStatus("DELIVERY_FAILED", "Không liên lạc được khách hàng")}
                disabled={actionLoading}
                className="text-amber-700 border-amber-300 hover:bg-amber-50 font-medium"
              >
                <AlertCircle className="w-4 h-4 mr-1.5" />
                <span>Báo giao thất bại</span>
              </Button>
            </>
          )}

          {/* Step 6: DELIVERY_FAILED */}
          {order.status === "DELIVERY_FAILED" && (
            <Button
              variant="primary"
              size="md"
              onClick={() => handleUpdateStatus("DELIVERING", "Thử giao lại lần 2")}
              disabled={actionLoading}
              className="font-bold"
            >
              <Truck className="w-4 h-4 mr-1.5" />
              <span>Giao lại lần 2 (DELIVERING)</span>
            </Button>
          )}

          {/* Cancellation button for any active non-completed state */}
          {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={actionLoading}
              className="ml-auto text-red-600 border-red-200 hover:bg-red-50 font-medium"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              <span>{isPendingConf ? "Từ chối tiếp nhận" : "Hủy đơn hàng"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Xác nhận hủy đơn hàng #${order.order_code}`}
        description="Vui lòng cung cấp lý do hủy để thông báo cho khách hàng và lưu lại nhật ký đối soát."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={actionLoading}
            >
              Quay lại
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {actionLoading ? "Đang xử lý..." : "Xác nhận hủy đơn"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs py-2">
          <div className="space-y-2">
            <label className="font-semibold text-ink block">Chọn lý do hủy:</label>
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
                    name="modal_cancel_reason"
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
              <label className="font-semibold text-ink block">Chi tiết lý do:</label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do cụ thể..."
                rows={3}
                className="w-full p-2.5 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
          )}

          {order.payment_method === "VNPAY" && order.payment_status === "PAID" && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-[11px] leading-relaxed">
              ⚠️ <strong>Lưu ý:</strong> Đơn hàng đã được thanh toán qua VNPAY. Sau khi hủy, hệ thống sẽ lưu nhật ký hoàn tiền để bộ phận kế toán xử lý.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
