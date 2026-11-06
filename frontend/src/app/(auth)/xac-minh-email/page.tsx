"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h1 className="text-xl font-bold text-ink">Xác minh email thành công!</h1>
      <p className="text-xs text-ink-muted">
        {token
          ? "Tài khoản của bạn đã được kích hoạt. Hãy bắt đầu hành trình thưởng thức ẩm thực cùng Vị Việt."
          : "Cảm ơn bạn đã xác thực tài khoản."}
      </p>

      <div className="pt-2">
        <Link href="/dang-nhap">
          <Button variant="primary" size="md" className="w-full">
            Đăng nhập ngay
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-xs text-ink-muted">Đang xác thực email...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

