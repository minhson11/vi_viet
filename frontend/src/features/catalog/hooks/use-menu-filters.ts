"use client";

import { useState, useMemo } from "react";
import { CatalogDish } from "../types";

export function useMenuFilters(dishes: CatalogDish[]) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("name");

  const filteredDishes = useMemo(() => {
    return dishes
      .filter((dish) => {
        if (selectedCategoryId && dish.category_id !== selectedCategoryId) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return dish.name.toLowerCase().includes(q) || (dish.description || "").toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.base_price - b.base_price;
        if (sortBy === "price-desc") return b.base_price - a.base_price;
        return a.name.localeCompare(b.name, "vi");
      });
  }, [dishes, selectedCategoryId, searchQuery, sortBy]);

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredDishes,
  };
}

