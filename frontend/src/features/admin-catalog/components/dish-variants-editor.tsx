"use client";

import React from "react";
import { DishVariant } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { formatVND } from "@/lib/utils/currency";

interface DishVariantsEditorProps {
  variants: DishVariant[];
  basePrice: number;
  onChange: (variants: DishVariant[]) => void;
}

export const DishVariantsEditor: React.FC<DishVariantsEditorProps> = ({
  variants,
  basePrice,
  onChange,
}) => {
  const handleAddVariant = (customName?: string, priceAdj: number = 0) => {
    const newVariant: DishVariant = {
      name: customName || (variants.length === 0 ? "Khẩu phần tiêu chuẩn" : `Khẩu phần cỡ ${variants.length + 1}`),
      sku: "",
      price_adjustment: priceAdj,
      is_available: true,
      is_default: variants.length === 0,
      sort_order: variants.length + 1,
    };
    onChange([...variants, newVariant]);
  };

  const handleUpdate = (index: number, field: keyof DishVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };

    // Nếu đánh dấu default thì bỏ default của các biến thể khác
    if (field === "is_default" && value === true) {
      updated.forEach((v, i) => {
        if (i !== index) v.is_default = false;
      });
    }

    onChange(updated);
  };

  const handleDelete = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((v) => v.is_default)) {
      updated[0].is_default = true;
    }
    onChange(updated);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
            Biến thể kích cỡ & Khẩu phần ({variants.length})
          </h3>
          <p className="text-xs text-ink-muted">
            Thiết lập nhiều biến thể (Tô vừa, Tô lớn, Suất đặc biệt...). Giá bán = Giá gốc ({formatVND(basePrice)}) + Giá cộng thêm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="primary" size="sm" onClick={() => handleAddVariant()}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Thêm biến thể</span>
          </Button>
        </div>
      </div>

      {/* Quick preset buttons */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-cream/40 border border-turmeric/30 rounded-xl">
        <span className="text-[11px] font-semibold text-ink flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-turmeric" />
          <span>Gợi ý thêm nhanh:</span>
        </span>
        <button
          type="button"
          onClick={() => handleAddVariant("Tô Lớn (Nhiều thịt)", 15000)}
          className="px-2.5 py-1 text-xs bg-surface border border-border rounded-lg hover:border-brand-red text-ink transition-colors"
        >
          + Tô Lớn (+15k)
        </button>
        <button
          type="button"
          onClick={() => handleAddVariant("Suất Đặc Biệt Gia Truyền", 30000)}
          className="px-2.5 py-1 text-xs bg-surface border border-border rounded-lg hover:border-brand-red text-ink transition-colors"
        >
          + Suất Đặc Biệt (+30k)
        </button>
        <button
          type="button"
          onClick={() => handleAddVariant("Khẩu phần nhỏ (Trẻ em)", -10000)}
          className="px-2.5 py-1 text-xs bg-surface border border-border rounded-lg hover:border-brand-red text-ink transition-colors"
        >
          + Phần Nhỏ (-10k)
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="py-8 text-center text-ink-muted border border-dashed border-border rounded-lg">
          <p className="text-sm">Chưa có biến thể kích cỡ nào.</p>
          <p className="text-xs mt-1">Món ăn cần ít nhất 1 biến thể mặc định ban đầu.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => handleAddVariant()}>
            Tạo biến thể đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((v, idx) => {
            const finalPrice = basePrice + Number(v.price_adjustment || 0);

            return (
              <div
                key={idx}
                className="p-4 bg-surface-hover/50 border border-border rounded-lg grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
              >
                {/* Variant Name */}
                <div className="md:col-span-4">
                  <Input
                    label={`Tên biến thể #${idx + 1}`}
                    placeholder="Ví dụ: Tô Lớn / Suất Đặc Biệt"
                    value={v.name}
                    onChange={(e) => handleUpdate(idx, "name", e.target.value)}
                    required
                  />
                </div>

                {/* SKU */}
                <div className="md:col-span-2">
                  <Input
                    label="Mã SKU (tùy chọn)"
                    placeholder="PHO-BO-L"
                    value={v.sku || ""}
                    onChange={(e) => handleUpdate(idx, "sku", e.target.value)}
                  />
                </div>

                {/* Price Adjustment */}
                <div className="md:col-span-3">
                  <Input
                    label="Giá chênh lệch (+ / - VNĐ)"
                    type="number"
                    placeholder="15000"
                    value={v.price_adjustment}
                    onChange={(e) => handleUpdate(idx, "price_adjustment", Number(e.target.value))}
                    helperText={`Tổng bán: ${formatVND(finalPrice)}`}
                  />
                </div>

                {/* Checkboxes & Actions */}
                <div className="md:col-span-3 flex items-center justify-between pt-4 md:pt-2">
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.is_default}
                        onChange={(e) => handleUpdate(idx, "is_default", e.target.checked)}
                        className="rounded text-brand-red"
                      />
                      <span className={v.is_default ? "text-brand-red font-bold" : "text-ink"}>
                        Mặc định
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.is_available}
                        onChange={(e) => handleUpdate(idx, "is_available", e.target.checked)}
                        className="rounded text-brand-red"
                      />
                      <span>Đang có sẵn</span>
                    </label>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-50 h-8 w-8"
                    onClick={() => handleDelete(idx)}
                    title="Xóa biến thể này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
