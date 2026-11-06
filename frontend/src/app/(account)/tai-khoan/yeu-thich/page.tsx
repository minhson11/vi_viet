"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { formatVND } from "@/lib/utils/currency";
import { userProfileApi, UserFavoriteDish } from "@/features/auth/api/user-profile.api";

export default function AccountFavoritesPage() {
  const [favorites, setFavorites] = useState<UserFavoriteDish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const list = await userProfileApi.getFavorites();
      setFavorites(list);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (dishId: string) => {
    try {
      await userProfileApi.removeFavorite(dishId);
      setFavorites((prev) => prev.filter((f) => f.dish_id !== dishId && f.id !== dishId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold text-ink flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          <span>Món ăn yêu thích ({favorites.length})</span>
        </h1>
        <p className="text-xs text-ink-muted">Danh sách các món bạn đã thả tim để gọi lại nhanh chóng</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-ink-muted">
          Đang nạp danh sách món yêu thích của bạn...
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-ink">Chưa có món ăn nào trong danh sách yêu thích</p>
          <p className="text-xs text-ink-muted">Khám phá thực đơn và bấm vào icon trái tim để lưu lại nhé!</p>
          <Link href="/thuc-don" className="inline-block mt-2">
            <Button variant="primary" size="sm">
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              <span>Xem thực đơn ngay</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <div
              key={fav.id || fav.dish_id}
              className="bg-surface border border-border rounded-xl p-3 shadow-xs hover:border-brand-red/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-hover mb-2.5">
                  {fav.image_url ? (
                    <img
                      src={fav.image_url}
                      alt={fav.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
                {fav.category_name && (
                  <span className="text-[10px] font-semibold text-brand-red uppercase tracking-wider block">
                    {fav.category_name}
                  </span>
                )}
                <h3 className="font-bold text-sm text-ink line-clamp-1 mt-0.5">
                  {fav.name}
                </h3>
                <p className="font-bold text-brand-red text-xs mt-1 font-mono">
                  {formatVND(fav.base_price)}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border mt-3">
                <Link href={`/mon/${fav.slug}`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full text-xs">
                    Xem món
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveFavorite(fav.dish_id || fav.id)}
                  className="text-red-500 hover:bg-red-50"
                  title="Bỏ thích"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
