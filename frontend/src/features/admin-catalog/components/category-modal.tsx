"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Category } from "../types";
import { adminCatalogApi } from "../api/admin-catalog.api";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  onSuccess: () => void;
}

function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || "");
      setSortOrder(category.sort_order || 0);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setSortOrder(0);
    }
    setError(null);
  }, [category, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!category) {
      setSlug(generateSlug(newName));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên danh mục không được để trống");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      if (category) {
        await adminCatalogApi.updateCategory(category.id, {
          name,
          slug,
          description,
          sort_order: Number(sortOrder),
        });
      } else {
        await adminCatalogApi.createCategory({
          name,
          slug,
          description,
          sort_order: Number(sortOrder),
          is_active: true,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể lưu danh mục");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category || !window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    setIsDeleting(true);
    try {
      await adminCatalogApi.deleteCategory(category.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể xóa danh mục");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
      description="Quản lý nhóm món ăn trong thực đơn của nhà hàng"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
            {error}
          </div>
        )}

        <Input
          label="Tên danh mục"
          placeholder="Ví dụ: Phở & Bún Truyền Thống"
          value={name}
          onChange={handleNameChange}
          required
        />

        <Input
          label="Đường dẫn tĩnh (Slug)"
          placeholder="pho-bun-truyen-thong"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink uppercase tracking-wider">Mô tả</label>
          <textarea
            className="w-full min-h-[80px] px-3 py-2 bg-surface border border-border rounded-md text-sm text-ink placeholder:text-ink-light transition-all focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            placeholder="Mô tả ngắn về danh mục món ăn này..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Input
          label="Thứ tự hiển thị"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          helperText="Số nhỏ hơn sẽ hiển thị trước trên thực đơn"
        />

        <div className="flex items-center justify-between pt-4 border-t border-border">
          {category ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Xóa danh mục
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              {category ? "Lưu thay đổi" : "Tạo danh mục"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

