"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  Package,
  Menu as MenuIcon,
  X,
  Utensils,
  Bot,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/auth-context";
import { cartApi } from "@/features/cart/api/cart.api";

interface StorefrontHeaderProps {
  onOpenCart?: () => void;
  cartCountOverride?: number;
}

export const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  onOpenCart,
  cartCountOverride,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(cartCountOverride ?? 0);

  // Đồng bộ số lượng giỏ hàng thực tế từ backend
  const loadCartBadge = async () => {
    try {
      const cart = await cartApi.getCart();
      if (cart && Array.isArray(cart.items)) {
        const count = cart.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
        setCartCount(count);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (cartCountOverride !== undefined) {
      setCartCount(cartCountOverride);
    } else {
      loadCartBadge();
    }

    // Lắng nghe sự kiện cập nhật giỏ hàng từ bất kỳ đâu trong app
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (typeof customEvent?.detail?.count === "number") {
        setCartCount(customEvent.detail.count);
      } else {
        loadCartBadge();
      }
    };

    // Optimistic UI: Nhảy số giỏ hàng ngay lập tức khi khách bấm nút (0ms)
    const handleCartOptimistic = (e: Event) => {
      const customEvent = e as CustomEvent;
      const addQty = Number(customEvent?.detail?.count || 1);
      setCartCount((prev) => prev + addQty);
    };

    window.addEventListener("viviet_cart_updated", handleCartUpdate);
    window.addEventListener("viviet_cart_optimistic_add", handleCartOptimistic);
    return () => {
      window.removeEventListener("viviet_cart_updated", handleCartUpdate);
      window.removeEventListener("viviet_cart_optimistic_add", handleCartOptimistic);
    };
  }, [cartCountOverride]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/thuc-don?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
      return;
    }
    // Nếu đang ở trang chủ, phát sự kiện mở drawer nếu có
    if (pathname === "/") {
      window.dispatchEvent(new CustomEvent("viviet_open_cart_drawer"));
    } else {
      router.push("/gio-hang");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#fff8f6]/95 backdrop-blur-md border-b border-[#e2beba]/40 transition-all duration-300 h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
        {/* 1. Brand Logo Vị Việt */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <img
            alt="Vị Việt - Contemporary Culinary"
            className="h-11 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            src="/logo.svg"
          />
        </Link>

        {/* 2. Desktop Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-7 xl:gap-8">
          <Link
            href="/"
            className={`text-sm font-semibold transition-colors ${
              pathname === "/"
                ? "text-primary font-bold"
                : "text-[#5a413d] hover:text-primary"
            }`}
          >
            Trang Chủ
          </Link>

          <Link
            href="/thuc-don"
            className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname.startsWith("/thuc-don") || pathname.startsWith("/mon")
                ? "text-primary font-bold"
                : "text-[#5a413d] hover:text-primary"
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-primary" />
            Thực Đơn Giao Nóng
          </Link>

          <Link
            href="/#story"
            className="text-sm font-medium text-[#5a413d] hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Hành Trình Di Sản
          </Link>

          <Link
            href="/tu-van"
            className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname === "/tu-van"
                ? "text-primary font-bold"
                : "text-[#5a413d] hover:text-primary"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-primary" />
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
                className="flex items-center gap-1.5 bg-white border border-[#e2beba] rounded-full px-3.5 py-1.5 shadow-sm animate-in fade-in duration-200"
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
                  className="text-[#8e706c] hover:text-[#1c1917] p-0.5 cursor-pointer"
                  aria-label="Đóng tìm kiếm"
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
                    className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#e2beba]/60 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
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
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                    <Link
                      href="/tai-khoan/don-hang"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1c1917] hover:bg-[#fff8f6] hover:text-primary rounded-xl transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Đơn hàng đã đặt</span>
                    </Link>
                    {user.role && user.role !== "CUSTOMER" && (
                      <Link
                        href={user.role === "ADMIN" ? "/admin" : "/staff/orders"}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary hover:bg-[#fff1eb] rounded-xl transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Trang Quản Trị</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#e2beba] hover:border-primary/50 hover:bg-[#fff1eb] text-xs font-semibold text-[#5a413d] hover:text-primary transition-all"
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
            onClick={handleCartClick}
            className="cursor-pointer inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider px-4 sm:px-5 py-2.5 rounded-full shadow-md active:scale-95 transition-all"
            title="Xem giỏ hàng"
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
            className="lg:hidden p-2 rounded-xl text-[#5a413d] hover:bg-[#fdeae3] transition-colors cursor-pointer"
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
            className={`text-sm font-semibold py-1 ${
              pathname === "/" ? "text-primary font-bold" : "text-[#5a413d]"
            }`}
          >
            Trang Chủ
          </Link>
          <Link
            href="/thuc-don"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium py-1 flex items-center gap-2 ${
              pathname.startsWith("/thuc-don") ? "text-primary font-bold" : "text-[#5a413d]"
            }`}
          >
            <Utensils className="w-4 h-4 text-primary" />
            Thực Đơn Giao Nóng
          </Link>
          <Link
            href="/#story"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#5a413d] hover:text-primary py-1 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            Hành Trình Di Sản
          </Link>
          <Link
            href="/tu-van"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium py-1 flex items-center gap-2 ${
              pathname === "/tu-van" ? "text-primary font-bold" : "text-[#5a413d]"
            }`}
          >
            <Bot className="w-4 h-4 text-primary" />
            Tư Vấn Khẩu Vị AI
          </Link>
        </div>
      )}
    </header>
  );
};
