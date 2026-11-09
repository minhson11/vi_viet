"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/features/auth/context/auth-context";
import {
  UtensilsCrossed,
  ChefHat,
  ShoppingBag,
  TicketPercent,
  Users,
  Star,
  FileText,
  CreditCard,
  BarChart3,
  UserCog,
  Settings,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  group?: "operations" | "catalog" | "marketing" | "management";
}

const navItems: NavItem[] = [
  { title: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { title: "Thực đơn & Món", href: "/admin/menu", icon: UtensilsCrossed },
  { title: "Đơn hàng (Staff)", href: "/staff/orders", icon: ShoppingBag },
  { title: "Nhà bếp KDS", href: "/staff/kitchen", icon: ChefHat },
  { title: "Khuyến mãi", href: "/admin/promotions", icon: TicketPercent },
  { title: "Khách hàng", href: "/admin/customers", icon: Users },
  { title: "Đánh giá", href: "/admin/reviews", icon: Star },
  { title: "Nội dung & Story", href: "/admin/content", icon: FileText },
  { title: "Thanh toán", href: "/admin/payments", icon: CreditCard },
  { title: "Báo cáo doanh thu", href: "/admin/reports", icon: BarChart3 },
  { title: "Nhân viên & Phân quyền", href: "/admin/staff", icon: UserCog },
  { title: "Cấu hình hệ thống", href: "/admin/settings", icon: Settings },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <Link
        href="/"
        title="Xem trang bán hàng Vị Việt"
        className="h-16 px-5 border-b border-border flex items-center gap-3 group hover:bg-surface-hover/50 transition-colors"
      >
        <img
          src="/logo-emblem.svg"
          alt="Vị Việt"
          className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
        />
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-wide text-brand-red font-headline">
            VỊ VIỆT ADMIN
          </span>
          <span className="text-[10px] text-ink-muted">Hệ thống quản trị & vận hành</span>
        </div>
      </Link>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-brand-red text-cream font-semibold shadow-xs"
                  : "text-ink hover:bg-surface-hover hover:text-brand-red"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-cream" : "text-ink-muted group-hover:text-brand-red")} />
              <span className="flex-1 truncate">{item.title}</span>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-red/10 text-brand-red font-semibold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer: Nút Đăng xuất duy nhất */}
      <div className="p-3 border-t border-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Đăng xuất hệ thống</span>
        </button>
      </div>
    </aside>
  );
};

