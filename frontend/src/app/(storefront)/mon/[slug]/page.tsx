"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { Dish, DishVariant, OptionGroup } from "@/features/admin-catalog/types";
import { formatVND } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { cartApi } from "@/features/cart/api/cart.api";
import { CartItemOption } from "@/features/cart/types";
import { httpClient } from "@/lib/http/client";
import { userProfileApi } from "@/features/auth/api/user-profile.api";
import { reviewsApi, ReviewItem } from "@/features/reviews/api/reviews.api";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Flame,
  Clock,
  Heart,
  CheckCircle2,
  Sparkles,
  Star,
  Utensils,
  Share2,
  Check,
  ChevronRight,
  MessageSquare,
  Compass,
  AlertTriangle,
  Zap,
  Leaf,
} from "lucide-react";

const GENERAL_TASTING_NOTES = [
  "Thưởng thức ngay sau khi nhận món để cảm nhận trọn vẹn hương vị và độ tươi ngon nhất.",
  "Dùng kèm các phần nước chấm, đồ chua và rau thơm được Bếp Mẹ chuẩn bị đồng bộ theo từng món.",
  "Bạn có thể ghi chú khẩu vị riêng (độ cay, gia vị, dị ứng) cho đầu bếp ngay tại phần dặn dò trước khi đặt món.",
];

export default function StorefrontDishDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = use(params);
  const slug = resolved.slug;

  const [dish, setDish] = useState<Dish | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<DishVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reviews & Món gợi ý
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [relatedDishes, setRelatedDishes] = useState<Dish[]>([]);
  const [activeTab, setActiveTab] = useState<"story" | "ingredients" | "reviews">("story");

  useEffect(() => {
    async function loadDishData() {
      setIsLoading(true);
      try {
        // 1. Gọi trực tiếp endpoint public chi tiết món ăn (không cần quyền Admin)
        const full = await catalogApi.getDishDetail(slug);

        if (full) {
          setDish(full);

          const defaultVar = full.variants?.find((v) => v.is_default) || full.variants?.[0] || null;
          setSelectedVariant(defaultVar);

          // Khởi tạo options mặc định nếu có
          if (full.option_groups) {
            const initialOptions: Record<string, string[]> = {};
            full.option_groups.forEach((g) => {
              if (g.id) {
                const def =
                  g.items
                    ?.filter((it) => it.is_default && Boolean(it.id))
                    .map((it) => it.id as string) || [];
                if (def.length > 0) initialOptions[g.id] = def;
              }
            });
            setSelectedOptions(initialOptions);
          }

          // Kiểm tra yêu thích
          userProfileApi
            .getFavorites()
            .then((favs) => {
              const has = favs.some((f) => f.dish_id === full.id || f.id === full.id);
              setIsFavorite(has);
            })
            .catch(() => {});

          // Nạp đánh giá thực khách
          reviewsApi
            .getDishReviews(full.id)
            .then((r) => setReviews(r.items || []))
            .catch(() => {});

          // Nạp các món ăn gợi ý cùng danh mục từ catalog công khai
          try {
            const catList = await catalogApi.getDishes({ limit: 12 });
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
          } catch {}
        } else {
          setDish(null);
        }
      } catch (err) {
        console.error("Failed to load dish detail:", err);
        setDish(null);
      } finally {
        setIsLoading(false);
        // Báo cho cánh rèm Cinematic Intro biết dữ liệu đã sẵn sàng, hãy mở rèm ra!
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("viviet_page_ready"));
        }
      }
    }
    loadDishData();
  }, [slug]);

  // Khi đang nạp dữ liệu, rèm đang che kín phía trên.
  // Tuyệt đối không hiển thị spinner cũ, để khi rèm mở ra là dữ liệu đã hiển thị đầy đủ 100%!
  if (isLoading) {
    return <div className="min-h-screen bg-[#fff8f6]" />;
  }

  if (!dish) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-28 text-center space-y-6">
        <span className="font-headline text-5xl text-primary font-black block">404</span>
        <h2 className="text-2xl font-bold font-headline text-ink">
          Mỹ Vị Này Tạm Thời Chưa Mở Bếp
        </h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          Món ăn bạn đang tìm kiếm có thể đã đổi tên hoặc đang trong giai đoạn ủ hương điều chỉnh nguyên liệu.
        </p>
        <Link href="/thuc-don">
          <Button variant="primary" size="lg" className="rounded-full px-8">
            Khám phá thực đơn Vị Việt
          </Button>
        </Link>
      </div>
    );
  }

  // Danh sách hình ảnh
  const galleryImages: string[] = [];
  if (dish.images && dish.images.length > 0) {
    dish.images.forEach((img) => {
      const u = typeof img === "string" ? img : img.image_url;
      if (u && !galleryImages.includes(u)) galleryImages.push(u);
    });
  }
  if (galleryImages.length === 0 && dish.image_url) {
    galleryImages.push(dish.image_url);
  }
  const currentImageUrl = galleryImages[selectedImageIndex] || galleryImages[0] || "/placeholder-dish.jpg";

  // Tính toán giá tiền: Base + Variant + Toppings đã chọn
  const basePrice = Number(dish.base_price || 0);
  const variantAdj = Number(selectedVariant?.price_adjustment || 0);

  let optionsAdj = 0;
  const selectedOptionIdsList: string[] = [];
  if (dish.option_groups) {
    dish.option_groups.forEach((group) => {
      const gId = group.id;
      if (!gId) return;
      const selectedForGroup = selectedOptions[gId] || [];
      group.items?.forEach((item) => {
        if (item.id && selectedForGroup.includes(item.id)) {
          optionsAdj += Number(item.price_adjustment || 0);
          selectedOptionIdsList.push(item.id);
        }
      });
    });
  }

  const unitPrice = basePrice + variantAdj + optionsAdj;
  const totalPrice = unitPrice * quantity;

  // Toggle Topping item
  const handleToggleOption = (group: OptionGroup, itemId: string) => {
    const gId = group.id;
    if (!gId) return;

    setSelectedOptions((prev) => {
      const current = prev[gId] || [];
      const isAlreadySelected = current.includes(itemId);

      if (group.max_choices === 1) {
        // Radio: Chỉ chọn 1
        return {
          ...prev,
          [gId]: isAlreadySelected && !group.is_required ? [] : [itemId],
        };
      }

      // Checkbox: Chọn nhiều
      if (isAlreadySelected) {
        return {
          ...prev,
          [gId]: current.filter((id) => id !== itemId),
        };
      }

      if (group.max_choices && current.length >= group.max_choices) {
        return prev; // Đã đạt giới hạn tối đa
      }

      return {
        ...prev,
        [gId]: [...current, itemId],
      };
    });
  };

  const handleAddToCart = async () => {
    const token = httpClient.getToken();
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("viviet_auth_required", {
          detail: {
            redirectUrl: `/mon/${dish.slug}`,
            message: `Quý khách vui lòng đăng nhập tài khoản để thêm "${dish.name}" vào giỏ hàng và đặt món.`,
          },
        })
      );
      return;
    }

    setIsAdding(true);
    try {
      const selectedOptionsDetail: CartItemOption[] = [];
      if (dish.option_groups) {
        dish.option_groups.forEach((group) => {
          const gId = group.id;
          if (!gId) return;
          const selectedForGroup = selectedOptions[gId] || [];
          group.items?.forEach((item) => {
            if (item.id && selectedForGroup.includes(item.id)) {
              selectedOptionsDetail.push({
                option_id: item.id,
                name: item.name,
                price_adjustment: Number(item.price_adjustment || 0),
              });
            }
          });
        });
      }

      // Optimistic UI: Phản hồi thành công ngay lập tức trong 0ms
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 4000);

      await cartApi.addToCart({
        dish_id: dish.id,
        dish_name: dish.name,
        dish_slug: dish.slug,
        dish_image: currentImageUrl,
        variant_id: selectedVariant?.id,
        variant_name: selectedVariant?.name,
        unit_price: unitPrice,
        quantity,
        note: specialNotes || undefined,
        option_ids: selectedOptionIdsList.length > 0 ? selectedOptionIdsList : undefined,
        options: selectedOptionsDetail,
      });
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setAddedSuccess(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleFavorite = async () => {
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
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-low via-surface to-surface pb-20">
      {/* ================= 1. BREADCRUMB & TOP ACTIONS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          {/* Breadcrumb Links */}
          <nav className="flex items-center gap-2 text-xs font-medium text-ink-muted flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">
              Trang Chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-border" />
            <Link href="/thuc-don" className="hover:text-primary transition-colors">
              Thực Đơn Vị Việt
            </Link>
            {dish.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-border" />
                <Link
                  href={`/thuc-don?category=${dish.category.slug || dish.category.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {dish.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-border" />
            <span className="text-primary font-bold truncate max-w-[200px] sm:max-w-xs">
              {dish.name}
            </span>
          </nav>

          {/* Social / Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-white text-xs font-semibold text-ink-muted hover:text-primary hover:border-primary/40 transition-all shadow-2xs cursor-pointer"
              title="Sao chép liên kết món ăn"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép link</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Chia sẻ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                isFavorite
                  ? "border-red-300 bg-red-50 text-red-600"
                  : "border-border bg-white text-ink-muted hover:text-red-500 hover:border-red-200"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-red-600 text-red-600" : ""}`} />
              <span>{isFavorite ? "Đã lưu yêu thích" : "Lưu món"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. MAIN SHOWCASE: 2 CỘT CONTEMPORARY EDITORIAL ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
          {/* CỘT TRÁI: GALLERY ẢNH NHIỀU GÓC CHỤP & CAM KẾT DI SẢN (7 CỘT TRÊN DESKTOP) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Ảnh Lớn Trọng Tâm với Hiệu Ứng Sứ Men Mộc */}
            <div className="relative aspect-4/3 sm:aspect-16/11 w-full rounded-3xl overflow-hidden bg-surface-warm/40 border border-border p-3 sm:p-4 shadow-[0_20px_45px_-12px_rgba(32,23,19,0.12)]">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-surface">
                <Image
                  src={currentImageUrl}
                  alt={dish.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover object-center transform transition-transform duration-700 hover:scale-105"
                />

                {/* Gradient che nhẹ đáy */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent pointer-events-none" />

                {/* Con Triện Bếp Mẹ Góc Trái */}
                <div className="absolute top-4 left-4 z-10 bg-primary/95 text-cream rounded-2xl px-3.5 py-2 shadow-xl border border-gold/40 flex items-center gap-2 backdrop-blur-xs">
                  <Sparkles className="w-4 h-4 text-turmeric shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cream">
                    Bếp Mẹ Di Sản · Vị Việt
                  </span>
                </div>
              </div>
            </div>

            {/* Danh Sách Thumbnail Các Góc Chụp (Nếu có từ 2 ảnh trở lên) */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                {galleryImages.map((imgUrl, idx) => {
                  const isSelected = idx === selectedImageIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 sm:w-24 aspect-square rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer p-1 bg-surface ${
                        isSelected
                          ? "border-primary ring-3 ring-primary/20 scale-102 shadow-md"
                          : "border-border hover:border-primary/40 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="relative w-full h-full rounded-xl overflow-hidden">
                        <Image
                          src={imgUrl}
                          alt={`${dish.name} - góc chụp ${idx + 1}`}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3 Thẻ Đặc Tính Ẩm Thực Động: Thời gian chế biến, Năng lượng (Kcal) & Mức độ cay */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              {/* Thẻ 1: Thời gian chế biến */}
              <div className="p-3.5 rounded-2xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
                    Thời gian chế biến
                  </span>
                  <h4 className="text-sm font-bold text-ink font-mono mt-0.5">
                    {dish.prep_time_minutes ? `${dish.prep_time_minutes} phút` : "15 phút"}
                  </h4>
                  <p className="text-[10px] text-ink-muted truncate mt-0.5" title="Dự kiến hiển thị tại màn hình KDS nhà bếp">
                    Dự kiến hiển thị tại KDS bếp
                  </p>
                </div>
              </div>

              {/* Thẻ 2: Năng lượng (Kcal) */}
              <div className="p-3.5 rounded-2xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
                    Năng lượng (Kcal)
                  </span>
                  <h4 className="text-sm font-bold text-ink font-mono mt-0.5">
                    {dish.calories ? `${dish.calories} Kcal` : "450 Kcal"}
                  </h4>
                  <p className="text-[10px] text-ink-muted truncate mt-0.5" title="Tùy chọn hiển thị cho khách theo dõi dinh dưỡng">
                    Theo dõi dinh dưỡng
                  </p>
                </div>
              </div>

              {/* Thẻ 3: Mức độ cay */}
              <div className="p-3.5 rounded-2xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    (dish.spicy_level || 0) > 0
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-border bg-surface-hover text-ink-muted"
                  }`}
                >
                  <Flame className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
                    Mức độ cay
                  </span>
                  <h4 className="text-sm font-bold text-ink mt-0.5 flex items-center gap-1.5">
                    <span>
                      {(() => {
                        const lvl = dish.spicy_level || 0;
                        if (lvl === 0) return "Không cay (0/3)";
                        if (lvl === 1) return "Cay nhẹ (1/3)";
                        if (lvl === 2) return "Cay vừa (2/3)";
                        return "Cay nồng (3/3)";
                      })()}
                    </span>
                  </h4>
                  <p className="text-[10px] text-ink-muted truncate mt-0.5">
                    {(dish.spicy_level || 0) > 0
                      ? "Gia vị ớt tiêu tươi bản địa"
                      : "Vị thanh dịu, dễ thưởng thức"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: BẢNG THÔNG TIN MÓN, BIẾN THỂ, TOPPING & NÚT ĐẶT MÓN (5 CỘT TRÊN DESKTOP) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header Món Ăn */}
            <div className="border-b border-border/70 pb-5 space-y-2.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-warm text-primary border border-primary/25 text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-gold" />
                  {dish.category?.name || "Mỹ Vị Di Sản"}
                </span>

                {reviews.length > 0 && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>5.0</span>
                    <span className="text-amber-700 font-normal">({reviews.length} đánh giá)</span>
                  </div>
                )}
              </div>

              {/* Tên Món Typography Playfair Uy Nghi */}
              <h1 className="font-headline text-3xl sm:text-4xl lg:text-[40px] font-black text-primary leading-[1.15] tracking-tight">
                {dish.name}
              </h1>

              {/* Giá Bán Lớn Nổi Bật */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="font-headline text-3xl sm:text-4xl font-black text-primary font-mono tracking-tight">
                  {formatVND(unitPrice)}
                </span>
                <span className="text-xs text-ink-muted">/ phần thưởng thức</span>
              </div>

              {/* Huy hiệu đặc trưng mỹ vị */}
              {dish.tags && dish.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1.5">
                  {dish.tags.map((tItem, tIdx) => {
                    const tag = tItem.tag;
                    const code = (tag.slug || tag.name || "").toLowerCase();

                    // 1. Tag Bán chạy / Nổi bật
                    if (code.includes("ban-chay") || code.includes("bán chạy") || code.includes("hot")) {
                      return (
                        <span
                          key={tag.id || tIdx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-900 border border-amber-300/70 shadow-2xs tracking-wide"
                        >
                          <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500/30" />
                          <span>{tag.name}</span>
                        </span>
                      );
                    }

                    // 2. Tag Đặc sản / Di sản Vị Việt
                    if (code.includes("dac-san") || code.includes("đặc sản") || code.includes("vi-viet")) {
                      return (
                        <span
                          key={tag.id || tIdx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/25 shadow-2xs tracking-wide"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-gold" />
                          <span>{tag.name}</span>
                        </span>
                      );
                    }

                    // 3. Tag Thanh đạm / Ít cay / Món chay
                    if (
                      code.includes("chay") ||
                      code.includes("it-cay") ||
                      code.includes("thanh-dam") ||
                      code.includes("thanh đạm")
                    ) {
                      return (
                        <span
                          key={tag.id || tIdx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300/70 shadow-2xs tracking-wide"
                        >
                          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{tag.name}</span>
                        </span>
                      );
                    }

                    // 4. Các tag đặc trưng khác
                    return (
                      <span
                        key={tag.id || tIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-warm text-ink border border-border shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                        <span>{tag.name}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Mô tả ngắn */}
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed pt-1">
                {dish.description ||
                  "Món ăn di sản truyền thống chuẩn vị được chế biến từ những nguyên liệu tươi ngon tuyển chọn, hòa quyện gia vị bí truyền mang trọn phong vị quê nhà."}
              </p>
            </div>

            {/* BỘ CHỌN BIẾN THỂ / KHẨU PHẦN (VARIANTS) */}
            {dish.variants && dish.variants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-primary" />
                    <span>Chọn khẩu phần / kích cỡ:</span>
                  </label>
                  <span className="text-[11px] text-ink-muted">Bắt buộc</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {dish.variants.map((v, vIdx) => {
                    const isSelected = selectedVariant?.id ? selectedVariant.id === v.id : false;
                    const adj = Number(v.price_adjustment || 0);

                    return (
                      <button
                        key={v.id || `variant-${vIdx}`}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/25 font-bold shadow-xs"
                            : "border-border bg-surface hover:bg-surface-hover text-ink"
                        }`}
                      >
                        <div className="truncate">
                          <span className="text-xs font-bold block truncate">{v.name}</span>
                          <span className="text-[11px] text-ink-muted">
                            {adj > 0 ? `+${formatVND(adj)}` : "Giá tiêu chuẩn"}
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BỘ CHỌN NHÓM TÙY CHỌN / TOPPING (OPTION GROUPS) */}
            {dish.option_groups && dish.option_groups.length > 0 && (
              <div className="space-y-4 pt-1">
                {dish.option_groups.map((group, gIdx) => {
                  const gId = group.id || `group-${gIdx}`;
                  const selectedForGroup = group.id ? selectedOptions[group.id] || [] : [];

                  return (
                    <div
                      key={gId}
                      className="p-4 rounded-2xl bg-surface border border-border/80 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                            {group.name}
                          </h4>
                          <span className="text-[10px] text-ink-muted">
                            {group.max_choices === 1
                              ? "Chọn tối đa 1 lựa chọn"
                              : `Chọn tối đa ${group.max_choices || "không giới hạn"} lựa chọn`}
                          </span>
                        </div>
                        {group.is_required && (
                          <span className="text-[10px] uppercase font-bold text-primary bg-surface-warm px-2 py-0.5 rounded-full border border-primary/20">
                            Bắt buộc
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {group.items?.map((item, itemIdx) => {
                          const itemId = item.id || `item-${itemIdx}`;
                          const isChecked = item.id ? selectedForGroup.includes(item.id) : false;
                          const extra = Number(item.price_adjustment || 0);

                          return (
                            <label
                              key={itemId}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? "border-primary/50 bg-primary/5 text-primary font-semibold"
                                  : "border-border/60 hover:bg-surface-hover text-ink"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type={group.max_choices === 1 ? "radio" : "checkbox"}
                                  name={`group-${gId}`}
                                  checked={isChecked}
                                  onChange={() => item.id && handleToggleOption(group, item.id)}
                                  className="w-4 h-4 text-primary accent-primary focus:ring-primary cursor-pointer"
                                />
                                <span>{item.name}</span>
                              </div>
                              {extra > 0 && (
                                <span className="text-primary font-mono font-semibold text-[11px]">
                                  +{formatVND(extra)}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ghi Chú Riêng Cho Bếp Mẹ */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold uppercase tracking-wider text-ink block">
                Dặn dò riêng cho Bếp Mẹ:
              </label>
              <input
                type="text"
                placeholder="VD: Không hành lá, nhiều ớt tươi, nước dùng trong, không bột ngọt..."
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full h-11 px-4 text-xs bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs text-ink placeholder:text-ink-light"
              />
            </div>

            {/* BẢNG TẠM TÍNH & CỤM NÚT ĐẶT MÓN */}
            <div className="p-5 bg-gradient-to-br from-surface to-surface-warm/60 rounded-3xl border border-border shadow-md space-y-4">
              <div className="flex items-center justify-between">
                {/* Bộ Tăng Giảm Số Lượng */}
                <div className="flex items-center border border-border rounded-2xl bg-white p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-hover text-ink active:scale-95 transition-all cursor-pointer"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold font-mono text-ink">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-hover text-ink active:scale-95 transition-all cursor-pointer"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Tổng Tiền */}
                <div className="text-right">
                  <span className="text-[11px] text-ink-muted block">Tổng thanh toán:</span>
                  <div className="font-headline text-2xl sm:text-3xl font-black text-primary font-mono tracking-tight">
                    {formatVND(totalPrice)}
                  </div>
                </div>
              </div>

              {/* Nút Thêm Vào Giỏ Hàng Lớn */}
              <Button
                variant="primary"
                size="lg"
                className="w-full h-13 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-gold/40 cursor-pointer"
                onClick={handleAddToCart}
                disabled={isAdding}
              >
                <ShoppingBag className="w-5 h-5 text-turmeric" />
                <span>
                  {isAdding ? "Đang thêm vào giỏ..." : `Thêm Vào Giỏ Hàng • ${formatVND(totalPrice)}`}
                </span>
              </Button>

              {/* Thông báo thêm thành công */}
              {addedSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
                  <span className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Đã thêm món vào giỏ hàng thành công!
                  </span>
                  <Link
                    href="/gio-hang"
                    className="font-bold underline text-emerald-900 hover:text-emerald-700 ml-2 shrink-0"
                  >
                    Xem giỏ hàng →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. TABS: CÂU CHUYỆN DI SẢN, NGUYÊN LIỆU & ĐÁNH GIÁ ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="border-t border-border/80 pt-8">
          {/* Tab Navigation */}
          <div className="flex items-center gap-3 border-b border-border/70 pb-3 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("story")}
              className={`pb-2.5 px-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === "story"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              Ký Ức &amp; Câu Chuyện Hương Vị
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ingredients")}
              className={`pb-2.5 px-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === "ingredients"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              Nguyên Liệu &amp; Thưởng Thức
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`pb-2.5 px-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === "reviews"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <span>Đánh Giá Thực Khách</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
                {reviews.length}
              </span>
            </button>
          </div>

          {/* Tab Content 1: Câu chuyện ẩm thực */}
          {activeTab === "story" && (
            <div className="pt-6 max-w-4xl space-y-4 animate-in fade-in duration-200">
              <h3 className="font-headline text-2xl font-bold text-primary italic">
                &ldquo;Nơi Ký Ức Hương Vị Quê Nhà Tái Sinh&rdquo;
              </h3>
              <p className="text-sm sm:text-base text-ink leading-relaxed">
                {dish.story ||
                  dish.description ||
                  "Mỗi công thức tại Vị Việt đều được đúc kết từ tâm huyết của nghệ nhân bếp Việt, kết hợp nguyên liệu nông sản tươi sạch để mang đến trải nghiệm ẩm thực trọn vẹn nhất."}
              </p>
              <div className="p-4 rounded-2xl bg-surface border border-border/80 text-xs text-ink-muted space-y-1">
                <span className="font-bold text-ink block">Tiêu chuẩn Michelin Selected:</span>
                <p>
                  Nguyên liệu được tuyển chọn trực tiếp từ các hợp tác xã nông sản sạch miền Tây Bắc và đồng bằng sông Cửu Long, đảm bảo sự tươi lành tuyệt đối và giữ vẹn nguyên dưỡng chất tự nhiên.
                </p>
              </div>
            </div>
          )}

          {/* Tab Content 2: Tầng nguyên liệu & Hướng dẫn thưởng thức */}
          {activeTab === "ingredients" && (
            <div className="pt-6 max-w-4xl space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-surface border border-border/80 shadow-2xs space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-gold" />
                    <span>Nguồn gốc nguyên liệu chính</span>
                  </h4>
                  {dish.ingredients && dish.ingredients.length > 0 ? (
                    <ul className="space-y-2 text-xs text-ink-muted">
                      {dish.ingredients.map((ingredient) => (
                        <li
                          key={ingredient.id}
                          className="rounded-lg border border-border/60 bg-white/60 p-2.5"
                        >
                          <span className="flex items-center gap-1.5 font-semibold text-ink">
                            {ingredient.is_allergen && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            )}
                            {ingredient.name}
                          </span>
                          {ingredient.note && (
                            <span className="mt-1 block text-[11px]">
                              {ingredient.note}
                            </span>
                          )}
                          {ingredient.is_allergen && (
                            <span className="mt-1 block text-[10px] font-bold uppercase text-amber-700">
                              Có thể gây dị ứng
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs italic text-ink-muted">
                      {dish.description || "Nguyên liệu tươi lành tuyển chọn theo tiêu chuẩn Michelin Selected."}
                    </p>
                  )}
                  {dish.ingredient_data_status === "PARTIAL" && (
                    <p className="text-[11px] font-medium text-amber-700">
                      Danh sách nguyên liệu hiện chưa đầy đủ.
                    </p>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-surface border border-border/80 shadow-2xs space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-turmeric" />
                    <span>Nghệ thuật thưởng thức chuẩn điệu</span>
                  </h4>
                  <ul className="text-xs text-ink-muted space-y-1.5 list-disc list-inside">
                    {GENERAL_TASTING_NOTES.map((note, nIdx) => (
                      <li key={nIdx}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Đánh giá từ thực khách */}
          {activeTab === "reviews" && (
            <div className="pt-6 max-w-4xl space-y-4 animate-in fade-in duration-200">
              {reviews.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-surface border border-border/60 text-ink-muted space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-ink-light" />
                  <p className="text-sm font-semibold">Chưa có đánh giá nào cho món ăn này.</p>
                  <p className="text-xs">Hãy là thực khách đầu tiên thưởng thức và chia sẻ cảm nhận vị giác!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-surface border border-border/70 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {(rev.author_display_name || rev.user_name || "K").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-ink block">
                              {rev.author_display_name || rev.user_name || "Thực khách sành ăn"}
                            </span>
                            <span className="text-[10px] text-ink-muted">
                              {new Date(rev.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>

                        {/* Sao */}
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? "fill-amber-400 text-amber-400" : "text-border"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-ink leading-relaxed">
                        {rev.comment || rev.content || "Món ăn rất vừa miệng, giao nóng hổi và đóng gói cực kỳ chỉn chu!"}
                      </p>

                      {/* Phản hồi từ Bếp Mẹ Vị Việt nếu có */}
                      {rev.reply && (
                        <div className="mt-2.5 p-3 rounded-xl bg-surface-warm/60 border border-primary/20 text-xs space-y-1">
                          <span className="font-bold text-primary flex items-center gap-1.5 text-[11px]">
                            <Sparkles className="w-3 h-3 text-gold" />
                            Phản hồi từ Bếp Mẹ Vị Việt:
                          </span>
                          <p className="text-ink-muted text-[11px] leading-relaxed">
                            {rev.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= 4. MÓN ĂN GỢI Ý CÙNG PHONG VỊ (RELATED DISHES) ================= */}
      {relatedDishes.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="border-t border-border/80 pt-10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-gold block">
                  Khám Phá Thêm
                </span>
                <h3 className="font-headline text-2xl sm:text-3xl font-bold text-primary mt-1">
                  Mỹ Vị Cùng Phong Vị Di Sản
                </h3>
              </div>
              <Link
                href="/thuc-don"
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedDishes.map((rDish) => (
                <Link
                  key={rDish.id}
                  href={`/mon/${rDish.slug}`}
                  className="group rounded-2xl bg-surface border border-border p-3 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-hover mb-3">
                    <Image
                      src={rDish.image_url || "/placeholder-dish.jpg"}
                      alt={rDish.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-turmeric block">
                    {rDish.category?.name || "Di sản"}
                  </span>
                  <h4 className="font-headline text-sm font-bold text-ink line-clamp-2 mt-0.5 group-hover:text-primary transition-colors flex-1">
                    {rDish.name}
                  </h4>
                  <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="font-mono text-xs sm:text-sm font-bold text-primary">
                      {formatVND(Number(rDish.base_price || 0))}
                    </span>
                    <span className="text-[11px] text-ink-muted group-hover:text-primary transition-colors font-medium">
                      Xem ngay →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
