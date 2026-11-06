"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatVND } from "@/lib/utils/currency";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { CatalogDish } from "@/features/catalog/types";

interface ContemporaryMenuProps {
  totalAmount: number;
  onOpenDrawer: () => void;
  onAddToCart: (name: string, price: number, dishId?: string) => void;
}

export const ContemporaryMenu: React.FC<ContemporaryMenuProps> = ({
  totalAmount,
  onOpenDrawer,
  onAddToCart,
}) => {
  const [dishes, setDishes] = useState<CatalogDish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDishes() {
      try {
        const list = await catalogApi.getDishes({ limit: 6 });
        setDishes(list);
      } catch (err) {
        console.error("Failed to load contemporary menu dishes:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDishes();
  }, []);

  return (
    <section id="menu" className="py-24 bg-[#fff1eb] border-t border-[#e2beba]/40">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e2beba]/50 mb-10">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-primary block mb-2">
              Bộ Sưu Tập Hương Vị Vị Việt
            </span>
            <h2 className="font-headline text-3xl sm:text-5xl font-bold text-[#1c1917]">
              Thực Đơn Đương Đại
            </h2>
          </div>

          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-[#e2beba] shadow-sm">
            <div>
              <span className="text-[11px] text-[#5a413d] uppercase font-semibold block">
                Tạm tính giỏ hàng
              </span>
              <span className="font-headline text-lg font-bold text-primary">
                {formatVND(totalAmount)}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenDrawer}
              className="cursor-pointer px-4 py-2 rounded-xl bg-[#fdeae3] hover:bg-primary hover:text-white text-primary text-xs font-bold transition-all"
            >
              Xem giỏ hàng
            </button>
          </div>
        </div>

        {/* Real Dishes Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            Đang nạp thực đơn đương đại từ Bếp Mẹ...
          </div>
        ) : dishes.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            Đang cập nhật thực đơn mới. Quý khách vui lòng quay lại sau!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-white rounded-3xl p-5 border border-[#e2beba]/60 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <Link href={`/mon/${dish.slug}`}>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-[#fff1eb] relative group">
                      <img
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={dish.image_url || "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80"}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80";
                        }}
                      />
                      {dish.category && (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-primary px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          {typeof dish.category === "object" ? dish.category.name : dish.category}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-baseline justify-between mb-2 gap-2">
                    <Link href={`/mon/${dish.slug}`}>
                      <h3 className="font-headline text-lg sm:text-xl font-bold text-[#1c1917] hover:text-primary transition-colors line-clamp-1">
                        {dish.name}
                      </h3>
                    </Link>
                    <span className="font-headline font-bold text-primary text-base sm:text-lg whitespace-nowrap">
                      {formatVND(dish.base_price)}
                    </span>
                  </div>
                  <p className="text-xs text-[#5a413d] leading-relaxed line-clamp-2">
                    {dish.description || "Hương vị ẩm thực truyền thống Việt Nam tươi mới mỗi ngày."}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-5">
                  <Link href={`/mon/${dish.slug}`} className="flex-1">
                    <button
                      type="button"
                      className="cursor-pointer w-full py-2.5 rounded-full border border-primary text-primary hover:bg-primary/5 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Chi tiết
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => onAddToCart(dish.name, dish.base_price, dish.id)}
                    className="cursor-pointer flex-1 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-xs"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
