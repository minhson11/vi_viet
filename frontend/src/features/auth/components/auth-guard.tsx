"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/auth-context";
import { Loader2 } from "lucide-react";

interface GuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<GuardProps> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/admin/dang-nhap?redirect=${encodeURIComponent(pathname)}`);
      } else if (user?.role !== "ADMIN") {
        router.push("/403?reason=admin_required");
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red mb-3" />
        <p className="text-xs font-semibold text-ink-muted">Đang xác thực quyền Quản trị viên...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  return <>{children}</>;
};

const ALLOWED_STAFF_ROLES = ["ADMIN", "OPERATOR", "KITCHEN"];

export const StaffGuard: React.FC<GuardProps> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/admin/dang-nhap?redirect=${encodeURIComponent(pathname)}`);
      } else if (!user?.role || !ALLOWED_STAFF_ROLES.includes(user.role)) {
        router.push("/403?reason=staff_required");
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-herb mb-3" />
        <p className="text-xs font-semibold text-ink-muted">Đang xác thực quyền Vận hành & Bếp...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user?.role || !ALLOWED_STAFF_ROLES.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

