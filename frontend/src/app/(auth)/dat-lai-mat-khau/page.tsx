"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/features/auth/api/auth.api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage("Không tìm thấy mã xác thực trong đường dẫn liên kết.");
      return;
    }

    if (password.length < 10) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 10 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg text-center space-y-2">
        <p className="font-semibold">Thiếu mã xác thực khôi phục mật khẩu</p>
        <p>Vui lòng nhấp vào liên kết trong email gửi đến hoặc yêu cầu liên kết mới.</p>
        <Link href="/quen-mat-khau" className="inline-block mt-2 text-brand-red font-semibold hover:underline">
          Yêu cầu cấp liên kết mới
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg text-center space-y-2">
        <p className="font-semibold">Mật khẩu đã được thay đổi thành công!</p>
        <p>Tất cả các phiên làm việc cũ đã được thu hồi. Vui lòng đăng nhập với mật khẩu mới.</p>
        <Link href="/dang-nhap" className="inline-block mt-2 text-brand-red font-semibold hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
          {errorMessage}
        </div>
      )}

      <Input
        label="Mật khẩu mới"
        type="password"
        placeholder="Tối thiểu 10 ký tự"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
      />

      <Input
        label="Xác nhận mật khẩu mới"
        type="password"
        placeholder="Nhập lại mật khẩu mới"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isLoading}
        required
      />

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={isLoading}>
        {isLoading ? "Đang cập nhật mật khẩu..." : "Cập nhật mật khẩu"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-ink">Đặt lại mật khẩu</h1>
        <p className="text-xs text-ink-muted">Tạo mật khẩu mới an toàn cho tài khoản của bạn</p>
      </div>

      <Suspense fallback={<div className="text-center text-xs text-ink-muted">Đang tải biểu mẫu...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
