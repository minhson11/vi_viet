"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { httpClient } from "@/lib/http/client";
import { useAuth } from "@/features/auth/context/auth-context";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

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
        const userRole = res.user?.role;

        // Chỉ cho phép nhân sự nội bộ (ADMIN, OPERATOR, KITCHEN)
        if (userRole !== "ADMIN" && userRole !== "OPERATOR" && userRole !== "KITCHEN") {
          setError("Thông tin đăng nhập không hợp lệ hoặc tài khoản không có quyền truy cập.");
          setIsLoading(false);
          return;
        }

        // Lưu phiên đăng nhập an toàn
        setSession(res.access_token, res.refresh_token, res.user, rememberMe);

        // Chuyển hướng theo vai trò nội bộ
        if (redirectTarget && redirectTarget.startsWith("/admin")) {
          router.push(redirectTarget);
          return;
        }

        if (userRole === "ADMIN") {
          router.push("/admin");
        } else if (userRole === "OPERATOR") {
          router.push("/staff/orders");
        } else if (userRole === "KITCHEN") {
          router.push("/staff/kitchen");
        } else {
          router.push("/admin");
        }
      }
    } catch {
      setError("Thông tin đăng nhập không chính xác hoặc tài khoản không có quyền truy cập.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Thẻ Form Quản trị với phong cách Executive Dark sang trọng */}
      <div className="bg-[#1c1917]/95 border-2 border-[#d97706]/40 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-6">
        {/* Header Logo & Emblem */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#292524] to-[#1c1917] border border-[#d97706]/50 p-2.5 shadow-[0_0_25px_rgba(217,119,6,0.3)] flex items-center justify-center">
              <img
                src="/logo-emblem.svg"
                alt="Vị Việt Admin"
                className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(217,119,6,0.5)]"
              />
            </div>
            <div className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-gold/40 shadow-xs flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-gold" />
              <span>Console</span>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black font-headline text-cream tracking-tight">
              VỊ VIỆT ADMIN PORTAL
            </h1>
            <p className="text-xs text-white/60 mt-1">
              Hệ thống điều hành, thực đơn & trung tâm dữ liệu nhà hàng
            </p>
          </div>

          {/* Huy hiệu bảo mật RBAC */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Khu vực phân quyền nội bộ (RBAC)</span>
          </div>
        </div>

        {/* Thông báo lỗi (không tiết lộ thông tin vai trò hay tài khoản) */}
        {error && (
          <div className="p-3.5 bg-red-950/60 border border-red-500/60 text-red-200 text-xs rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form Đăng nhập */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream/90 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gold" />
              <span>Email Quản trị viên</span>
            </label>
            <input
              type="email"
              placeholder="Email tài khoản được cấp quyền"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-4 text-xs bg-[#292524]/80 border border-[#d97706]/40 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream/90 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gold" />
              <span>Mật khẩu bảo mật</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-11 px-4 text-xs bg-[#292524]/80 border border-[#d97706]/40 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-white/70 hover:text-white transition-colors">
              <input
                type="checkbox"
                className="rounded accent-brand-red cursor-pointer w-3.5 h-3.5"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Duy trì phiên đăng nhập</span>
            </label>
            <span className="text-[11px] text-white/40">Bảo mật SSL 256-bit</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full h-11 bg-gradient-to-r from-brand-red to-brand-red/90 hover:from-brand-red/90 hover:to-brand-red text-cream font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-brand-red/20 border border-gold/40 cursor-pointer"
            isLoading={isLoading}
          >
            Đăng nhập Quản Trị Hệ Thống
          </Button>
        </form>

        {/* Footer điều hướng về trang chủ */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-center text-xs text-white/50">
          <Link
            href="/"
            className="hover:text-gold transition-colors flex items-center gap-1.5 cursor-pointer group py-1.5 px-3.5 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Về trang chủ Vị Việt</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#0c0a09] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(183,46,36,0.25),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-xs text-gold/80 animate-pulse">
            Đang tải Cổng Quản trị...
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>

      <div className="mt-8 text-center text-[11px] text-white/40 space-y-1">
        <p>© {new Date().getFullYear()} Vị Việt Restaurant Management System.</p>
        <p className="text-[10px]">Chỉ dành cho nhân sự được phân quyền quản lý.</p>
      </div>
    </div>
  );
}
