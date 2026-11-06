"use client";

import React from "react";
import { Category, Dish } from "../types";
import { Input } from "@/components/ui/input";
import { Flame, Sparkles } from "lucide-react";

interface DishFormBasicProps {
  formData: Partial<Dish>;
  categories: Category[];
  onChange: (field: string, value: any) => void;
}

export const DishFormBasic: React.FC<DishFormBasicProps> = ({
  formData,
  categories,
  onChange,
}) => {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-6">
      <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3">
        1. Thông tin định danh & Phân loại
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Tên món ăn"
          placeholder="Ví dụ: Phở Bò Tái Lăn Hà Nội"
          value={formData.name || ""}
          onChange={(e) => onChange("name", e.target.value)}
          required
        />

        <Input
          label="Đường dẫn tĩnh (Slug)"
          placeholder="pho-bo-tai-lan-ha-noi"
          value={formData.slug || ""}
          onChange={(e) => onChange("slug", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink uppercase tracking-wider">
            Danh mục thực đơn <span className="text-brand-red ml-1">*</span>
          </label>
          <select
            className="w-full h-10 px-3 bg-surface border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-red"
            value={formData.category_id || ""}
            onChange={(e) => onChange("category_id", e.target.value)}
            required
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Base Price */}
        <Input
          label="Giá cơ bản (VNĐ)"
          type="number"
          placeholder="65000"
          value={formData.base_price !== undefined ? formData.base_price : ""}
          onChange={(e) => onChange("base_price", Number(e.target.value))}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink uppercase tracking-wider">Mô tả món ăn</label>
        <textarea
          className="w-full min-h-[100px] px-3 py-2 bg-surface border border-border rounded-md text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-brand-red"
          placeholder="Giới thiệu về nguyên liệu, hương vị đặc trưng truyền thống..."
          value={formData.description || ""}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>

      <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3 pt-2">
        2. Đặc tính ẩm thực & Vận hành
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Prep Time */}
        <Input
          label="Thời gian chế biến (phút)"
          type="number"
          placeholder="15"
          value={formData.prep_time_minutes !== undefined ? formData.prep_time_minutes || "" : ""}
          onChange={(e) => onChange("prep_time_minutes", Number(e.target.value))}
          helperText="Dự kiến hiển thị tại màn hình KDS nhà bếp"
        />

        {/* Calories */}
        <Input
          label="Năng lượng (Kcal)"
          type="number"
          placeholder="450"
          value={formData.calories !== undefined ? formData.calories || "" : ""}
          onChange={(e) => onChange("calories", Number(e.target.value))}
          helperText="Tùy chọn hiển thị cho khách theo dõi dinh dưỡng"
        />

        {/* Spicy Level */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Mức độ cay (0 - 3)</span>
          </label>
          <select
            className="w-full h-10 px-3 bg-surface border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-red"
            value={formData.spicy_level ?? 0}
            onChange={(e) => onChange("spicy_level", Number(e.target.value))}
          >
            <option value={0}>0 - Không cay (Trẻ em / Khẩu vị nhẹ)</option>
            <option value={1}>1 - Cay the nhẹ</option>
            <option value={2}>2 - Cay vừa (Ớt chỉ thiên truyền thống)</option>
            <option value={3}>3 - Cay nồng đặc biệt</option>
          </select>
        </div>
      </div>

      {/* Switches: Active & Featured */}
      <div className="pt-2 flex flex-col sm:flex-row gap-6 border-t border-border">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-border text-brand-red focus:ring-brand-red"
            checked={Boolean(formData.is_active)}
            onChange={(e) => onChange("is_active", e.target.checked)}
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">Đang kinh doanh (Active)</span>
            <span className="text-xs text-ink-muted">Cho phép khách hàng tìm thấy và đặt trên web</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-border text-brand-red focus:ring-brand-red"
            checked={Boolean(formData.is_featured)}
            onChange={(e) => onChange("is_featured", e.target.checked)}
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <span>Món đặc sắc gợi ý</span>
              <Sparkles className="w-3.5 h-3.5 text-turmeric" />
            </span>
            <span className="text-xs text-ink-muted">Ghim nổi bật trên trang chủ và đầu danh mục</span>
          </div>
        </label>
      </div>
    </div>
  );
};

