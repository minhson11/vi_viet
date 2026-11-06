"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs";
import { DishFormBasic } from "@/features/admin-catalog/components/dish-form-basic";
import { DishVariantsEditor } from "@/features/admin-catalog/components/dish-variants-editor";
import { DishOptionsEditor } from "@/features/admin-catalog/components/dish-options-editor";
import { DishImageUploader } from "@/features/admin-catalog/components/dish-image-uploader";
import { DishTagsEditor } from "@/features/admin-catalog/components/dish-tags-editor";
import { DishIngredientsEditor } from "@/features/admin-catalog/components/dish-ingredients-editor";
import {
  Category,
  Dish,
  DishImage,
  DishIngredientInput,
  DishVariant,
  Ingredient,
  IngredientDataStatus,
  OptionGroup,
  Tag,
} from "@/features/admin-catalog/types";
import { adminCatalogApi } from "@/features/admin-catalog/api/admin-catalog.api";
import { ArrowLeft, Save, Sparkles, Layers, Sliders, Image as ImageIcon, Tag as TagIcon, Trash2, ExternalLink, Leaf } from "lucide-react";

interface DishDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DishDetailPage({ params }: DishDetailPageProps) {
  const resolvedParams = use(params);
  const dishId = resolvedParams.id;
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Dish>>({});
  const [variants, setVariants] = useState<DishVariant[]>([]);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [images, setImages] = useState<DishImage[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<DishIngredientInput[]>([]);
  const [ingredientDataStatus, setIngredientDataStatus] =
    useState<IngredientDataStatus>("UNKNOWN");

  useEffect(() => {
    async function loadDish() {
      setIsLoading(true);
      try {
        const [cats, tags, ingredients, dish] = await Promise.all([
          adminCatalogApi.getCategories(),
          adminCatalogApi.getTags(),
          adminCatalogApi.getIngredients(),
          adminCatalogApi.getDishById(dishId),
        ]);

        setCategories(cats);
        setAvailableTags(tags);
        setAvailableIngredients(ingredients);
        setFormData(dish);
        setVariants(dish.variants || []);
        setOptionGroups(dish.option_groups || []);
        setImages(dish.images || []);
        setSelectedIngredients(
          (dish.ingredients || []).map((ingredient) => ({
            ingredient_id: ingredient.id,
            note: ingredient.note || undefined,
          })),
        );
        setIngredientDataStatus(dish.ingredient_data_status || "UNKNOWN");

        if (dish.tags) {
          setSelectedTagIds(dish.tags.map((t) => t.tag.id));
        }
      } catch (err: any) {
        setError(err.message || "Không thể tải thông tin món ăn");
      } finally {
        setIsLoading(false);
      }
    }
    loadDish();
  }, [dishId]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError("Vui lòng nhập tên món ăn");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        ...formData,
        variants,
        option_groups: optionGroups,
        images,
        tag_ids: selectedTagIds,
        ingredients: selectedIngredients,
        ingredient_data_status: ingredientDataStatus,
      };

      const updated = await adminCatalogApi.updateDish(dishId, payload);
      setFormData(updated);
      setVariants(updated.variants || []);
      setOptionGroups(updated.option_groups || []);
      setImages(updated.images || []);
      setSelectedIngredients(
        (updated.ingredients || []).map((ingredient) => ({
          ingredient_id: ingredient.id,
          note: ingredient.note || undefined,
        })),
      );
      setIngredientDataStatus(updated.ingredient_data_status || "UNKNOWN");
      setSuccessMsg("Đã lưu các thay đổi thành công!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật món ăn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn món ăn này khỏi thực đơn?")) return;
    try {
      await adminCatalogApi.deleteDish(dishId);
      router.push("/admin/menu");
    } catch (err: any) {
      setError(err.message || "Không thể xóa món ăn");
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-ink-muted">
        Đang tải dữ liệu cấu hình món ăn...
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title={`Chỉnh sửa món: ${formData.name || ""}`}
        subtitle={`Cấu hình aggregate SCR-26 • Mã món: ${dishId}`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/menu">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </Button>
            </Link>
            {formData.slug && (
              <Link href={`/mon/${formData.slug}`} target="_blank">
                <Button variant="ghost" size="sm" title="Xem trên giao diện khách hàng">
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Xem thử</span>
                </Button>
              </Link>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              title="Xóa món"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSubmitting}
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        }
      />

      <div className="w-full max-w-7xl space-y-6 p-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium animate-in fade-in">
            {successMsg}
          </div>
        )}

        <Tabs defaultValue="basic">
          <TabList className="flex-wrap overflow-visible rounded-xl border border-border bg-surface p-1 shadow-xs">
            <TabTrigger value="basic" icon={<Layers className="w-4 h-4" />}>
              Thông tin cơ bản
            </TabTrigger>
            <TabTrigger
              value="variants"
              icon={<Sliders className="w-4 h-4" />}
              badge={
                <span className="text-[10px] bg-brand-red/10 text-brand-red px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {variants.length}
                </span>
              }
            >
              Kích cỡ / Biến thể
            </TabTrigger>
            <TabTrigger
              value="options"
              icon={<Sparkles className="w-4 h-4" />}
              badge={
                <span className="text-[10px] bg-brand-red/10 text-brand-red px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {optionGroups.length}
                </span>
              }
            >
              Tuỳ chọn & Topping
            </TabTrigger>
            <TabTrigger
              value="images"
              icon={<ImageIcon className="w-4 h-4" />}
              badge={
                <span className="text-[10px] bg-brand-red/10 text-brand-red px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {images.length}
                </span>
              }
            >
              Bộ sưu tập ảnh
            </TabTrigger>
            <TabTrigger value="tags" icon={<TagIcon className="w-4 h-4" />}>
              Gắn thẻ & Phân loại
            </TabTrigger>
            <TabTrigger
              value="ingredients"
              icon={<Leaf className="w-4 h-4" />}
              badge={
                <span className="ml-1 rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-700">
                  {selectedIngredients.length}
                </span>
              }
            >
              Nguyên liệu
            </TabTrigger>
          </TabList>

          <TabContent value="basic">
            <DishFormBasic
              formData={formData}
              categories={categories}
              onChange={handleFieldChange}
            />
          </TabContent>

          <TabContent value="variants">
            <DishVariantsEditor
              variants={variants}
              basePrice={Number(formData.base_price || 0)}
              onChange={setVariants}
            />
          </TabContent>

          <TabContent value="options">
            <DishOptionsEditor
              optionGroups={optionGroups}
              onChange={setOptionGroups}
            />
          </TabContent>

          <TabContent value="images">
            <DishImageUploader
              images={images}
              primaryImageUrl={formData.image_url}
              onChangeImages={(newImgs) => {
                setImages(newImgs);
                const prim = newImgs.find((x) => x.is_primary) || newImgs[0];
                if (prim?.image_url) {
                  handleFieldChange("image_url", prim.image_url);
                } else if (newImgs.length === 0) {
                  handleFieldChange("image_url", "");
                }
              }}
              onSetPrimaryUrl={(url) => handleFieldChange("image_url", url)}
            />
          </TabContent>

          <TabContent value="tags">
            <DishTagsEditor
              availableTags={availableTags}
              selectedTagIds={selectedTagIds}
              onChangeTagIds={setSelectedTagIds}
            />
          </TabContent>

          <TabContent value="ingredients">
            <DishIngredientsEditor
              availableIngredients={availableIngredients}
              selectedIngredients={selectedIngredients}
              status={ingredientDataStatus}
              onChange={setSelectedIngredients}
              onChangeStatus={setIngredientDataStatus}
              onCreateIngredient={async (data) => {
                const created = await adminCatalogApi.createIngredient(data);
                setAvailableIngredients((current) => [...current, created]);
                return created;
              }}
            />
          </TabContent>
        </Tabs>
      </div>
    </>
  );
}

