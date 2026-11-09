"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { RequireLoginModal } from "@/components/auth/require-login-modal";
import { FloatingAiConcierge } from "@/features/ai/components/floating-ai-concierge";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f6]">
      {/* Thanh điều hướng dùng chung duy nhất cho toàn bộ hệ thống */}
      <StorefrontHeader />

      {/* Modal yêu cầu đăng nhập toàn cục khi khách bấm thêm vào giỏ */}
      <RequireLoginModal />

      {/* Trang chủ tự kiểm soát padding cho Hero Section tràn viền; các trang con có pt-20 tránh bị Header che */}
      <main className={`flex-1 ${isHomePage ? "" : "pt-20"}`}>
        {children}
      </main>

      {/* Chatbot AI Bếp Trưởng Vị Việt nổi góc dưới bên phải trên tất cả màn hình */}
      <FloatingAiConcierge />

      <StorefrontFooter />
    </div>
  );
}
