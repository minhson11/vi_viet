"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { Category, Dish } from "@/features/admin-catalog/types";
import { formatVND } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Search, Utensils, Flame, Sparkles } from "lucide-react";

function StorefrontMenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | undefined>(
    categoryParam || undefined
  );
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParam || "");
  const [isLoading, setIsLoading] = useState(true);

  // Đồng bộ selectedCatId và searchParam khi query param trên URL thay đổi
  useEffect(() => {
    setSelectedCatId(categoryParam || undefined);
  }, [categoryParam]);

  useEffect(() => {
    if (searchParam !== null) {
      setSearchTerm(searchParam);
    }
  }, [searchParam]);

  // Nạp danh sách danh mục ban đầu
  useEffect(() => {
    async function loadCategories() {
      try {
        const rawCats = await catalogApi.getCategories();
        const cats: Category[] = rawCats.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          sort_order: c.sort_order || 0,
          is_active: true,
        }));
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Nạp danh sách món ăn theo danh mục được chọn & từ khóa tìm kiếm
  useEffect(() => {
    let isCurrent = true;
    async function loadDishes() {
      setIsLoading(true);
      try {
        const isNumeric = selectedCatId && /^\d+$/.test(selectedCatId);
        const listRes = await catalogApi.getDishes({
          category_id: isNumeric ? selectedCatId : undefined,
          category_slug: selectedCatId && !isNumeric ? selectedCatId : undefined,
          search: searchTerm || undefined,
          limit: 100,
        });

        if (!isCurrent) return;

        const list: Dish[] = listRes.map((cd) => ({
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
        setDishes(list);
      } catch (err) {
        if (isCurrent) {
          console.error("Failed to load storefront dishes:", err);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("viviet_page_ready"));
          }
        }
      }
    }
    loadDishes();
    return () => {
      isCurrent = false;
    };
  }, [selectedCatId, searchTerm]);

  const currentCategory = categories.find(
    (c) => c.id === selectedCatId || c.slug === selectedCatId
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#fdeae3] text-primary text-[11px] font-bold uppercase tracking-wider border border-[#e2beba]/50">
              Mỹ Vị Nấu Tươi Mỗi Ngày
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-ink mt-2">
            Thực Đơn Vị Việt
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            {currentCategory
              ? `Đang xem các món thuộc danh mục "${currentCategory.name}"`
              : "Khám phá trọn vẹn hương vị quê nhà di sản ba miền"}
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm món phở, bún, cơm, đồ uống..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red shadow-xs"
          />
        </div>
      </div>

      {/* Category Horizontal Scroll Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-border">
        <button
          onClick={() => {
            setSelectedCatId(undefined);
            router.replace("/thuc-don", { scroll: false });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            !selectedCatId
              ? "bg-brand-red text-cream shadow-xs"
              : "bg-surface text-ink hover:bg-surface-hover border border-border"
          }`}
        >
          Tất cả thực đơn
        </button>

        {categories.map((cat) => {
          const isCatActive =
            selectedCatId === cat.id || selectedCatId === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => {
                const key = cat.slug || cat.id;
                setSelectedCatId(key);
                router.replace(`/thuc-don?category=${key}`, { scroll: false });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isCatActive
                  ? "bg-brand-red text-cream shadow-xs font-bold"
                  : "bg-surface text-ink hover:bg-surface-hover border border-border"
              }`}
            >
              {isCatActive && <Sparkles className="w-3 h-3 text-gold" />}
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Dishes Grid */}
      {isLoading ? (
        <div className="min-h-[250px]" />
      ) : dishes.length === 0 ? (
        <div className="py-20 text-center text-ink-muted border border-dashed border-border rounded-2xl p-8 space-y-3">
          <Utensils className="w-10 h-10 mx-auto text-ink-light opacity-50" />
          <p className="text-sm font-semibold">
            Không tìm thấy món ăn nào trong danh mục hoặc từ khóa tìm kiếm này.
          </p>
          <button
            onClick={() => {
              setSelectedCatId(undefined);
              setSearchTerm("");
              router.replace("/thuc-don", { scroll: false });
            }}
            className="text-xs text-brand-red font-bold underline cursor-pointer"
          >
            Quay lại xem tất cả thực đơn
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
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
                    {dish.description ||
                      "Hương vị nguyên bản, chế biến theo công thức gia truyền."}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between mt-2">
                  <span className="font-bold text-sm text-brand-red font-mono">
                    {formatVND(dish.base_price)}
                  </span>
                  <Link href={`/mon/${dish.slug}`}>
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      Tùy chọn
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StorefrontMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-ink-muted">
          Đang nạp thực đơn...
        </div>
      }
    >
      <StorefrontMenuContent />
    </Suspense>
  );
}
