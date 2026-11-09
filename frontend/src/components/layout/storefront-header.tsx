"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingBag,
  Menu as MenuIcon,
  X,
  Utensils,
  Search,
  Info,
  PhoneCall,
} from "lucide-react";
import { cartApi } from "@/features/cart/api/cart.api";
import { HeaderSearchBar } from "./header/header-search-bar";
import { HeaderUserMenu } from "./header/header-user-menu";
import { HeaderMobileDrawer } from "./header/header-mobile-drawer";

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

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
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#fff8f6]/95 backdrop-blur-md border-b border-[#e2beba]/50 transition-all duration-300 h-20 flex items-center shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
        {/* 1. KHU VỰC THƯƠNG HIỆU (BRAND ZONE): Logo Vị Việt */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 cursor-pointer group"
          title="Trang chủ Ẩm thực Vị Việt"
        >
          <img
            alt="Vị Việt - Contemporary Culinary"
            className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
            src="/logo.svg"
          />
        </Link>

        {/* 2. KHU VỰC ĐIỀU HƯỚNG CHÍNH (NAVIGATION MENU): Trang Chủ, Thực Đơn, Giới Thiệu, Liên Hệ */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 shrink-0">
          <Link
            href="/"
            className={`text-sm font-semibold transition-all relative py-1 cursor-pointer whitespace-nowrap shrink-0 ${
              pathname === "/"
                ? "text-brand-red font-bold"
                : "text-ink-muted hover:text-brand-red"
            }`}
          >
            <span>Trang Chủ</span>
            {pathname === "/" && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-red rounded-full" />
            )}
          </Link>

          <Link
            href="/thuc-don"
            className={`text-sm font-semibold transition-all relative py-1 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              pathname.startsWith("/thuc-don") || pathname.startsWith("/mon")
                ? "text-brand-red font-bold"
                : "text-ink-muted hover:text-brand-red"
            }`}
          >
            <Utensils className="w-4 h-4 text-brand-red shrink-0" />
            <span>Thực Đơn</span>
            {(pathname.startsWith("/thuc-don") || pathname.startsWith("/mon")) && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-red rounded-full" />
            )}
          </Link>

          <Link
            href="/gioi-thieu"
            className={`text-sm font-semibold transition-all relative py-1 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              pathname === "/gioi-thieu"
                ? "text-brand-red font-bold"
                : "text-ink-muted hover:text-brand-red"
            }`}
          >
            <Info className="w-4 h-4 text-ink-muted group-hover:text-brand-red shrink-0" />
            <span>Giới Thiệu</span>
            {pathname === "/gioi-thieu" && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-red rounded-full" />
            )}
          </Link>

          <Link
            href="/lien-he"
            className={`text-sm font-semibold transition-all relative py-1 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              pathname === "/lien-he"
                ? "text-brand-red font-bold"
                : "text-ink-muted hover:text-brand-red"
            }`}
          >
            <PhoneCall className="w-4 h-4 text-ink-muted group-hover:text-brand-red shrink-0" />
            <span>Liên Hệ</span>
            {pathname === "/lien-he" && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-red rounded-full" />
            )}
          </Link>
        </nav>

        {/* 3. KHU VỰC TÁC VỤ (ACTION TOOLS): Nút Tìm kiếm thu nhỏ/mở rộng, Tài khoản, Giỏ hàng */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* A. Nút tìm kiếm thu nhỏ (Desktop) - khi không nhấn thì thu nhỏ, nhấn vào thì mở rộng có live search */}
          <div className="hidden lg:block shrink-0">
            <HeaderSearchBar variant="desktop" />
          </div>

          {/* Nút kính lúp mở nhanh tìm kiếm trên thiết bị di động */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setMobileSearchOpen(!mobileSearchOpen);
            }}
            className="lg:hidden p-2 rounded-full text-ink-muted hover:text-brand-red hover:bg-[#fff1eb] transition-colors cursor-pointer shrink-0"
            title="Tìm kiếm món ăn"
            aria-label="Tìm kiếm"
          >
            <Search className="w-5 h-5 shrink-0" />
          </button>

          {/* B. Vạch ngăn phân cách tinh tế */}
          <div className="hidden sm:block h-5 w-px bg-[#e2beba]/60 mx-0.5 shrink-0" />

          {/* C. Trạng thái tài khoản người dùng (Đăng nhập / Hồ sơ cá nhân) */}
          <HeaderUserMenu />

          {/* D. Nút Giỏ Hàng nổi bật */}
          <button
            type="button"
            onClick={handleCartClick}
            className="cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-brand-red to-brand-red-hover hover:from-brand-red-hover hover:to-brand-red text-cream text-xs font-bold uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded-full shadow-md shadow-brand-red/20 active:scale-95 transition-all shrink-0 whitespace-nowrap"
            title="Xem giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap font-bold">Giỏ hàng</span>
            <span className="bg-gold text-white font-extrabold px-1.5 py-0.5 rounded-full text-[10px] shadow-xs min-w-[18px] text-center shrink-0">
              {cartCount}
            </span>
          </button>

          {/* E. Nút Toggle Menu Di Động */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(false);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-[#fdeae3] transition-colors cursor-pointer shrink-0"
            aria-label="Menu di động"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-brand-red shrink-0" />
            ) : (
              <MenuIcon className="w-6 h-6 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Thanh tìm kiếm nhanh dạng thanh trải rộng trên Mobile (khi bấm icon kính lúp) */}
      {mobileSearchOpen && (
        <div className="lg:hidden absolute top-20 left-0 right-0 bg-[#fff8f6] border-b border-[#e2beba] p-4 shadow-xl z-50 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <HeaderSearchBar
                variant="mobile"
                autoFocus
                onNavigate={() => setMobileSearchOpen(false)}
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 text-ink-muted hover:text-ink cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Menu di động dạng ngăn kéo (Drawer) */}
      <HeaderMobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </header>
  );
};
