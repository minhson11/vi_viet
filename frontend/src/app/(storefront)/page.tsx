"use client";

import React, { useEffect, useState } from "react";
import { CinematicHero } from "@/features/home/components/cinematic-hero";
import { HeritageStoryDishes } from "@/features/home/components/heritage-story-dishes";
import { ContemporaryMenu } from "@/features/home/components/contemporary-menu";
import { AiChefConcierge } from "@/features/home/components/ai-chef-concierge";
import { TableDrawer } from "@/features/home/components/table-drawer";
import { TableItem } from "@/features/home/types";
import { cartApi } from "@/features/cart/api/cart.api";
import { httpClient } from "@/lib/http/client";

export default function StorefrontHomePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tableItems, setTableItems] = useState<TableItem[]>([]);

  // Đồng bộ giỏ hàng thực tế từ backend
  useEffect(() => {
    async function loadBackendCart() {
      try {
        const cart = await cartApi.getCart();
        if (cart && Array.isArray(cart.items)) {
          setTableItems(
            cart.items.map((it) => ({
              id: it.id,
              dishId: it.dish_id,
              name: it.dish_name,
              price: it.unit_price,
              quantity: it.quantity,
              note: it.notes || "Giao nóng 30 phút",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load initial cart:", err);
      } finally {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("viviet_page_ready"));
        }
      }
    }
    loadBackendCart();
  }, []);

  const totalAmount = tableItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartCount = tableItems.reduce((sum, item) => sum + item.quantity, 0);

  // Mở giỏ hàng khi người dùng click icon giỏ hàng trên thanh điều hướng chung
  useEffect(() => {
    const handleOpenDrawerEvent = () => {
      setIsDrawerOpen(true);
    };
    window.addEventListener("viviet_open_cart_drawer", handleOpenDrawerEvent);
    return () => {
      window.removeEventListener("viviet_open_cart_drawer", handleOpenDrawerEvent);
    };
  }, []);

  // Đồng bộ số lượng badge cho thanh điều hướng chung toàn hệ thống
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("viviet_cart_updated", { detail: { count: cartCount } })
      );
    }
  }, [cartCount]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleAddToCart = async (name: string, price: number, dishId?: string) => {
    const token = httpClient.getToken();
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("viviet_auth_required", {
          detail: {
            redirectUrl: "/",
            message: `Quý khách vui lòng đăng nhập tài khoản để thêm "${name}" vào giỏ hàng.`,
          },
        })
      );
      return;
    }

    showToast(`Đã thêm "${name}" vào giỏ hàng!`);

    try {
      const updated = await cartApi.addToCart({
        dish_id: dishId || `custom-${Date.now()}`,
        dish_name: name,
        unit_price: price,
        quantity: 1,
      });
      if (updated && Array.isArray(updated.items)) {
        setTableItems(
          updated.items.map((it) => ({
            id: it.id,
            dishId: it.dish_id,
            name: it.dish_name,
            price: it.unit_price,
            quantity: it.quantity,
            note: it.notes || "Giao nóng 30 phút",
          }))
        );
      }
    } catch (err) {
      console.error("Could not sync item to cart:", err);
    }
  };

  const handleUpdateQuantity = async (id: string, delta: number) => {
    const item = tableItems.find((it) => it.id === id);
    const newQty = item ? item.quantity + delta : 0;

    try {
      let updated;
      if (newQty <= 0) {
        updated = await cartApi.removeCartItem(id);
      } else {
        updated = await cartApi.updateCartItem(id, { quantity: newQty });
      }
      if (updated && Array.isArray(updated.items)) {
        setTableItems(
          updated.items.map((it) => ({
            id: it.id,
            dishId: it.dish_id,
            name: it.dish_name,
            price: it.unit_price,
            quantity: it.quantity,
            note: it.notes || "Giao nóng 30 phút",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to sync quantity to cart:", err);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      const updated = await cartApi.removeCartItem(id);
      if (updated && Array.isArray(updated.items)) {
        setTableItems(
          updated.items.map((it) => ({
            id: it.id,
            dishId: it.dish_id,
            name: it.dish_name,
            price: it.unit_price,
            quantity: it.quantity,
            note: it.notes || "Giao nóng 30 phút",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to remove item from cart:", err);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fff8f6] text-[#1c1917] selection:bg-primary selection:text-white">
      {/* Main Content (Thanh điều hướng chung đã được bọc tại StorefrontLayout, Intro rèm được quản lý tại Providers) */}
      <main>
        {/* 2. Cinematic Hero Section Cao Cấp (Contemporary Vietnamese Culinary) */}
        <CinematicHero />

        {/* 3. Tam Đại Danh Vị - Scroll Physics Animations */}
        <HeritageStoryDishes onAddToCart={handleAddToCart} />

        {/* 5. Thực Đơn Đương Đại & Thanh Tạm Tính */}
        <ContemporaryMenu
          totalAmount={totalAmount}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onAddToCart={handleAddToCart}
        />

        {/* 6. Bếp Trưởng AI Concierge */}
        <AiChefConcierge />
      </main>

      {/* 7. Side Drawer Giỏ Hàng Online */}
      <TableDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={tableItems}
        totalAmount={totalAmount}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1917] text-white text-xs px-5 py-3 rounded-full shadow-2xl border border-gold/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
