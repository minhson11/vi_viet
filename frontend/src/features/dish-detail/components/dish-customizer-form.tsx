"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Star,
  Flame,
  Check,
  ShoppingBag,
  Minus,
  Plus,
  CheckCircle2,
  Utensils,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils/currency";
import { Dish, DishVariant, OptionGroup } from "@/features/admin-catalog/types";

interface DishCustomizerFormProps {
  dish: Dish;
  reviewsCount: number;
  selectedVariant: DishVariant | null;
  onSelectVariant: (v: DishVariant) => void;
  selectedOptions: Record<string, string[]>;
  onToggleOption: (group: OptionGroup, itemId: string) => void;
  quantity: number;
  onChangeQuantity: (updater: (q: number) => number) => void;
  specialNotes: string;
  onChangeSpecialNotes: (notes: string) => void;
  unitPrice: number;
  totalPrice: number;
  isAdding: boolean;
  addedSuccess: boolean;
  onAddToCart: () => void;
}

export function DishCustomizerForm({
  dish,
  reviewsCount,
  selectedVariant,
  onSelectVariant,
  selectedOptions,
  onToggleOption,
  quantity,
  onChangeQuantity,
  specialNotes,
  onChangeSpecialNotes,
  unitPrice,
  totalPrice,
  isAdding,
  addedSuccess,
  onAddToCart,
}: DishCustomizerFormProps) {
  return (
    <div className="lg:col-span-5 space-y-6">
      {/* Header Món Ăn */}
      <div className="border-b border-border/70 pb-5 space-y-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-warm text-primary border border-primary/25 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-gold" />
            {dish.category?.name || "Mỹ Vị Di Sản"}
          </span>

          {reviewsCount > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>5.0</span>
              <span className="text-amber-700 font-normal">({reviewsCount} đánh giá)</span>
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

              if (code.includes("dac-san") || code.includes("đặc sản") || code.includes("heritage")) {
                return (
                  <span
                    key={tag.id || tIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 shadow-2xs tracking-wide"
                  >
                    <Utensils className="w-3.5 h-3.5 text-primary" />
                    <span>{tag.name}</span>
                  </span>
                );
              }

              if (code.includes("thanh-dam") || code.includes("chay") || code.includes("healthy")) {
                return (
                  <span
                    key={tag.id || tIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-300/70 shadow-2xs tracking-wide"
                  >
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{tag.name}</span>
                  </span>
                );
              }

              return (
                <span
                  key={tag.id || tIdx}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-surface-hover text-ink border border-border/80 shadow-2xs"
                >
                  #{tag.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Đoạn trích giới thiệu hương vị */}
        {dish.description && (
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed pt-1 line-clamp-3">
            {dish.description}
          </p>
        )}
      </div>

      {/* BỘ CHỌN BIẾN THỂ / PHẦN ĂN (VARIANTS) */}
      {dish.variants && dish.variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-ink block">
              Chọn khẩu phần / Biến thể:
            </label>
            <span className="text-[11px] text-ink-muted">Bắt buộc</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {dish.variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const adj = Number(v.price_adjustment || 0);

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVariant(v)}
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
                            onChange={() => item.id && onToggleOption(group, item.id)}
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
          onChange={(e) => onChangeSpecialNotes(e.target.value)}
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
              onClick={() => onChangeQuantity((q) => Math.max(1, q - 1))}
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
              onClick={() => onChangeQuantity((q) => q + 1)}
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
          onClick={onAddToCart}
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
  );
}
