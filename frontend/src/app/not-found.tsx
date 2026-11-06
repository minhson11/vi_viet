import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-center">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center mx-auto">
          <Utensils className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-brand-red font-serif">404</h1>
        <h2 className="text-lg font-bold text-ink">Không tìm thấy trang yêu cầu</h2>
        <p className="text-xs text-ink-muted">
          Trang bạn đang truy cập có thể đã bị di chuyển hoặc không còn tồn tại trong hệ thống Vị Việt.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" size="md">
              Về trang chủ Vị Việt
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

