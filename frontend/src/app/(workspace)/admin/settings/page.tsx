"use client";

import React, { useEffect, useState } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { Save, CheckCircle2, Clock, Truck, Store, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storeSettingsApi } from "@/features/admin-settings/api/store-settings.api";

export default function AdminSettingsPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [paymentTimeout, setPaymentTimeout] = useState(15);

  // Giờ hoạt động
  const [openWeekdays, setOpenWeekdays] = useState("07:00 - 22:00");
  const [openWeekends, setOpenWeekends] = useState("06:30 - 23:00");

  // Quy chuẩn giao hàng
  const [baseFee, setBaseFee] = useState(20000);
  const [freeShipThreshold, setFreeShipThreshold] = useState(300000);
  const [maxDistanceKm, setMaxDistanceKm] = useState(15);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const s = await storeSettingsApi.getSettings();
      if (s) {
        setName(s.name || "");
        setPhone(s.phone || "");
        setAddress(s.address || "");
        setAcceptingOrders(s.accepting_orders ?? true);
        setPaymentTimeout(s.payment_timeout_minutes || 15);

        if (s.opening_hours) {
          setOpenWeekdays((s.opening_hours as any).monday_friday || "07:00 - 22:00");
          setOpenWeekends((s.opening_hours as any).saturday_sunday || "06:30 - 23:00");
        }

        if (s.delivery_rules) {
          setBaseFee(Number((s.delivery_rules as any).base_fee || 20000));
          setFreeShipThreshold(Number((s.delivery_rules as any).free_shipping_threshold || 300000));
          setMaxDistanceKm(Number((s.delivery_rules as any).max_distance_km || 15));
        }
      }
    } catch (err) {
      console.error("Failed to load store settings:", err);
      showToast("error", "Không thể tải cấu hình cửa hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await storeSettingsApi.updateSettings({
        name,
        phone,
        address,
        accepting_orders: acceptingOrders,
        payment_timeout_minutes: Number(paymentTimeout),
        opening_hours: {
          monday_friday: openWeekdays,
          saturday_sunday: openWeekends,
        },
        delivery_rules: {
          base_fee: Number(baseFee),
          free_shipping_threshold: Number(freeShipThreshold),
          max_distance_km: Number(maxDistanceKm),
        },
      });
      showToast("success", "Đã lưu thành công cấu hình hệ thống vào cơ sở dữ liệu!");
    } catch (err: any) {
      console.error("Failed to update store settings:", err);
      showToast("error", err?.message || "Lỗi khi lưu cấu hình.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <AdminHeader
        title="Cấu hình Hệ thống & Bếp Mẹ"
        subtitle="Thông số vận hành, thời gian mở cửa, quy chuẩn giao nóng và thời hạn giữ chỗ VNPAY"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadSettings} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>{isSaving ? "Đang lưu..." : "Lưu cấu hình"}</span>
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-5xl space-y-6">
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Thông tin cơ bản */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Store className="w-5 h-5 text-brand-red" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                1. Thông tin Bếp Trung Tâm & Nhận Đơn
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Tên thương hiệu nhà hàng
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vị Việt - Bếp Mẹ Truyền Thống"
                  className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Hotline đặt món & CSKH
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Địa chỉ bếp trung tâm
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số 18 Phố Ẩm Thực, Quận Cầu Giấy, Hà Nội"
                className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="p-4 bg-surface-hover/50 rounded-xl border border-border flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-ink">Trạng thái mở cửa nhận đơn trực tuyến</h4>
                <p className="text-xs text-ink-muted mt-0.5">
                  Khi tạm ngưng, khách hàng trên storefront sẽ nhận được thông báo bếp tạm nghỉ nhận đơn mới.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={acceptingOrders}
                  onChange={(e) => setAcceptingOrders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>

          {/* Card 2: Thời gian hoạt động & Thanh toán */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Clock className="w-5 h-5 text-brand-red" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                2. Giờ Hoạt Động & Thời Hạn Thanh Toán
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Thứ Hai - Thứ Sáu
                </label>
                <input
                  type="text"
                  value={openWeekdays}
                  onChange={(e) => setOpenWeekdays(e.target.value)}
                  placeholder="07:00 - 22:00"
                  className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Thứ Bảy - Chủ Nhật
                </label>
                <input
                  type="text"
                  value={openWeekends}
                  onChange={(e) => setOpenWeekends(e.target.value)}
                  placeholder="06:30 - 23:00"
                  className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Thời hạn thanh toán VNPAY (phút)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={paymentTimeout}
                  onChange={(e) => setPaymentTimeout(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Quy chuẩn giao hàng */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Truck className="w-5 h-5 text-brand-red" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                3. Quy Chuẩn Vận Chuyển Giao Nóng
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Phí giao hàng cơ bản (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={baseFee}
                  onChange={(e) => setBaseFee(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Ngưỡng Freeship tự động (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={freeShipThreshold}
                  onChange={(e) => setFreeShipThreshold(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Bán kính giao tối đa (km)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxDistanceKm}
                  onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="lg" disabled={isSaving}>
              <Save className="w-5 h-5 mr-2" />
              <span>{isSaving ? "Đang lưu thông số..." : "Lưu Cấu Hình Hệ Thống"}</span>
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
