"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Utensils,
  Info,
  PhoneCall,
  User,
  Package,
} from "lucide-react";
import { HeaderSearchBar } from "./header-search-bar";
import { useAuth } from "@/features/auth/context/auth-context";

interface HeaderMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeaderMobileDrawer: React.FC<HeaderMobileDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="lg:hidden absolute top-20 left-0 right-0 bg-[#fff8f6] border-b border-[#e2beba]/80 p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-5rem)] overflow-y-auto">
      {/* 1. Thanh tìm kiếm trực tiếp trên Mobile */}
      <div className="w-full">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
          Tìm kiếm món ăn
        </p>
        <HeaderSearchBar variant="mobile" onNavigate={onClose} />
      </div>

      <div className="h-px bg-[#e2beba]/40 w-full my-1" />

      {/* 2. Danh sách Menu điều hướng chính: Trang Chủ, Thực Đơn, Giới Thiệu, Liên Hệ */}
      <nav className="flex flex-col gap-1">
        <Link
          href="/"
          onClick={onClose}
          className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            pathname === "/"
              ? "bg-brand-red/10 text-brand-red font-bold"
              : "text-ink hover:bg-white hover:text-brand-red"
          }`}
        >
          <span>Trang Chủ</span>
        </Link>

        <Link
          href="/thuc-don"
          onClick={onClose}
          className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            pathname.startsWith("/thuc-don") || pathname.startsWith("/mon")
              ? "bg-brand-red/10 text-brand-red font-bold"
              : "text-ink hover:bg-white hover:text-brand-red"
          }`}
        >
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-brand-red" />
            <span>Thực Đơn</span>
          </div>
          <span className="text-[10px] bg-brand-red text-cream font-bold px-2 py-0.5 rounded-full">
            Đặc sắc
          </span>
        </Link>

        <Link
          href="/gioi-thieu"
          onClick={onClose}
          className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            pathname === "/gioi-thieu"
              ? "bg-brand-red/10 text-brand-red font-bold"
              : "text-ink hover:bg-white hover:text-brand-red"
          }`}
        >
          <Info className="w-4 h-4 text-ink-muted" />
          <span>Giới Thiệu</span>
        </Link>

        <Link
          href="/lien-he"
          onClick={onClose}
          className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            pathname === "/lien-he"
              ? "bg-brand-red/10 text-brand-red font-bold"
              : "text-ink hover:bg-white hover:text-brand-red"
          }`}
        >
          <PhoneCall className="w-4 h-4 text-ink-muted" />
          <span>Liên Hệ</span>
        </Link>
      </nav>

      <div className="h-px bg-[#e2beba]/40 w-full my-1" />

      {/* 3. Tài khoản người dùng */}
      {isAuthenticated && user ? (
        <div className="bg-white/80 border border-[#e2beba]/60 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center font-bold text-xs ring-1 ring-gold/30">
              {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink truncate">
                {user.full_name || user.email}
              </p>
              <p className="text-[11px] text-ink-muted truncate">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/tai-khoan"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#fff8f6] hover:bg-[#fff1eb] text-xs font-semibold text-ink rounded-lg border border-[#e2beba]/40"
            >
              <User className="w-3.5 h-3.5 text-ink-muted" />
              <span>Hồ sơ</span>
            </Link>
            <Link
              href="/tai-khoan/don-hang"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#fff8f6] hover:bg-[#fff1eb] text-xs font-semibold text-ink rounded-lg border border-[#e2beba]/40"
            >
              <Package className="w-3.5 h-3.5 text-ink-muted" />
              <span>Đơn hàng</span>
            </Link>
          </div>
        </div>
      ) : (
        <Link
          href="/dang-nhap"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-brand-red hover:text-white border border-[#e2beba] text-ink text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <User className="w-4 h-4" />
          <span>Đăng nhập / Đăng ký tài khoản</span>
        </Link>
      )}

      {/* 4. Hotline hỗ trợ đặt món */}
      <div className="bg-[#fff1eb] border border-gold/30 rounded-xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-brand-red" />
          <span className="font-semibold text-ink">Tổng đài đặt bàn & giao nóng:</span>
        </div>
        <a
          href="tel:19008888"
          className="font-bold text-brand-red hover:underline"
        >
          1900 8888
        </a>
      </div>
    </div>
  );
};
