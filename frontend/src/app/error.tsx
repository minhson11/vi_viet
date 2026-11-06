"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-ink">Đã có lỗi xảy ra</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          {error.message || "Hệ thống gặp sự cố ngoài dự kiến khi xử lý trang này."}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
          <Button variant="primary" size="sm" onClick={() => reset()}>
            Thử lại
          </Button>
        </div>
      </div>
    </div>
  );
}

