"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Utensils, ArrowRight, Flame, Sparkles } from "lucide-react";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { CatalogDish } from "@/features/catalog/types";
import { formatVND } from "@/lib/utils/currency";

const POPULAR_SEARCH_TAGS = ["Phở bò", "Bánh mì", "Bún chả", "Gỏi cuốn", "Chả giò"];

interface HeaderSearchBarProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export const HeaderSearchBar: React.FC<HeaderSearchBarProps> = ({
  variant = "desktop",
  onNavigate,
  className = "",
  autoFocus = false,
}) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CatalogDish[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce tìm kiếm 250ms tránh spam API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Thực hiện tìm kiếm trực tiếp khi từ khóa thay đổi
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);

    catalogApi
      .getDishes({ search: debouncedQuery, limit: 6 })
      .then((dishes) => {
        if (isCurrent) {
          setResults(dishes || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.error("Lỗi tìm kiếm món ăn:", err);
          setResults([]);
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery]);

  // Đóng dropdown và thu nhỏ nút khi click ra ngoài (nếu không có từ khóa)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (!query.trim()) {
          setIsExpanded(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query]);

  const handleOpenSearch = () => {
    setIsExpanded(true);
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCloseSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setIsExpanded(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      router.push(`/thuc-don?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setIsExpanded(false);
      onNavigate?.();
    }
  };

  const handleSelectDish = (slug: string) => {
    router.push(`/mon/${slug}`);
    setIsOpen(false);
    setIsExpanded(false);
    onNavigate?.();
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    setIsOpen(true);
    setIsExpanded(true);
    inputRef.current?.focus();
  };

  const isDesktop = variant === "desktop";

  // Khi ở desktop và CHƯA nhấn vào -> THU NHỎ LẠI thành 1 nút icon tròn tinh tế
  if (isDesktop && !isExpanded && !query) {
    return (
      <div className={`shrink-0 ${className}`}>
        <button
          type="button"
          onClick={handleOpenSearch}
          className="cursor-pointer w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#e2beba]/80 bg-[#fdeae3]/60 hover:bg-white hover:border-brand-red/50 text-[#5a413d] hover:text-brand-red flex items-center justify-center transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 group shrink-0"
          title="Tìm kiếm món ăn"
          aria-label="Mở tìm kiếm"
        >
          <Search className="w-4 h-4 text-ink-muted group-hover:text-brand-red transition-colors shrink-0" />
        </button>
      </div>
    );
  }

  // Khi ĐÃ NHẤN VÀO (hoặc đang trên mobile) -> MỞ RỘNG thành thanh tìm kiếm live search đầy đủ
  return (
    <div
      ref={containerRef}
      className={`relative shrink-0 ${
        isDesktop
          ? "w-60 sm:w-64 md:w-72 transition-all duration-200 animate-in fade-in zoom-in-95"
          : "w-full"
      } ${className}`}
    >
      {/* Ô nhập tìm kiếm */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-full border bg-white border-brand-red ring-2 ring-brand-red/15 shadow-sm transition-all duration-200">
          <Search className="w-4 h-4 text-brand-red shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleCloseSearch();
              }
            }}
            autoFocus={autoFocus || isExpanded}
            placeholder="Tìm món ngon, phở, bún..."
            className="w-full bg-transparent text-xs text-ink placeholder:text-ink-muted/70 focus:outline-none whitespace-nowrap truncate"
          />

          {isLoading && (
            <Loader2 className="w-3.5 h-3.5 text-brand-red animate-spin shrink-0" />
          )}

          {/* Nút đóng / thu nhỏ lại */}
          <button
            type="button"
            onClick={handleCloseSearch}
            className="text-ink-light hover:text-brand-red p-0.5 cursor-pointer rounded-full hover:bg-black/5 shrink-0 transition-colors"
            title="Đóng tìm kiếm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Dropdown Kết quả tìm kiếm trực tiếp (Live Instant Search Dropdown) */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 bg-white rounded-2xl shadow-2xl border border-[#e2beba]/70 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
            isDesktop
              ? "right-0 w-[360px] sm:w-[400px]"
              : "left-0 right-0 w-full"
          }`}
        >
          {/* Header kết quả */}
          <div className="px-4 py-2.5 bg-[#fff8f6] border-b border-[#e2beba]/40 flex items-center justify-between text-[11px] font-semibold text-ink-muted">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              {query ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="truncate max-w-[200px]">KẾT QUẢ CHO &ldquo;{query}&rdquo;</span>
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 text-brand-red shrink-0" />
                  <span>GỢI Ý MÓN NGON HÔM NAY</span>
                </>
              )}
            </span>
            {query && !isLoading && (
              <span className="text-[10px] bg-brand-red/10 text-brand-red font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {results.length} món
              </span>
            )}
          </div>

          {/* Nội dung kết quả */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-[#f5ebe6]">
            {/* Khi đang tải dữ liệu */}
            {isLoading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Khi có kết quả tìm kiếm */}
            {!isLoading && results.length > 0 && (
              <div>
                {results.map((dish) => (
                  <div
                    key={dish.id}
                    onClick={() => handleSelectDish(dish.slug)}
                    className="p-3 flex items-center gap-3 hover:bg-[#fff8f6] transition-colors cursor-pointer group"
                  >
                    {/* Ảnh món */}
                    <div className="w-12 h-12 rounded-xl bg-surface-warm overflow-hidden shrink-0 border border-border/50">
                      {dish.image_url ? (
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-light">
                          <Utensils className="w-5 h-5 opacity-40" />
                        </div>
                      )}
                    </div>

                    {/* Tên & Danh mục & Giá */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-ink group-hover:text-brand-red transition-colors truncate">
                          {dish.name}
                        </p>
                        {dish.spicy_level > 0 && (
                          <span
                            className="inline-flex items-center text-[10px] text-brand-red shrink-0"
                            title={`Cay cấp ${dish.spicy_level}`}
                          >
                            <Flame className="w-3 h-3 fill-brand-red text-brand-red" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <span className="text-[10px] text-ink-muted truncate">
                          {dish.category?.name || "Món ăn Vị Việt"}
                        </span>
                        <span className="text-xs font-bold text-brand-red shrink-0 whitespace-nowrap">
                          {formatVND(dish.base_price)}
                        </span>
                      </div>
                    </div>

                    {/* Mũi tên dẫn hướng */}
                    <ArrowRight className="w-3.5 h-3.5 text-ink-light group-hover:text-brand-red group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* Khi không tìm thấy kết quả phù hợp */}
            {!isLoading && query && results.length === 0 && (
              <div className="p-6 text-center">
                <Utensils className="w-8 h-8 text-ink-light/50 mx-auto mb-2" />
                <p className="text-xs font-bold text-ink mb-1">
                  Không tìm thấy món &ldquo;{query}&rdquo;
                </p>
                <p className="text-[11px] text-ink-muted mb-4">
                  Hãy thử tìm kiếm với các món nổi bật dưới đây:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className="px-2.5 py-1 rounded-full bg-[#fdeae3] hover:bg-[#fff1eb] text-brand-red text-[11px] font-semibold border border-gold/30 hover:border-gold cursor-pointer transition-colors whitespace-nowrap"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Khi chưa nhập gì mà mở dropdown (Gợi ý nhanh) */}
            {!isLoading && !query && (
              <div className="p-4 space-y-3">
                <p className="text-[11px] text-ink-muted">
                  Tìm kiếm phổ biến hôm nay:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className="px-3 py-1.5 rounded-full bg-[#fff8f6] hover:bg-[#fff1eb] text-ink text-xs font-medium border border-[#e2beba]/60 hover:border-brand-red/50 hover:text-brand-red cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <Search className="w-3 h-3 text-ink-muted shrink-0" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Dropdown: Link xem tất cả kết quả */}
          {query.trim() && (
            <div className="p-2.5 bg-[#fff8f6] border-t border-[#e2beba]/40 text-center">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-brand-red hover:text-white text-xs font-bold text-brand-red border border-brand-red/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <span>Xem tất cả kết quả cho &ldquo;{query}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
