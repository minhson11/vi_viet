"use client";

import React from "react";
import { CatalogCategory } from "../types";
import { Search } from "lucide-react";

interface DishFiltersProps {
  categories: CatalogCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const DishFilters: React.FC<DishFiltersProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm món ăn nhanh..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategoryId === null
              ? "bg-brand-red text-cream"
              : "bg-surface text-ink hover:bg-surface-hover border border-border"
          }`}
        >
          Tất cả
        </button>

        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategoryId === c.id
                ? "bg-brand-red text-cream"
                : "bg-surface text-ink hover:bg-surface-hover border border-border"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
};

