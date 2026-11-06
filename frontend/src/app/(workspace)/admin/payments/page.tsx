"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Eye,
  ShieldCheck,
  Wallet,
  RotateCcw,
  Zap,
  Building,
  AlertTriangle,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatVND } from "@/lib/utils/currency";
import {
  paymentsApi,
  PaymentTransaction,
  RefundItem,
} from "@/features/admin-payments/api/admin-payments.api";

type RefundWithPayment = RefundItem & { payment: PaymentTransaction };

function extractBankInfo(reasonStr: string) {
  if (!reasonStr || !reasonStr.includes("[Hoàn tiền STK]")) return null;
  const parts = reasonStr.replace("[Hoàn tiền STK]", "").split("|");
  const getVal = (prefix: string) => {
    const found = parts.find((p) => p.toLowerCase().includes(prefix.toLowerCase()));
    return found ? found.split(":")[1]?.trim() : "";
  };
  return {
    bank: getVal("Ngân hàng") || "Chưa rõ",
    accountNumber: getVal("STK") || "",
    accountName: getVal("Chủ TK") || "",
    note: getVal("Lý do") || "",
  };
}

function getBankCode(bankName: string): string {
  const b = bankName.toUpperCase();
  if (b.includes("MB")) return "MB";
  if (b.includes("VIETCOM") || b.includes("VCB")) return "VCB";
  if (b.includes("TECHCOM") || b.includes("TCB")) return "TCB";
  if (b.includes("VPBANK") || b.includes("VPB")) return "VPB";
  if (b.includes("VIETIN") || b.includes("CTG") || b.includes("ICB")) return "ICB";
  if (b.includes("BIDV")) return "BIDV";
  if (b.includes("ACB")) return "ACB";
  if (b.includes("TPBANK") || b.includes("TPB")) return "TPB";
  if (b.includes("SACOM") || b.includes("STB")) return "STB";
  if (b.includes("VIB")) return "VIB";
  if (b.includes("HDB")) return "HDB";
  if (b.includes("TIMO")) return "TIMO";
  if (b.includes("CAKE")) return "CAKE";
  return "MB";
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);

  // Refund actions state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [manualRefundTarget, setManualRefundTarget] = useState<RefundWithPayment | null>(null);
  const [manualProviderRef, setManualProviderRef] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await paymentsApi.getAdminPayments({ limit: 100 });
      setPayments(res.items);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Extract all refunds from payments list
  const allRefunds: Array<RefundItem & { payment: PaymentTransaction }> = [];
  payments.forEach((p) => {
    if (p.refunds && p.refunds.length > 0) {
      p.refunds.forEach((r) => {
        allRefunds.push({ ...r, payment: p });
      });
    }
  });

  const pendingRefundsCount = allRefunds.filter(
    (r) => r.status === "REQUESTED" || r.status === "PROCESSING"
  ).length;

  const handleTriggerVnpayRefund = async (refundId: string, orderCode: string) => {
    if (!confirm(`Bạn có chắc muốn gửi lệnh hoàn tiền tự động qua cổng VNPAY cho đơn #${orderCode}?`)) {
      return;
    }
    setActionLoadingId(refundId);
    try {
      await paymentsApi.executeRefundCommand(refundId, {
        type: "TRIGGER_VNPAY_REFUND",
        commandKey: `CMD_REFUND_VNPAY_${Date.now()}`,
        reason: "Admin kích hoạt hoàn tiền tự động qua cổng VNPAY",
      });
      showToast(`Đã gửi lệnh hoàn tiền VNPAY thành công cho đơn #${orderCode}!`);
      await loadPayments();
    } catch (err: any) {
      showToast(err.message || "Lỗi khi gọi cổng hoàn tiền VNPAY", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmManualRefund = async () => {
    if (!manualRefundTarget) return;
    if (!manualProviderRef.trim()) {
      alert("Vui lòng nhập mã chứng từ chuyển khoản ngân hàng (Mã FT/GD)!");
      return;
    }
    setActionLoadingId(manualRefundTarget.id);
    try {
      await paymentsApi.executeRefundCommand(manualRefundTarget.id, {
        type: "CONFIRM_MANUAL_SUCCESS",
        commandKey: `CMD_MANUAL_REFUND_${Date.now()}`,
        providerReference: manualProviderRef.trim(),
        reason: manualNote.trim() || "Kế toán đã chuyển khoản hoàn tiền cho khách",
      });
      showToast("Xác nhận hoàn tiền thủ công thành công!");
      setManualRefundTarget(null);
      setManualProviderRef("");
      setManualNote("");
      await loadPayments();
    } catch (err: any) {
      showToast(err.message || "Không thể xác nhận hoàn tiền", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
      case "SUCCESS":
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Thành công
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="danger" size="sm">
            <XCircle className="w-3 h-3 mr-1" />
            Thất bại
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="warning" size="sm">
            <Clock className="w-3 h-3 mr-1" />
            Đang xử lý
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getRefundBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Đã hoàn tiền
          </Badge>
        );
      case "REQUESTED":
        return (
          <Badge variant="warning" size="sm" className="bg-amber-500/15 text-amber-700 border-amber-300 font-bold animate-pulse">
            Chờ xử lý hoàn
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="info" size="sm">
            Đang xử lý
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="danger" size="sm">
            Thất bại
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const filteredPayments = payments.filter((p) => {
    const isSuccess = p.status === "SUCCEEDED" || p.status === "SUCCESS";
    if (statusFilter === "SUCCESS" && !isSuccess) return false;
    if (statusFilter === "PENDING" && p.status !== "PENDING") return false;
    if (statusFilter === "FAILED" && p.status !== "FAILED") return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const code = p.order?.order_code?.toLowerCase() || p.order_code?.toLowerCase() || "";
      const ref = p.merchant_reference?.toLowerCase() || "";
      const txn = p.provider_transaction_id?.toLowerCase() || p.transaction_ref?.toLowerCase() || "";
      return code.includes(term) || ref.includes(term) || txn.includes(term);
    }

    return true;
  });

  const totalSuccessAmount = payments
    .filter((p) => p.status === "SUCCEEDED" || p.status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalRefundedAmount = allRefunds
    .filter((r) => r.status === "SUCCEEDED")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <>
      <AdminHeader
        title="Quản lý Giao dịch & Hoàn tiền Cổng VNPAY"
        subtitle="Đối soát mã giao dịch ngân hàng, IPN callback webhook và xử lý yêu cầu hoàn tiền khi hủy đơn"
        action={
          <Button variant="outline" size="sm" onClick={loadPayments} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>
        }
      />

      {toastMsg && (
        <div className="mx-6 mt-4">
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 shadow-xs ${
              toastMsg.isError
                ? "bg-red-50 border-red-300 text-red-800"
                : "bg-emerald-50 border-emerald-300 text-emerald-800"
            }`}
          >
            {toastMsg.isError ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">{toastMsg.text}</span>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-muted uppercase font-bold">Tổng thanh toán</span>
              <h3 className="text-xl font-bold text-emerald-600 font-mono mt-1">
                {isLoading ? "..." : formatVND(totalSuccessAmount)}
              </h3>
              <span className="text-xs text-ink-muted mt-0.5 inline-block">
                Các giao dịch trực tuyến thành công
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-muted uppercase font-bold">Chờ hoàn tiền</span>
              <h3 className="text-xl font-bold text-amber-600 font-mono mt-1">
                {isLoading ? "..." : `${pendingRefundsCount} yêu cầu`}
              </h3>
              <span className="text-xs text-ink-muted mt-0.5 inline-block">
                Cần đối soát & hoàn tiền cho khách
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-muted uppercase font-bold">Đã hoàn trả</span>
              <h3 className="text-xl font-bold text-blue-600 font-mono mt-1">
                {isLoading ? "..." : formatVND(totalRefundedAmount)}
              </h3>
              <span className="text-xs text-ink-muted mt-0.5 inline-block">
                Tổng số tiền đã hoàn trả khách
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-muted uppercase font-bold">Cổng kết nối</span>
              <h3 className="text-base font-bold text-ink mt-1">VNPAY Sandbox / Live</h3>
              <span className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Webhook IPN đang sẵn sàng
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, mã tham chiếu hoặc TXN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === "ALL"
                  ? "bg-brand-red text-white"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              Tất cả giao dịch ({payments.length})
            </button>
            <button
              onClick={() => setStatusFilter("REFUNDS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                statusFilter === "REFUNDS"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yêu cầu Hoàn tiền ({allRefunds.length})</span>
              {pendingRefundsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-700 font-bold">
                  {pendingRefundsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter("SUCCESS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === "SUCCESS"
                  ? "bg-brand-red text-white"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              Thành công ({payments.filter((p) => p.status === "SUCCEEDED" || p.status === "SUCCESS").length})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === "PENDING"
                  ? "bg-brand-red text-white"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              Đang xử lý ({payments.filter((p) => p.status === "PENDING").length})
            </button>
          </div>
        </div>

        {/* View Mode: REFUNDS TAB */}
        {statusFilter === "REFUNDS" ? (
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Hàng đợi Xử lý Hoàn tiền ({allRefunds.length})
                </h2>
              </div>
              <p className="text-xs text-ink-muted">
                Tự động kích hoạt khi khách hoặc quán hủy đơn đã thanh toán qua VNPAY
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-hover border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn / Mã Refund</th>
                    <th className="py-3 px-4">Số tiền hoàn</th>
                    <th className="py-3 px-4">Lý do hủy / hoàn</th>
                    <th className="py-3 px-4">Trạng thái hoàn</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4 text-right">Thao tác xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allRefunds.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-ink-muted">
                        Chưa có yêu cầu hoàn tiền nào trong hệ thống
                      </td>
                    </tr>
                  ) : (
                    allRefunds.map((r) => {
                      const isPending = r.status === "REQUESTED" || r.status === "PROCESSING";
                      const isTargetLoading = actionLoadingId === r.id;

                      return (
                        <tr key={r.id} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-brand-red text-xs">
                              {r.payment.order?.order_code || `#${r.payment.order_id}`}
                            </div>
                            <div className="text-[10px] text-ink-muted font-mono">{r.refund_reference}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-ink text-sm">
                            {formatVND(Number(r.amount || 0))}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {(() => {
                              const bInfo = extractBankInfo(r.reason);
                              if (bInfo && bInfo.accountNumber) {
                                return (
                                  <div className="space-y-1 p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-950 max-w-xs">
                                    <div className="font-bold flex items-center gap-1 text-[11px] text-emerald-800">
                                      <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>{bInfo.bank}</span>
                                    </div>
                                    <div className="font-mono font-bold text-xs">
                                      STK: <span className="text-brand-red select-all">{bInfo.accountNumber}</span>
                                    </div>
                                    <div className="text-[10px] uppercase font-semibold text-ink-muted">
                                      Chủ TK: {bInfo.accountName}
                                    </div>
                                    {bInfo.note && (
                                      <div className="text-[10px] text-ink-muted italic">
                                        Lý do: {bInfo.note}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <div className="text-xs text-ink max-w-xs truncate" title={r.reason}>
                                  {r.reason}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4">{getRefundBadge(r.status)}</td>
                          <td className="py-3 px-4 text-xs text-ink-muted font-mono">
                            {new Date(r.created_at).toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={isTargetLoading}
                                  onClick={() =>
                                    handleTriggerVnpayRefund(
                                      r.id,
                                      r.payment.order?.order_code || r.payment.order_id
                                    )
                                  }
                                  className="h-8 text-[11px] bg-brand-red hover:bg-brand-red/90 text-white font-bold flex items-center gap-1 shadow-xs"
                                  title="Gửi lệnh hoàn tự động qua API cổng VNPAY"
                                >
                                  <Zap className="w-3.5 h-3.5 text-turmeric" />
                                  <span>{isTargetLoading ? "Đang gửi..." : "Hoàn VNPAY API"}</span>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isTargetLoading}
                                  onClick={() => setManualRefundTarget(r)}
                                  className="h-8 text-[11px] text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold flex items-center gap-1"
                                  title="Quét mã VietQR chuyển khoản trực tiếp cho khách và xác nhận"
                                >
                                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Quét VietQR & Hoàn tiền</span>
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-ink-muted italic font-mono">
                                {r.provider_refund_id || "Hoàn tất"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* View Mode: PAYMENTS TABLE */
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-red" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                Lịch sử giao dịch ({filteredPayments.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-hover border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn / Tham chiếu</th>
                    <th className="py-3 px-4">Cổng thanh toán</th>
                    <th className="py-3 px-4">Số tiền quyết toán</th>
                    <th className="py-3 px-4">Mã giao dịch đối tác</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Hoàn tiền</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-ink-muted">
                        Đang tải lịch sử giao dịch từ cơ sở dữ liệu...
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-ink-muted">
                        Chưa có giao dịch thanh toán nào phù hợp với bộ lọc
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const orderCode = p.order?.order_code || p.order_code || `#${p.order_id}`;
                      const hasRefund = p.refunds && p.refunds.length > 0;

                      return (
                        <tr key={p.id} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-brand-red text-xs">{orderCode}</div>
                            <div className="text-[10px] text-ink-muted font-mono">{p.merchant_reference}</div>
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold">
                            <span className="px-2 py-0.5 rounded bg-surface border border-border text-[11px]">
                              {p.provider || p.gateway || "VNPAY"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-ink text-sm">
                            {formatVND(Number(p.amount || 0))}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-ink-muted">
                            {p.provider_transaction_id || p.transaction_ref || "Chưa có"}
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(p.status)}</td>
                          <td className="py-3 px-4">
                            {hasRefund ? (
                              getRefundBadge(p.refunds![0].status)
                            ) : (
                              <span className="text-xs text-ink-muted">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-ink-muted font-mono">
                            {new Date(p.created_at).toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPayment(p)}
                              className="h-8 px-2.5 text-xs"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              <span>Xem</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Manual Refund Confirmation Modal with VietQR */}
      <Modal
        isOpen={!!manualRefundTarget}
        onClose={() => setManualRefundTarget(null)}
        title={`Xác nhận chuyển khoản hoàn tiền đơn #${
          manualRefundTarget?.payment.order?.order_code || manualRefundTarget?.payment.order_id
        }`}
        description="Quét mã VietQR chuyển khoản nhanh 24/7 cho khách và lưu mã đối soát."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManualRefundTarget(null)}
              disabled={!!actionLoadingId}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmManualRefund}
              disabled={!!actionLoadingId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {actionLoadingId ? "Đang lưu..." : "Xác nhận đã chuyển khoản"}
            </Button>
          </div>
        }
      >
        {manualRefundTarget && (() => {
          const bankInfo = extractBankInfo(manualRefundTarget.reason);
          const orderCode =
            manualRefundTarget.payment.order?.order_code ||
            String(manualRefundTarget.payment.order_id);
          const vietQrUrl =
            bankInfo && bankInfo.accountNumber
              ? `https://img.vietqr.io/image/${getBankCode(bankInfo.bank)}-${bankInfo.accountNumber}-compact2.png?amount=${manualRefundTarget.amount}&addInfo=${encodeURIComponent(`Hoan tien don ${orderCode}`)}&accountName=${encodeURIComponent(bankInfo.accountName)}`
              : null;

          return (
            <div className="space-y-4 text-xs py-2">
              {/* VietQR Dynamic Code Showcase */}
              {vietQrUrl && bankInfo ? (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                  <div className="shrink-0 bg-white p-2 rounded-xl shadow-xs border border-emerald-200">
                    <img
                      src={vietQrUrl}
                      alt="VietQR Chuyển khoản"
                      className="w-48 h-auto rounded-lg"
                    />
                  </div>
                  <div className="space-y-2 text-emerald-950 flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-800">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>Quét mã VietQR chuyển nhanh Napas 24/7</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Mở ứng dụng ngân hàng bất kỳ trên điện thoại (VCB, MB, Techcom, Momo...) quét mã để tự động điền STK và số tiền:
                    </p>
                    <div className="space-y-1 bg-white/80 p-2.5 rounded-lg border border-emerald-200/80 text-[11px]">
                      <div>
                        Ngân hàng: <strong>{bankInfo.bank}</strong>
                      </div>
                      <div>
                        Số tài khoản:{" "}
                        <strong className="font-mono text-brand-red text-xs select-all">
                          {bankInfo.accountNumber}
                        </strong>
                      </div>
                      <div>
                        Chủ tài khoản:{" "}
                        <strong className="uppercase">{bankInfo.accountName}</strong>
                      </div>
                      <div>
                        Số tiền hoàn:{" "}
                        <strong className="font-mono text-brand-red">
                          {formatVND(Number(manualRefundTarget.amount))}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-surface-hover rounded-xl border border-border space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Số tiền cần hoàn:</span>
                    <span className="font-mono font-bold text-brand-red text-sm">
                      {formatVND(Number(manualRefundTarget.amount || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Mã yêu cầu hoàn:</span>
                    <span className="font-mono text-ink">{manualRefundTarget.refund_reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Lý do hủy đơn:</span>
                    <span className="text-ink font-medium">{manualRefundTarget.reason}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-ink block">
                    Mã chứng từ ngân hàng / Mã giao dịch chuyển khoản (Bắt buộc):
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setManualProviderRef(`FT_${orderCode}_${Date.now().toString().slice(-4)}`)
                    }
                    className="text-[10px] text-brand-red hover:underline font-semibold"
                  >
                    Gợi ý mã nhanh
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="VD: FT241106123456 hoặc VCB_REF_89231..."
                  value={manualProviderRef}
                  onChange={(e) => setManualProviderRef(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">Ghi chú đối soát nội bộ:</label>
                <textarea
                  placeholder="VD: Đã quét VietQR chuyển khoản vào STK của khách..."
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Transaction Detail Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`Chi tiết giao dịch ${selectedPayment.merchant_reference}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-surface-hover rounded-xl border border-border">
              <div>
                <span className="text-ink-muted block text-[11px]">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-brand-red text-sm">
                  {selectedPayment.order?.order_code || `#${selectedPayment.order_id}`}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Số tiền:</span>
                <span className="font-mono font-bold text-ink text-sm">
                  {formatVND(Number(selectedPayment.amount || 0))}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Cổng thanh toán:</span>
                <span className="font-semibold">{selectedPayment.provider || "VNPAY"}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Trạng thái giao dịch:</span>
                {getStatusBadge(selectedPayment.status)}
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Mã giao dịch đối tác:</span>
                <span className="font-mono text-ink">
                  {selectedPayment.provider_transaction_id || "Không có"}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Thời gian thanh toán:</span>
                <span className="font-mono">
                  {new Date(selectedPayment.created_at).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            {selectedPayment.refunds && selectedPayment.refunds.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="font-bold text-ink block uppercase text-[11px]">
                  Lịch sử hoàn tiền:
                </span>
                <div className="divide-y divide-border border border-border rounded-xl p-3 bg-surface text-xs space-y-2">
                  {selectedPayment.refunds.map((r) => (
                    <div key={r.id} className="pt-2 first:pt-0 flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-ink">{r.refund_reference}</span>
                        <p className="text-ink-muted text-[11px]">{r.reason}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-brand-red block">
                          {formatVND(Number(r.amount))}
                        </span>
                        {getRefundBadge(r.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
