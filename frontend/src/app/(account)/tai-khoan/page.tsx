"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { userProfileApi, UserProfile } from "@/features/auth/api/user-profile.api";

export default function AccountProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await userProfileApi.getProfile();
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
      } catch (err: any) {
        setErrorMsg(err.message || "Không thể tải hồ sơ cá nhân");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const updated = await userProfileApi.updateProfile({
        full_name: fullName,
        phone,
      });
      setProfile(updated);
      setSuccessMsg("Cập nhật thông tin tài khoản thành công!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra khi lưu thay đổi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold text-ink">Hồ sơ cá nhân</h1>
        <p className="text-xs text-ink-muted">Cập nhật thông tin liên hệ và cài đặt tài khoản</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-xs text-ink-muted">
          Đang nạp hồ sơ của bạn...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên..."
            />
            <Input
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
            />
            <Input
              label="Địa chỉ Email"
              value={email}
              disabled
              helperText="Email dùng để đăng nhập và nhận thông báo đơn hàng"
            />
            <Input
              label="Vai trò tài khoản"
              value={profile?.role || "CUSTOMER"}
              disabled
              helperText="Quyền hạn truy cập trong hệ thống"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
