"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { CategoryBar } from "@/features/admin-catalog/components/category-bar";
import { CategoryModal } from "@/features/admin-catalog/components/category-modal";
import { DishTable } from "@/features/admin-catalog/components/dish-table";
import { MenuImportModal } from "@/features/admin-catalog/components/menu-import-modal";
import { Category, Dish } from "@/features/admin-catalog/types";
import { adminCatalogApi } from "@/features/admin-catalog/api/admin-catalog.api";
import { FileUp, Plus, RefreshCw } from "lucide-react";

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catsRes, dishesRes] = await Promise.all([
        adminCatalogApi.getCategories(),
        adminCatalogApi.getDishes({
          categoryId: selectedCategoryId,
          search: searchQuery || undefined,
        }),
      ]);

      const dishList: Dish[] = Array.isArray(dishesRes) ? dishesRes : (dishesRes as any).data || [];
      setDishes(dishList);

      // Đếm số món trong mỗi danh mục
      const catsWithCount = catsRes.map((cat) => {
        const count = dishList.filter((d) => d.category_id === cat.id).length;
        return { ...cat, dish_count: count };
      });
      setCategories(catsWithCount);
    } catch (err) {
      console.error("Failed to load catalog data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await adminCatalogApi.toggleDishActive(id, active);
      setDishes((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_active: active } : d))
      );
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật trạng thái món");
    }
  };

  const handleDeleteDish = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa món ăn này khỏi thực đơn?")) return;
    try {
      await adminCatalogApi.deleteDish(id);
      setDishes((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || "Không thể xóa món ăn");
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  return (
    <>
      <AdminHeader
        title="Quản lý Thực đơn & Món ăn (SCR-25)"
        subtitle="Thiết lập danh mục, định giá, trạng thái kinh doanh và danh mục ẩm thực"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportOpen(true)}
            >
              <FileUp className="w-4 h-4" />
              <span>Import Excel</span>
            </Button>
            <Link href="/admin/menu/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" />
                <span>Thêm món ăn mới</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Horizontal Category Bar */}
        <CategoryBar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onAddCategory={handleOpenAddCategory}
          onEditCategory={handleOpenEditCategory}
        />

        {/* Dish List Table */}
        <DishTable
          dishes={dishes}
          isLoading={isLoading}
          onToggleActive={handleToggleActive}
          onDeleteDish={handleDeleteDish}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Category Modal (Create/Edit/Delete) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={editingCategory}
        onSuccess={loadData}
      />
      <MenuImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={loadData}
      />
    </>
  );
}

