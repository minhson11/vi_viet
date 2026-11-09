"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChefHat,
  ShoppingBag,
  LogOut,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/auth-context";
import { cn } from "@/lib/utils/cn";

export const StaffSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Nhân viên";
  const userInitials = displayName.substring(0, 2).toUpperCase();

  const navItems = [
    {
      title: "Màn hình Bếp KDS",
      href: "/staff/kitchen",
      icon: ChefHat,
      subtitle: "Chế biến & Báo hoàn tất món",
    },
    {
      title: "Điều Phối Đơn Hàng",
      href: "/staff/orders",
      icon: ShoppingBag,
      subtitle: "Tiếp nhận & Điều phối trạng thái",
    },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col justify-between shrink-0 sticky top-0 z-30 select-none">
      {/* 1. Header Thương hiệu & Khu vực Bếp */}
      <div>
        <div className="h-16 px-5 border-b border-border flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer"
            title="Về trang chủ Vị Việt"
          >
            <img
              src="/logo-emblem.svg"
              alt="Vị Việt"
              className="w-8 h-8 object-contain group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-bold text-xs tracking-wider text-brand-red font-headline leading-tight">
                VỊ VIỆT
              </span>
              <span className="text-[10px] text-ink-muted leading-tight font-medium">
                Bếp Vận Hành &amp; POS
              </span>
            </div>
          </Link>

          <span className="text-[10px] bg-herb/15 text-herb border border-herb/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {user?.role === "ADMIN" ? "ADMIN" : "KITCHEN"}
          </span>
        </div>

        {/* 2. Menu Điều hướng nghiệp vụ */}
        <div className="p-3 space-y-1.5">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-light">
            Nghiệp Vụ Vận Hành
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/staff/orders" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group",
                  isActive
                    ? "bg-brand-red text-cream shadow-sm shadow-brand-red/20 font-bold"
                    : "text-ink hover:bg-surface-hover hover:text-brand-red"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 mt-0.5 transition-transform group-hover:scale-110",
                    isActive ? "text-cream" : "text-brand-red"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate leading-tight">{item.title}</p>
                  <p
                    className={cn(
                      "text-[10px] truncate mt-0.5 font-normal",
                      isActive ? "text-cream/80" : "text-ink-muted"
                    )}
                  >
                    {item.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 3. Lối tắt quản trị nếu là Admin */}
        {user?.role === "ADMIN" && (
          <div className="px-3 pt-2 border-t border-border/60 mx-3 space-y-1">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-light">
              Phím Tắt Quản Trị
            </p>
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-hover hover:text-brand-red transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-brand-red shrink-0" />
              <span>Trang Quản Trị Hệ Thống</span>
            </Link>
          </div>
        )}

        {/* 4. Link về trang chủ Storefront */}
        <div className="px-3 pt-2 mx-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <Store className="w-4 h-4 text-ink-muted shrink-0" />
            <span>Về Cổng Khách Hàng</span>
          </Link>
        </div>
      </div>

      {/* 5. Chân Sidebar: Thông tin Nhân viên & 1 Nút Đăng Xuất Duy Nhất */}
      <div className="p-3 border-t border-border bg-surface-low/30 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red to-brand-red-hover text-cream flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ink truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-ink-muted truncate font-medium">
              {user?.role === "ADMIN" ? "Quản Trị Viên" : "Nhân Viên Điều Phối"}
            </p>
          </div>
        </div>

        {/* 1 Nút đăng xuất duy nhất của khu vực Staff */}
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl border border-red-200/60 transition-all cursor-pointer active:scale-98 shadow-2xs"
          title="Đăng xuất tài khoản nhân viên"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Đăng xuất phiên làm việc</span>
        </button>
      </div>
    </aside>
  );
};
