"use client";

import React from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminGuard } from "@/features/auth/components/auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-background">
        {/* Fixed Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
