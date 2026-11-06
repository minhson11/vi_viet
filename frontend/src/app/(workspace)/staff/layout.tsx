"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, ChefHat, LogOut, ArrowLeft } from "lucide-react";
import { StaffGuard } from "@/features/auth/components/auth-guard";
import { useAuth } from "@/features/auth/context/auth-context";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();

  return (
    <StaffGuard>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top Header for Staff/Kitchen */}
        <header className="h-14 bg-surface border-b border-border px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {user?.role === "ADMIN" && (
              <>
                <Link
                  href="/admin"
                  className="text-xs font-semibold text-ink-muted hover:text-brand-red flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Về Admin</span>
                </Link>
                <div className="h-4 w-px bg-border" />
              </>
            )}
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-ink">BẾP VẬN HÀNH</span>
              <span className="text-[10px] bg-herb text-white px-2 py-0.5 rounded font-bold">
                {user?.role || "STAFF"}
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/staff/orders"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-surface-hover transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-brand-red" />
              <span>Đơn hàng POS</span>
            </Link>

            <Link
              href="/staff/kitchen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-surface-hover transition-colors"
            >
              <ChefHat className="w-4 h-4 text-herb" />
              <span>Màn hình Bếp KDS</span>
            </Link>

            <div className="h-4 w-px bg-border mx-1" />

            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-1.5 text-ink-muted hover:text-red-600 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </StaffGuard>
  );
}
