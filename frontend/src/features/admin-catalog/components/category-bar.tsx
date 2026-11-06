"use client";

import React from "react";
import { Category } from "../types";
import { cn } from "@/lib/utils/cn";
import { Plus, Edit2, Layers } from "lucide-react";

interface CategoryBarProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSelectCategory: (id: string | undefined) => void;
  onAddCategory: () => void;
  onEditCategory: (cat: Category) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
}) => {
  return (
    <div className="w-full bg-surface border border-border rounded-xl p-3 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-2 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          <Layers className="w-4 h-4 text-brand-red" />
          <span>Danh mục thực đơn ({categories.length})</span>
        </div>
        <button
          onClick={onAddCategory}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-red hover:text-brand-red-hover hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm danh mục</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {/* All button */}
        <button
          onClick={() => onSelectCategory(undefined)}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
            selectedCategoryId === undefined
              ? "bg-brand-red text-cream shadow-xs"
              : "bg-surface-hover text-ink hover:bg-border/60"
          )}
        >
          <span>Tất cả món</span>
        </button>

        {/* Categories pills */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <div
              key={cat.id}
              className={cn(
                "group relative px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border",
                isSelected
                  ? "bg-brand-red text-cream border-brand-red shadow-xs"
                  : "bg-surface text-ink border-border hover:bg-surface-hover"
              )}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span>{cat.name}</span>
              {cat.dish_count !== undefined && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isSelected ? "bg-cream/20 text-cream" : "bg-border text-ink-muted"
                  )}
                >
                  {cat.dish_count}
                </span>
              )}
              <button
                type="button"
                title="Chỉnh sửa danh mục"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCategory(cat);
                }}
                className={cn(
                  "p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                  isSelected ? "hover:bg-cream/20 text-cream" : "hover:bg-border text-ink-muted"
                )}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

