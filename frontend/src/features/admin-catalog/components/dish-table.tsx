"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Dish } from "../types";
import { formatVND } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Flame, Sparkles, Image as ImageIcon, Search, CheckCircle2, XCircle } from "lucide-react";

interface DishTableProps {
  dishes: Dish[];
  isLoading: boolean;
  onToggleActive: (id: string, active: boolean) => void;
  onDeleteDish: (id: string) => void;
  onSearchChange: (query: string) => void;
}

export const DishTable: React.FC<DishTableProps> = ({
  dishes,
  isLoading,
  onToggleActive,
  onDeleteDish,
  onSearchChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearchChange(val);
  };

  return (
    <div className="w-full bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm món ăn theo tên hoặc mã..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-hover border border-border rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-red focus:bg-surface"
          />
        </div>

        <div className="text-xs text-ink-muted self-end sm:self-auto">
          Hiển thị <span className="font-bold text-ink">{dishes.length}</span> món ăn
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-hover border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="py-3 px-4 w-14 text-center">Ảnh</th>
              <th className="py-3 px-4">Tên món ăn</th>
              <th className="py-3 px-4">Danh mục</th>
              <th className="py-3 px-4">Giá cơ bản</th>
              <th className="py-3 px-4 text-center">Biến thể / Size</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-ink-muted">
                  Đang tải danh sách món ăn...
                </td>
              </tr>
            ) : dishes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-ink-muted">
                  Không tìm thấy món ăn nào phù hợp.
                </td>
              </tr>
            ) : (
              dishes.map((dish) => {
                const variantCount = dish.variants?.length || 0;
                const optionGroupCount = dish.option_groups?.length || 0;

                return (
                  <tr key={dish.id} className="hover:bg-surface-hover/70 transition-colors">
                    {/* Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-hover border border-border overflow-hidden relative flex items-center justify-center shrink-0">
                        {dish.image_url ? (
                          <img
                            src={typeof dish.image_url === "string" ? dish.image_url : (dish.image_url as any)?.asset_path}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-ink-light" />
                        )}
                      </div>
                    </td>

                    {/* Dish Name & Badges */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/menu/${dish.id}`}
                            className="font-bold text-ink hover:text-brand-red transition-colors"
                          >
                            {dish.name}
                          </Link>
                          {dish.is_featured && (
                            <span title="Món nổi bật">
                              <Sparkles className="w-3.5 h-3.5 text-turmeric fill-turmeric" />
                            </span>
                          )}
                          {dish.spicy_level > 0 && (
                            <span className="flex items-center text-red-500" title={`Độ cay cấp ${dish.spicy_level}`}>
                              <Flame className="w-3.5 h-3.5 fill-red-500" />
                              <span className="text-[10px] font-bold">{dish.spicy_level}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-ink-muted font-mono">{dish.slug}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="text-xs text-ink font-medium">
                        {dish.category?.name || "--"}
                      </span>
                    </td>

                    {/* Base Price */}
                    <td className="py-3 px-4 font-semibold text-brand-red">
                      {formatVND(dish.base_price)}
                    </td>

                    {/* Variants / Options */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded bg-surface-hover border border-border text-ink-muted font-mono">
                          {variantCount} size
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-hover border border-border text-ink-muted font-mono">
                          {optionGroupCount} nhóm
                        </span>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleActive(dish.id, !dish.is_active)}
                        className="inline-flex items-center gap-1 cursor-pointer focus:outline-none"
                      >
                        {dish.is_active ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="w-3 h-3" />
                            Đang bán
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            <XCircle className="w-3 h-3" />
                            Tạm ẩn
                          </Badge>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link href={`/admin/menu/${dish.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Chỉnh sửa chi tiết">
                            <Edit className="w-4 h-4 text-ink-muted hover:text-brand-red" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          title="Xóa món"
                          onClick={() => onDeleteDish(dish.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

