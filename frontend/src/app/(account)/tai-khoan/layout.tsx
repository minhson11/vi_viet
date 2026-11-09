"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { User, MapPin, Heart, ShoppingBag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/features/auth/context/auth-context";

const accountNav = [
  { title: "Hồ sơ cá nhân", href: "/tai-khoan", icon: User },
  { title: "Lịch sử đơn hàng", href: "/tai-khoan/don-hang", icon: ShoppingBag },
  { title: "Địa chỉ giao hàng", href: "/tai-khoan/dia-chi", icon: MapPin },
  { title: "Sở thích & Khẩu vị", href: "/tai-khoan/so-thich", icon: Sparkles },
  { title: "Món ăn yêu thích", href: "/tai-khoan/yeu-thich", icon: Heart },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Khách Hàng Thân Thiết";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StorefrontHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Account Sidebar */}
          <aside className="md:col-span-3 space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-12 h-12 rounded-full bg-brand-red text-cream flex items-center justify-center font-bold text-sm shadow-xs">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-ink truncate">{displayName}</h3>
                  <span className="text-[11px] text-turmeric font-semibold block">Hội viên Vị Việt</span>
                </div>
              </div>

              <nav className="mt-4 space-y-1">
                {accountNav.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-brand-red text-cream shadow-xs"
                          : "text-ink hover:bg-surface-hover hover:text-brand-red"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Account Main Content */}
          <div className="md:col-span-9 bg-surface border border-border rounded-2xl p-6 shadow-xs">
            {children}
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}

