"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  Package,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/auth-context";

interface HomeHeaderProps {
  cartCount: number;
  onOpenDrawer: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  cartCount,
  onOpenDrawer,
}) => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/thuc-don?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#fff8f6]/95 backdrop-blur-md border-b border-[#e2beba]/40 transition-all duration-300 h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between gap-4">
        {/* 1. Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <img
            alt="Vị Việt - Contemporary Culinary"
            className="h-11 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            src="/logo.svg"
          />
        </Link>

        {/* 2. Desktop Navigation (Loại bỏ đặt bàn tiệc) */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            Trang Chủ
          </Link>
          <Link
            href="/thuc-don"
            className="text-sm font-medium text-[#5a413d] hover:text-primary transition-colors"
          >
            Thực Đơn Giao Nóng
          </Link>
          <a
            href="#story"
            className="text-sm font-medium text-[#5a413d] hover:text-primary transition-colors"
          >
            Hành Trình Di Sản
          </a>
          <Link
            href="/tu-van"
            className="text-sm font-medium text-[#5a413d] hover:text-primary transition-colors"
          >
            Tư Vấn Khẩu Vị AI
          </Link>
        </nav>

        {/* 3. Action Tools: Tìm kiếm, Tài khoản, Giỏ hàng */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ô Tìm Kiếm Kính Lúp */}
          <div className="relative">
            {searchOpen ? (
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-1 bg-white border border-[#e2beba] rounded-full px-3 py-1.5 shadow-xs animate-in fade-in duration-200"
              >
                <Search className="w-4 h-4 text-[#5a413d] shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm món ngon..."
                  className="w-32 sm:w-48 text-xs bg-transparent focus:outline-none text-[#1c1917]"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-[#8e706c] hover:text-[#1c1917] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="cursor-pointer p-2.5 rounded-full text-[#5a413d] hover:text-primary hover:bg-[#fff1eb] transition-colors"
                title="Tìm kiếm món ăn"
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Tài Khoản (Đã đăng nhập hoặc Nút Đăng nhập) */}
          <div className="relative">
            {isAuthenticated && user ? (
              <div>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="cursor-pointer flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-[#e2beba] hover:border-primary/50 bg-white/80 text-xs font-semibold text-[#1c1917] transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">
                    {user.full_name || user.email}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#e2beba]/60 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-[#e2beba]/40 mb-1">
                      <p className="text-[11px] text-[#5a413d] truncate">
                        Xin chào,
                      </p>
                      <p className="text-xs font-bold text-[#1c1917] truncate">
                        {user.full_name || user.email}
                      </p>
                    </div>
                    <Link
                      href="/tai-khoan"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1c1917] hover:bg-[#fff8f6] hover:text-primary rounded-xl transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Tài khoản của tôi</span>
                    </Link>
                    <Link
                      href="/tai-khoan/don-hang"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1c1917] hover:bg-[#fff8f6] hover:text-primary rounded-xl transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Đơn hàng đã đặt</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/dang-nhap"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#e2beba] hover:border-primary/50 hover:bg-[#fff1eb] text-xs font-semibold text-[#5a413d] hover:text-primary transition-all"
                title="Đăng nhập tài khoản"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Tài khoản</span>
              </Link>
            )}
          </div>

          {/* Giỏ Hàng Online */}
          <button
            type="button"
            onClick={onOpenDrawer}
            className="cursor-pointer inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider px-4 sm:px-5 py-2.5 rounded-full shadow-md active:scale-95 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            <span className="bg-secondary text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              {cartCount}
            </span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#5a413d] hover:bg-[#fdeae3] transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 right-0 bg-[#fff8f6] border-b border-[#e2beba] p-6 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-primary py-1"
          >
            Trang Chủ
          </Link>
          <Link
            href="/thuc-don"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#5a413d] hover:text-primary py-1"
          >
            Thực Đơn Giao Nóng
          </Link>
          <a
            href="#story"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#5a413d] hover:text-primary py-1"
          >
            Hành Trình Di Sản
          </a>
          <Link
            href="/tu-van"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#5a413d] hover:text-primary py-1"
          >
            Tư Vấn Khẩu Vị AI
          </Link>
        </div>
      )}
    </header>
  );
};
