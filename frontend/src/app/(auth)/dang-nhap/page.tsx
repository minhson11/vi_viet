"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { httpClient } from "@/lib/http/client";
import { useAuth } from "@/features/auth/context/auth-context";
import { SocialAuthButtons } from "@/features/auth/components/social-auth-buttons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const isRegistered = searchParams.get("registered") === "true";

  const { setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res: any = await httpClient.post("/auth/login", { email, password });
      if (res && res.access_token) {
        // Lưu phiên bền vững vào cả LocalStorage và Cookies với Refresh Token & RememberMe
        setSession(res.access_token, res.refresh_token, res.user, rememberMe);

        // Chuyển hướng theo param redirect nếu có
        if (redirectTarget) {
          router.push(redirectTarget);
          return;
        }

        // Chuyển hướng theo vai trò (Role)
        const userRole = res.user?.role;
        if (userRole === "ADMIN") {
          router.push("/admin");
        } else if (userRole === "OPERATOR") {
          router.push("/staff/orders");
        } else if (userRole === "KITCHEN") {
          router.push("/staff/kitchen");
        } else {
          router.push("/tai-khoan");
        }
      } else {
        router.push("/tai-khoan");
      }
    } catch (err: any) {
      setError(err.message || "Email hoặc mật khẩu không chính xác.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center space-y-1 pb-1">
        <h1 className="text-2xl font-bold font-headline text-ink tracking-tight">
          Đăng nhập
        </h1>
        <p className="text-xs text-ink-muted">
          {redirectTarget
            ? "Vui lòng đăng nhập tài khoản để tiếp tục"
            : "Chào mừng quý khách quay trở lại với Vị Việt"}
        </p>
      </div>

      {isRegistered && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl font-medium">
          Đăng ký tài khoản thành công! Hãy đăng nhập để bắt đầu đặt tiệc ngay.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      <Input
        label="Địa chỉ Email"
        type="email"
        placeholder="tenban@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Mật khẩu"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded text-brand-red cursor-pointer accent-brand-red"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span className="text-ink-muted">Ghi nhớ đăng nhập (30 ngày)</span>
        </label>
        <Link href="/quen-mat-khau" className="text-brand-red hover:underline font-semibold">
          Quên mật khẩu?
        </Link>
      </div>

      <Button type="submit" variant="primary" size="md" className="w-full h-11 text-xs uppercase font-bold tracking-wider" isLoading={isLoading}>
        Đăng nhập ngay
      </Button>

      {/* Đăng nhập nhanh bằng Mạng Xã Hội dành cho Khách hàng */}
      <SocialAuthButtons
        redirectTarget={redirectTarget}
        rememberMe={rememberMe}
      />

      <div className="pt-2 text-center text-xs border-t border-border/70">
        <p className="text-ink-muted">
          Chưa có tài khoản Vị Việt?{" "}
          <Link href="/dang-ky" className="text-brand-red font-semibold hover:underline">
            Đăng ký thành viên mới
          </Link>
        </p>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-ink-muted">
          Đang tải trang đăng nhập...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
