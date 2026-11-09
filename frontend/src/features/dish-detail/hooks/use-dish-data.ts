"use client";

import { useState, useEffect, useCallback } from "react";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { Dish } from "@/features/admin-catalog/types";
import { userProfileApi } from "@/features/auth/api/user-profile.api";
import { reviewsApi, ReviewItem } from "@/features/reviews/api/reviews.api";

export function useDishData(slug: string) {
  const [dish, setDish] = useState<Dish | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [relatedDishes, setRelatedDishes] = useState<Dish[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDishData() {
      setIsLoading(true);
      try {
        const full = await catalogApi.getDishDetail(slug);

        if (!isMounted) return;

        if (full) {
          setDish(full);
          setSelectedImageIndex(0);

          // 1. Kiểm tra trạng thái yêu thích
          userProfileApi
            .getFavorites()
            .then((favs) => {
              if (isMounted) {
                const has = favs.some((f) => f.dish_id === full.id || f.id === full.id);
                setIsFavorite(has);
              }
            })
            .catch(() => {});

          // 2. Nạp đánh giá thực khách (hỗ trợ cả ID lẫn Slug)
          const dishIdentifier = full.id || full.slug || slug;
          reviewsApi
            .getDishReviews(dishIdentifier)
            .then((r) => {
              if (isMounted) setReviews(r.items || []);
            })
            .catch(() => {});

          // 3. Nạp các món ăn gợi ý cùng danh mục từ catalog công khai
          try {
            const catList = await catalogApi.getDishes({ limit: 12 });
            if (isMounted) {
              const relatedMapped: Dish[] = catList
                .filter((d) => d.id !== full.id && (d.category_id === full.category_id || !full.category_id))
                .slice(0, 4)
                .map((cd) => ({
                  id: cd.id,
                  category_id: cd.category_id,
                  category: cd.category
                    ? {
                        id: cd.category.id,
                        name: cd.category.name,
                        slug: cd.category.slug,
                        sort_order: cd.category.sort_order || 0,
                        is_active: true,
                      }
                    : undefined,
                  name: cd.name,
                  slug: cd.slug,
                  description: cd.description,
                  base_price: cd.base_price,
                  is_active: cd.is_active,
                  is_featured: cd.is_featured,
                  spicy_level: cd.spicy_level,
                  prep_time_minutes: cd.prep_time_minutes,
                  image_url: cd.image_url,
                  sort_order: 0,
                }));
              setRelatedDishes(relatedMapped);
            }
          } catch {}
        } else {
          setDish(null);
        }
      } catch (err) {
        console.error("Failed to load dish detail:", err);
        if (isMounted) setDish(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("viviet_page_ready"));
          }
        }
      }
    }

    loadDishData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Danh sách toàn bộ hình ảnh
  const galleryImages: string[] = [];
  if (dish?.images && dish.images.length > 0) {
    dish.images.forEach((img) => {
      const u = typeof img === "string" ? img : img.image_url;
      if (u && !galleryImages.includes(u)) galleryImages.push(u);
    });
  }
  if (galleryImages.length === 0 && dish?.image_url) {
    galleryImages.push(dish.image_url);
  }
  const currentImageUrl =
    galleryImages[selectedImageIndex] || galleryImages[0] || "/placeholder-dish.jpg";

  const handleToggleFavorite = useCallback(async () => {
    if (!dish) return;
    try {
      if (isFavorite) {
        await userProfileApi.removeFavorite(dish.id);
        setIsFavorite(false);
      } else {
        await userProfileApi.addFavorite(dish.id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  }, [dish, isFavorite]);

  const handleShare = useCallback(() => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }, []);

  return {
    dish,
    isLoading,
    galleryImages,
    selectedImageIndex,
    setSelectedImageIndex,
    currentImageUrl,
    isFavorite,
    handleToggleFavorite,
    copiedLink,
    handleShare,
    reviews,
    relatedDishes,
  };
}
