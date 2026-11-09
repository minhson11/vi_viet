"use client";

import React from "react";
import { Bell, Store, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/context/auth-context";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, subtitle, action }) => {
  const { user } = useAuth();

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Quản trị viên";
  const userInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        {title && <h1 className="text-lg font-bold text-ink tracking-tight">{title}</h1>}
        {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {action}

        {/* Branch indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-xs text-ink-muted">
          <Store className="w-3.5 h-3.5 text-herb" />
          <span>Bếp Trung Tâm (HN)</span>
        </div>

        {/* Notification Bell */}
        <button
          title="Thông báo"
          className="relative p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full" />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-brand-red text-cream flex items-center justify-center font-bold text-xs shadow-xs">
            {userInitials}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-ink leading-tight flex items-center gap-1">
              {displayName}
              <ShieldCheck className="w-3 h-3 text-brand-red" />
            </span>
            <span className="text-[10px] text-ink-muted">{user?.role || "ADMIN"}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
