import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-cream font-bold text-base shadow-sm">
          VV
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xl tracking-wider text-brand-red">VỊ VIỆT</span>
          <span className="text-[10px] tracking-widest text-turmeric uppercase font-semibold">Bếp Mẹ Truyền Thống</span>
        </div>
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

