"use client";

import React from "react";
import Link from "next/link";
import { CatalogDish } from "../types";
import { formatVND } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Flame, Utensils } from "lucide-react";

interface DishCardProps {
  dish: CatalogDish;
  onSelect?: (dish: CatalogDish) => void;
}

export const DishCard: React.FC<DishCardProps> = ({ dish, onSelect }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div className="aspect-square relative bg-surface-hover overflow-hidden">
        {dish.image_url ? (
          <img
            src={dish.image_url}
            alt={dish.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-light">
            <Utensils className="w-8 h-8 opacity-40" />
          </div>
        )}
        {dish.spicy_level > 0 && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-bold text-red-600 shadow-xs">
            <Flame className="w-3 h-3 fill-red-500" />
            <span>Cay cấp {dish.spicy_level}</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-turmeric">
            {dish.category?.name || "Món ăn"}
          </span>
          <Link href={`/mon/${dish.slug}`}>
            <h3 className="font-bold text-sm text-ink group-hover:text-brand-red transition-colors line-clamp-1 mt-0.5">
              {dish.name}
            </h3>
          </Link>
          <p className="text-xs text-ink-muted line-clamp-2 mt-1">
            {dish.description || "Hương vị nguyên bản, chế biến theo công thức gia truyền."}
          </p>
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between mt-2">
          <span className="font-bold text-sm text-brand-red font-mono">
            {formatVND(dish.base_price)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect?.(dish)}
          >
            Chọn món
          </Button>
        </div>
      </div>
    </div>
  );
};

