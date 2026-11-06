"use client";

import React, { useEffect, useState } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TicketPercent, Plus, RefreshCw, Search, X, CheckCircle2, AlertCircle } from "lucide-react";
import { formatVND } from "@/lib/utils/currency";
import { promotionsApi, CouponItem, CreateCouponInput } from "@/features/promotions/api/promotions.api";

export default function AdminPromotionsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state cho modal tạo voucher
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENT" | "FREE_SHIPPING">("FIXED");
  const [discountValue, setDiscountValue] = useState<number>(20000);
  const [minSubtotal, setMinSubtotal] = useState<number>(100000);
  const [maxDiscount, setMaxDiscount] = useState<number>(50000);
  const [totalLimit, setTotalLimit] = useState<number>(100);
  const [perUserLimit, setPerUserLimit] = useState<number>(1);
  const [startsAt, setStartsAt] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endsAt, setEndsAt] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await promotionsApi.getAdminCoupons({ limit: 100 });
      setCoupons(res.items);
    } catch (err) {
      console.error("Failed to load coupons:", err);
      showToast("error", "Không thể tải danh sách voucher từ máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleToggleStatus = async (coupon: CouponItem) => {
    try {
      const nextStatus = !coupon.is_active;
      await promotionsApi.toggleCouponStatus(coupon.id, nextStatus);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: nextStatus } : c))
      );
      showToast("success", `Đã ${nextStatus ? "kích hoạt" : "tạm dừng"} mã "${coupon.code}".`);
    } catch (err: any) {
      console.error("Failed to toggle coupon status:", err);
      showToast("error", err?.message || "Không thể cập nhật trạng thái voucher.");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast("error", "Vui lòng nhập mã ưu đãi.");
      return;
    }
    if (!name.trim()) {
      showToast("error", "Vui lòng nhập tên chương trình ưu đãi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCouponInput = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_subtotal: Number(minSubtotal) || 0,
        max_discount: discountType === "PERCENT" ? Number(maxDiscount) || undefined : undefined,
        total_limit: Number(totalLimit) || undefined,
        per_user_limit: Number(perUserLimit) || 1,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(`${endsAt}T23:59:59.999Z`).toISOString(),
        is_active: true,
      };

      await promotionsApi.createCoupon(payload);
      showToast("success", `Tạo thành công voucher "${payload.code}"!`);
      setIsModalOpen(false);

      // Reset form
      setCode("");
      setName("");
      setDiscountValue(20000);
      setMinSubtotal(100000);
      setMaxDiscount(50000);
      setTotalLimit(100);

      await loadCoupons();
    } catch (err: any) {
      console.error("Failed to create coupon:", err);
      showToast("error", err?.message || "Lỗi khi tạo mã voucher mới. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDiscountDisplay = (c: CouponItem) => {
    if (c.discount_type === "PERCENT" || c.discount_type === "PERCENTAGE") {
      const maxVal = c.max_discount ?? c.max_discount_amount;
      return `${c.discount_value}% ${maxVal ? `(Tối đa ${formatVND(maxVal)})` : ""}`;
    }
    if (c.discount_type === "FREE_SHIPPING") {
      const maxVal = c.max_discount ?? c.max_discount_amount;
      return `Freeship ${maxVal ? `(Tối đa ${formatVND(maxVal)})` : ""}`;
    }
    return formatVND(c.discount_value);
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;
    if (statusFilter === "ACTIVE") return c.is_active;
    if (statusFilter === "INACTIVE") return !c.is_active;
    return true;
  });

  return (
    <>
      <AdminHeader
        title="Quản lý Khuyến mãi & Voucher"
        subtitle="Thiết lập mã giảm giá, chiết khấu phần trăm, giới hạn lượt dùng và thời gian áp dụng thực tế"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadCoupons} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              <span>Tạo voucher mới</span>
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {toastMessage && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              toastMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã code hoặc tên voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "ALL"
                  ? "bg-brand-red text-white"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              Tất cả ({coupons.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "ACTIVE"
                  ? "bg-brand-red text-white"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              Đang chạy ({coupons.filter((c) => c.is_active).length})
            </button>
            <button
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "INACTIVE"
                  ? "bg-brand-red text-white"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              Tạm dừng ({coupons.filter((c) => !c.is_active).length})
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <TicketPercent className="w-5 h-5 text-brand-red" />
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Danh sách mã ưu đãi ({filteredCoupons.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-hover border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="py-3 px-4">Mã Code</th>
                  <th className="py-3 px-4">Chương trình ưu đãi</th>
                  <th className="py-3 px-4">Loại giảm giá</th>
                  <th className="py-3 px-4">Giá trị giảm</th>
                  <th className="py-3 px-4">Đơn tối thiểu</th>
                  <th className="py-3 px-4">Lượt dùng</th>
                  <th className="py-3 px-4">Thời hạn</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-ink-muted">
                      Đang tải danh sách voucher từ cơ sở dữ liệu...
                    </td>
                  </tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-ink-muted">
                      Không tìm thấy mã khuyến mãi nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-red text-sm">
                        {c.code}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-ink max-w-[220px] truncate">
                        {c.name || c.description || "Ưu đãi khách hàng"}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {c.discount_type === "PERCENT" || c.discount_type === "PERCENTAGE" ? (
                          <Badge variant="brand" size="sm">Giảm %</Badge>
                        ) : c.discount_type === "FREE_SHIPPING" ? (
                          <Badge variant="warning" size="sm">Freeship</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Tiền mặt</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-xs text-ink">
                        {formatDiscountDisplay(c)}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-ink-muted">
                        {formatVND(c.min_subtotal ?? c.min_order_amount ?? 0)}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="font-semibold text-ink">
                          {c.redemptions_count ?? c.used_count ?? 0}
                        </span>
                        <span className="text-ink-muted"> / {c.total_limit ?? c.usage_limit ?? "∞"}</span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-ink-muted">
                        {c.ends_at
                          ? new Date(c.ends_at).toLocaleDateString("vi-VN")
                          : c.expires_at
                          ? new Date(c.expires_at).toLocaleDateString("vi-VN")
                          : "Vô thời hạn"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={c.is_active ? "success" : "neutral"} size="sm">
                          {c.is_active ? "Đang chạy" : "Tạm dừng"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`text-xs font-bold transition-colors ${
                            c.is_active
                              ? "text-red-600 hover:text-red-700 hover:underline"
                              : "text-emerald-600 hover:text-emerald-700 hover:underline"
                          }`}
                        >
                          {c.is_active ? "Tạm dừng" : "Kích hoạt"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tạo Voucher Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-brand-red" />
                <h3 className="font-bold text-base text-ink">Tạo Mã Khuyến Mãi Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-ink-muted hover:text-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Mã Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: VIVIET30"
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono font-bold text-brand-red uppercase focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  >
                    <option value="FIXED">Giảm tiền mặt cố định (VNĐ)</option>
                    <option value="PERCENT">Giảm theo tỷ lệ phần trăm (%)</option>
                    <option value="FREE_SHIPPING">Miễn phí giao hàng (Freeship)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Tên chương trình ưu đãi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Tri Ân Khách Hàng - Giảm 20.000đ cho đơn đầu tiên"
                  className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    {discountType === "PERCENT"
                      ? "Mức giảm (%)"
                      : "Số tiền giảm (VNĐ)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={discountType === "PERCENT" ? 1 : 1000}
                    max={discountType === "PERCENT" ? 100 : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Đơn hàng tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minSubtotal}
                    onChange={(e) => setMinSubtotal(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>

              {discountType === "PERCENT" && (
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Mức giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Tổng lượt dùng toàn hệ thống
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalLimit}
                    onChange={(e) => setTotalLimit(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Giới hạn lượt dùng / khách
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Ngày bắt đầu áp dụng
                  </label>
                  <input
                    type="date"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Ngày hết hạn ưu đãi
                  </label>
                  <input
                    type="date"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Đang xử lý..." : "Lưu voucher mới"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
