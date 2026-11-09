"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/features/auth/api/auth.api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Không thể gửi yêu cầu khôi phục. Vui lòng thử lại sau.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-ink">Quên mật khẩu?</h1>
        <p className="text-xs text-ink-muted">Nhập email đăng ký để nhận liên kết khôi phục</p>
      </div>

      {submitted ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg text-center space-y-2">
          <p className="font-semibold">Đã gửi hướng dẫn khôi phục!</p>
          <p>Vui lòng kiểm tra hộp thư đến (và thư mục rác) của địa chỉ: {email}</p>
          <Link href="/dang-nhap" className="inline-block mt-2 text-brand-red font-semibold hover:underline">
            Quay lại Đăng nhập
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
              {errorMessage}
            </div>
          )}

          <Input
            label="Địa chỉ Email"
            type="email"
            placeholder="tenban@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />

          <Button type="submit" variant="primary" size="md" className="w-full" disabled={isLoading}>
            {isLoading ? "Đang gửi liên kết..." : "Gửi liên kết khôi phục"}
          </Button>

          <p className="text-xs text-center text-ink-muted">
            Nhớ mật khẩu?{" "}
            <Link href="/dang-nhap" className="text-brand-red font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

