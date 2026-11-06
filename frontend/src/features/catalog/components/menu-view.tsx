"use client";

import React, { useState } from "react";
import { CatalogCategory, CatalogDish } from "../types";
import { useMenuFilters } from "../hooks/use-menu-filters";
import { DishFilters } from "./dish-filters";
import { DishCard } from "./dish-card";
import { DishOptionsDialog } from "./dish-options-dialog";
import { cartApi } from "@/features/cart/api/cart.api";
import { httpClient } from "@/lib/http/client";

interface MenuViewProps {
  categories: CatalogCategory[];
  dishes: CatalogDish[];
}

export const MenuView: React.FC<MenuViewProps> = ({ categories, dishes }) => {
  const {
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    filteredDishes,
  } = useMenuFilters(dishes);

  const [selectedDish, setSelectedDish] = useState<CatalogDish | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSelectDish = (dish: CatalogDish) => {
    setSelectedDish(dish);
    setIsDialogOpen(true);
  };

  const handleAddToCart = async (dish: CatalogDish, quantity: number) => {
    const token = httpClient.getToken();
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("viviet_auth_required", {
          detail: {
            redirectUrl: "/thuc-don",
            message: `Quý khách vui lòng đăng nhập tài khoản để thêm "${dish.name}" vào giỏ hàng.`,
          },
        })
      );
      return;
    }

    try {
      // Optimistic: Hiện thông báo ngay tức thì (0ms)
      setToastMessage(`Đã thêm ${quantity}x ${dish.name} vào giỏ hàng!`);
      setTimeout(() => setToastMessage(null), 3000);

      await cartApi.addToCart({
        dish_id: dish.id,
        dish_name: dish.name,
        dish_slug: dish.slug,
        dish_image: dish.image_url,
        unit_price: dish.base_price,
        quantity,
      });
    } catch (err) {
      console.error("Failed to add to cart from menu view:", err);
      setToastMessage(null);
    }
  };

  return (
    <div className="space-y-6">
      <DishFilters
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {filteredDishes.length === 0 ? (
        <div className="py-16 text-center text-xs text-ink-muted">
          Không tìm thấy món ăn phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} onSelect={handleSelectDish} />
          ))}
        </div>
      )}

      <DishOptionsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        dish={selectedDish}
        onAddToCart={handleAddToCart}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1917] text-white text-xs px-5 py-3 rounded-full shadow-2xl border border-gold/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
