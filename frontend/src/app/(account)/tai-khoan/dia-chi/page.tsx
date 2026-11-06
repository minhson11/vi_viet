"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { userProfileApi, UserAddress } from "@/features/auth/api/user-profile.api";

export default function AccountAddressPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const list = await userProfileApi.getAddresses();
      setAddresses(list);
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !phone || !addressLine) return;
    setIsSubmitting(true);
    try {
      await userProfileApi.createAddress({
        recipient_name: recipientName,
        phone,
        address_line: addressLine,
        is_default: isDefault,
      });
      setShowAddForm(false);
      setRecipientName("");
      setPhone("");
      setAddressLine("");
      setIsDefault(false);
      await loadAddresses();
    } catch (err) {
      console.error("Failed to create address:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await userProfileApi.setDefaultAddress(id);
      await loadAddresses();
    } catch (err) {
      console.error("Failed to set default address:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      await userProfileApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete address:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-lg font-bold text-ink">Sổ địa chỉ giao hàng</h1>
          <p className="text-xs text-ink-muted">Quản lý các địa chỉ nhận món để đặt nhanh hơn</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? "Đóng form" : "Thêm địa chỉ mới"}</span>
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-ink">Địa chỉ giao hàng mới</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Họ tên người nhận"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
            <Input
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              required
            />
          </div>
          <Input
            label="Địa chỉ chi tiết (Số nhà, tên toà nhà, đường, quận/huyện)"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="Số 10, Ngõ 123 Đường Cầu Giấy, Phường Quan Hoa, Cầu Giấy, Hà Nội"
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-brand-red rounded"
            />
            <label htmlFor="isDefault" className="text-xs font-semibold text-ink cursor-pointer">
              Đặt làm địa chỉ giao hàng mặc định
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu địa chỉ"}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-xs text-ink-muted">
          Đang nạp sổ địa chỉ...
        </div>
      ) : addresses.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-2">
          <MapPin className="w-8 h-8 text-ink-muted mx-auto opacity-40" />
          <p className="text-sm font-semibold text-ink">Bạn chưa lưu địa chỉ giao hàng nào</p>
          <p className="text-xs text-ink-muted">
            Thêm địa chỉ ngay để nhận món ăn nóng hổi nhanh chóng tại nhà hoặc công sở.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="border border-border rounded-xl p-4 bg-surface hover:border-brand-red/40 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">{a.recipient_name}</span>
                    {a.is_default && (
                      <span className="text-[10px] bg-brand-red/10 text-brand-red px-2 py-0.5 rounded font-bold">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink mt-1 font-mono">{a.phone}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{a.address_line}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {!a.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(a.id)}
                    className="text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Đặt mặc định
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(a.id)}
                  className="text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
