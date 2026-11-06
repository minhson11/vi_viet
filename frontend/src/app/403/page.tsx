"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

function ForbiddenContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const getReasonText = () => {
    if (reason === "admin_required") {
      return "Khu vực này chỉ dành riêng cho Quản trị viên (ADMIN) của nhà hàng Vị Việt. Tài khoản của bạn không có quyền truy cập.";
    }
    if (reason === "staff_required") {
      return "Khu vực này chỉ dành cho Nhân viên vận hành POS hoặc Nhân sự nhà bếp. Tài khoản của bạn không có quyền truy cập.";
    }
    return "Bạn không có quyền truy cập vào tài nguyên này. Vui lòng đăng nhập bằng tài khoản có phân quyền thích hợp.";
  };

  const handleLogoutAndRelogin = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("viviet_token");
      localStorage.removeItem("viviet_user");
      document.cookie = "viviet_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
      document.cookie = "viviet_user=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
      window.location.href = "/dang-nhap";
    }
  };

  return (
    <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 shadow-xl text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-serif text-ink">403 - Quyền Truy Cập Bị Từ Chối</h1>
        <p className="text-xs text-ink-muted leading-relaxed">
          {getReasonText()}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 pt-2">
        <button
          onClick={handleLogoutAndRelogin}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-brand-red text-cream rounded-xl hover:bg-brand-red-hover transition-colors shadow-xs"
        >
          <LogIn className="w-4 h-4" />
          <span>Đăng nhập tài khoản khác</span>
        </button>

        <Link href="/">
          <Button variant="outline" size="md" className="w-full">
            <Home className="w-4 h-4 mr-1.5" />
            <span>Về trang chủ Vị Việt</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Suspense fallback={<div className="text-center text-xs text-ink-muted">Đang kiểm tra quyền hạn...</div>}>
        <ForbiddenContent />
      </Suspense>
    </div>
  );
}

