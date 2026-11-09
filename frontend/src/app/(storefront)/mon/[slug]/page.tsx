"use client";

import React, { use } from "react";
import Link from "next/link";
import { ChevronRight, Share2, Check, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDishData } from "@/features/dish-detail/hooks/use-dish-data";
import { useDishCustomizer } from "@/features/dish-detail/hooks/use-dish-customizer";
import { DishHeroGallery } from "@/features/dish-detail/components/dish-hero-gallery";
import { DishCustomizerForm } from "@/features/dish-detail/components/dish-customizer-form";
import { DishStoryTabs } from "@/features/dish-detail/components/dish-story-tabs";
import { DishRelatedSlider } from "@/features/dish-detail/components/dish-related-slider";

export default function StorefrontDishDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = use(params);
  const slug = resolved.slug;

  const {
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
  } = useDishData(slug);

  const {
    selectedVariant,
    setSelectedVariant,
    selectedOptions,
    handleToggleOption,
    quantity,
    setQuantity,
    specialNotes,
    setSpecialNotes,
    unitPrice,
    totalPrice,
    isAdding,
    addedSuccess,
    handleAddToCart,
  } = useDishCustomizer({ dish, currentImageUrl });

  // Rèm Cinematic Intro đang che kín phía trên, không hiển thị spinner cũ
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-low via-surface to-surface pb-20">
      {/* 1. BREADCRUMB & TOP ACTIONS */}
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

          {/* Action Buttons: Chia sẻ & Yêu thích */}
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                isFavorite
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-border bg-white text-ink-muted hover:text-red-500 hover:border-red-200"
              }`}
              title={isFavorite ? "Đã lưu vào danh sách yêu thích" : "Lưu vào món ăn yêu thích"}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              <span>{isFavorite ? "Đã Thích" : "Yêu Thích"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KHUNG CHI TIẾT CHÍNH: GALLERY (7 CỘT) + CUSTOMIZER FORM (5 CỘT) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <DishHeroGallery
            dish={dish}
            galleryImages={galleryImages}
            selectedImageIndex={selectedImageIndex}
            onSelectImageIndex={setSelectedImageIndex}
            currentImageUrl={currentImageUrl}
          />

          <DishCustomizerForm
            dish={dish}
            reviewsCount={reviews.length}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
            selectedOptions={selectedOptions}
            onToggleOption={handleToggleOption}
            quantity={quantity}
            onChangeQuantity={setQuantity}
            specialNotes={specialNotes}
            onChangeSpecialNotes={setSpecialNotes}
            unitPrice={unitPrice}
            totalPrice={totalPrice}
            isAdding={isAdding}
            addedSuccess={addedSuccess}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>

      {/* 3. TABS: CÂU CHUYỆN DI SẢN, NGUYÊN LIỆU & ĐÁNH GIÁ */}
      <DishStoryTabs dish={dish} reviews={reviews} />

      {/* 4. MÓN ĂN GỢI Ý DÙNG KÈM */}
      <DishRelatedSlider relatedDishes={relatedDishes} />
    </div>
  );
}
