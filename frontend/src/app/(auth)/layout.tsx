import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Nút Quay về trang chủ dạng pill với con trỏ bàn tay và hiệu ứng hover mượt mà */}
      <div className="w-full max-w-md flex justify-start mb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/80 bg-surface hover:bg-white text-xs font-semibold text-ink-muted hover:text-brand-red hover:border-brand-red/40 hover:shadow-xs active:scale-95 transition-all shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-ink-muted group-hover:text-brand-red group-hover:-translate-x-1 transition-all" />
          <span>Quay về trang chủ</span>
        </Link>
      </div>

      {/* Brand Logo Vị Việt */}
      <Link href="/" className="inline-block group mb-6 text-center cursor-pointer">
        <img
          src="/logo.svg"
          alt="Vị Việt - Contemporary Culinary"
          className="h-14 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform cursor-pointer"
        />
      </Link>

      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-xl">
        {children}
      </div>

      <div className="mt-8 text-xs text-ink-muted">
        © {new Date().getFullYear()} Vị Việt Restaurant. All rights reserved.
      </div>
    </div>
  );
}
