"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { authApi } from "@/features/auth/api/auth.api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("ERROR");
      setErrorMessage("Không tìm thấy mã xác thực trong đường dẫn liên kết.");
      return;
    }

    let isMounted = true;
    setStatus("LOADING");

    authApi
      .verifyEmail(token)
      .then(() => {
        if (isMounted) {
          setStatus("SUCCESS");
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setStatus("ERROR");
          setErrorMessage(
            err?.message || "Mã xác minh email không hợp lệ hoặc đã hết hạn.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (status === "LOADING") {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-12 h-12 rounded-full bg-turmeric/20 text-brand-red flex items-center justify-center mx-auto animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-ink">Đang xác thực email của bạn...</h2>
        <p className="text-xs text-ink-muted">Hệ thống đang kiểm tra tính hợp lệ của mã xác thực.</p>
      </div>
    );
  }

  if (status === "ERROR") {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-ink">Xác minh không thành công</h1>
        <p className="text-xs text-ink-muted">
          {errorMessage || "Mã xác thực không hợp lệ hoặc đã hết hiệu lực."}
        </p>

        <div className="pt-2 flex flex-col gap-2">
          <Link href="/dang-nhap">
            <Button variant="primary" size="md" className="w-full">
              Đến trang Đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h1 className="text-xl font-bold text-ink">Xác minh email thành công!</h1>
      <p className="text-xs text-ink-muted">
        Tài khoản của bạn đã được kích hoạt thành công. Hãy bắt đầu hành trình thưởng thức ẩm thực cùng Vị Việt.
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
    <Suspense fallback={<div className="text-center text-xs text-ink-muted">Đang chuẩn bị xác thực email...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
