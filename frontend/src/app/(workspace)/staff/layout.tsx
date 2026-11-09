"use client";

import React from "react";
import { StaffGuard } from "@/features/auth/components/auth-guard";
import { StaffSidebar } from "@/components/layout/staff-sidebar";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffGuard>
      <div className="min-h-screen flex bg-background">
        {/* Sidebar cố định bên trái cho các trang điều phối & bếp */}
        <StaffSidebar />

        {/* Vùng nội dung chính của nhân viên & bếp */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </StaffGuard>
  );
}
