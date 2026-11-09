"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  Heart,
  Sparkles,
  LogOut,
  ChevronDown,
  Shield,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/auth-context";

interface HeaderUserMenuProps {
  onNavigate?: () => void;
}

export const HeaderUserMenu: React.FC<HeaderUserMenuProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/dang-nhap"
        onClick={() => onNavigate?.()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-[#e2beba]/80 bg-white/80 hover:bg-white text-xs font-semibold text-[#5a413d] hover:text-brand-red hover:border-brand-red/50 hover:shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
        title="Đăng nhập tài khoản"
      >
        <User className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand-red shrink-0" />
        <span className="whitespace-nowrap">Đăng nhập</span>
      </Link>
    );
  }

  const displayName = user.full_name || user.email?.split("@")[0] || "Khách Hàng";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div ref={menuRef} className="relative shrink-0">
      {/* Nút Avatar tài khoản */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer flex items-center gap-1.5 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-full border border-[#e2beba]/80 hover:border-brand-red/40 bg-white/80 hover:bg-white text-xs font-semibold text-ink transition-all shadow-2xs group shrink-0 whitespace-nowrap"
        aria-expanded={isOpen}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-red/15 to-gold/20 text-brand-red flex items-center justify-center font-bold text-[11px] ring-1 ring-gold/30 shrink-0">
          {initials}
        </div>
        <span className="hidden md:inline max-w-[100px] truncate text-left text-xs font-semibold text-ink group-hover:text-brand-red whitespace-nowrap">
          {displayName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-200 hidden md:inline shrink-0 ${
            isOpen ? "rotate-180 text-brand-red" : ""
          }`}
        />
      </button>

      {/* Menu thả xuống */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-[#e2beba]/70 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-[#f5ebe6]">
          {/* Thông tin người dùng tóm tắt */}
          <div className="px-3 py-2.5">
            <p className="text-[11px] text-ink-muted">Xin chào,</p>
            <p className="text-xs font-bold text-ink truncate">{displayName}</p>
            <p className="text-[11px] text-ink-light truncate mt-0.5">{user.email}</p>
          </div>

          {/* Các liên kết điều hướng cá nhân */}
          <div className="py-1.5 space-y-0.5">
            <Link
              href="/tai-khoan"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink hover:bg-[#fff8f6] hover:text-brand-red rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <User className="w-4 h-4 text-ink-muted shrink-0" />
              <span>Hồ sơ cá nhân</span>
            </Link>

            <Link
              href="/tai-khoan/don-hang"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink hover:bg-[#fff8f6] hover:text-brand-red rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Package className="w-4 h-4 text-ink-muted shrink-0" />
              <span>Lịch sử đơn hàng</span>
            </Link>

            <Link
              href="/tai-khoan/dia-chi"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink hover:bg-[#fff8f6] hover:text-brand-red rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-4 h-4 text-ink-muted shrink-0" />
              <span>Sổ địa chỉ nhận hàng</span>
            </Link>

            <Link
              href="/tai-khoan/yeu-thich"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink hover:bg-[#fff8f6] hover:text-brand-red rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Heart className="w-4 h-4 text-ink-muted shrink-0" />
              <span>Món ăn yêu thích</span>
            </Link>

            <Link
              href="/tai-khoan/so-thich"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink hover:bg-[#fff8f6] hover:text-brand-red rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-ink-muted shrink-0" />
              <span>Khẩu vị & Dị ứng</span>
            </Link>
          </div>

          {/* Phím tắt nếu là Admin hoặc Staff */}
          {user.role && user.role !== "CUSTOMER" && (
            <div className="py-1.5">
              <Link
                href={user.role === "ADMIN" ? "/admin" : "/staff/orders"}
                onClick={() => {
                  setIsOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brand-red hover:bg-[#fdeae3] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Shield className="w-4 h-4 text-brand-red shrink-0" />
                <span>
                  {user.role === "ADMIN" ? "Trang Quản Trị Hệ Thống" : "Khu Vực Bếp & Vận Hành"}
                </span>
              </Link>
            </div>
          )}

          {/* Nút Đăng xuất */}
          <div className="pt-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 text-red-600 shrink-0" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
