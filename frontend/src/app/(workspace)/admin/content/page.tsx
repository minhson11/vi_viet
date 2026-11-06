"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/layout/admin-header";
import {
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Layers,
  CheckCircle2,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { storyCategoriesService } from "@/features/home/services/story-categories.service";
import { storyApi } from "@/features/home/api/story.api";
import { CategoryStoryShowcase, SatelliteDish } from "@/features/home/types";
import { adminCatalogApi } from "@/features/admin-catalog/api/admin-catalog.api";
import { Category, Dish } from "@/features/admin-catalog/types";
import { formatVND } from "@/lib/utils/currency";

export default function AdminContentPage() {
  const [categories, setCategories] = useState<CategoryStoryShowcase[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbDishes, setDbDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryStoryShowcase | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tải dữ liệu thực tế từ TiDB Cloud Database
  const loadData = async () => {
    try {
      const [remoteSections, catRes, dishRes] = await Promise.all([
        storyApi.getAdminStorySections().catch(() => []),
        adminCatalogApi.getCategories().catch(() => []),
        adminCatalogApi.getDishes({ limit: 100 }).catch(() => []),
      ]);
      const sectionList = Array.isArray(remoteSections) ? remoteSections : [];
      setCategories(sectionList);
      setDbCategories(Array.isArray(catRes) ? catRes : []);
      const dishList = Array.isArray(dishRes) ? dishRes : dishRes.data || [];
      setDbDishes(dishList);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu trang quản lý story:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Danh sách các món ăn thuộc danh mục đang được chọn
  const dishesInSelectedCategory = useMemo(() => {
    if (!selectedCategory) return [];
    const catId = String(selectedCategory.categoryId || "").trim();
    const catSlug = String(selectedCategory.categorySlug || "").trim();
    return dbDishes.filter((d) => {
      const dishCatId = String(d.category_id || "").trim();
      const dishCatObjId = String(d.category?.id || "").trim();
      const dishCatSlug = String(d.category?.slug || "").trim();
      return (
        (catId && (dishCatId === catId || dishCatObjId === catId)) ||
        (catSlug && dishCatSlug === catSlug)
      );
    });
  }, [dbDishes, selectedCategory?.categoryId, selectedCategory?.categorySlug]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lưu cấu hình toàn diện vào Database TiDB Cloud và LocalStorage
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // 1. Lưu đồng bộ từng phân cảnh danh mục lên Backend
      const updatedCategories = [...categories];
      for (let i = 0; i < updatedCategories.length; i++) {
        const cat = updatedCategories[i];
        if (cat.id && !cat.id.startsWith("story-cat-")) {
          await storyApi.updateStorySection(cat.id, cat);
        } else {
          const { id: _tmpId, ...createData } = cat;
          const created = await storyApi.createStorySection(createData);
          if (created && created.id) {
            cat.id = created.id;
            updatedCategories[i] = { ...cat, id: created.id };
          }
        }
      }

      setCategories(updatedCategories);
      if (selectedCategory) {
        const updatedSelected = updatedCategories.find(
          (c) =>
            c.id === selectedCategory.id ||
            (selectedCategory.id.startsWith("story-cat-") &&
              c.categorySlug === selectedCategory.categorySlug)
        );
        if (updatedSelected) {
          setSelectedCategory(updatedSelected);
        }
      }

      // 2. Lưu LocalStorage & dispatch event
      storyCategoriesService.saveStoryCategories(updatedCategories);

      // 3. Sắp xếp lại thứ tự sort_order cho các phân cảnh đã có ID hợp lệ
      const validOrderItems = updatedCategories
        .filter((c) => c.id && !c.id.startsWith("story-cat-"))
        .map((c, idx) => ({
          id: c.id,
          sort_order: idx + 1,
        }));

      if (validOrderItems.length > 0) {
        await storyApi.reorder(validOrderItems);
      }

      showToast("Đã lưu cấu hình và đồng bộ thành công vào cơ sở dữ liệu!");
    } catch (err) {
      console.error("Lỗi khi lưu lên backend:", err);
      showToast("Đã lưu vào bộ nhớ cục bộ (Sẵn sàng đồng bộ lại khi có kết nối).");
    } finally {
      setIsSaving(false);
    }
  };

  // Bật/tắt hiển thị
  const handleToggleActive = async (id: string) => {
    const updated = categories.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    setCategories(updated);
    storyCategoriesService.saveStoryCategories(updated);

    if (!id.startsWith("story-cat-")) {
      await storyApi.toggleActive(id);
    }
    showToast("Đã cập nhật trạng thái hiển thị danh mục!");
  };

  // Di chuyển thứ tự
  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === categories.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const reordered = [...categories];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    // Cập nhật lại sortOrder
    const finalItems = reordered.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    setCategories(finalItems);
    storyCategoriesService.saveStoryCategories(finalItems);

    const orderPayload = finalItems.map((c, i) => ({ id: c.id, sort_order: i + 1 }));
    await storyApi.reorder(orderPayload);
  };

  // Xóa một danh mục khỏi showcase
  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa phân cảnh danh mục này?")) {
      const filtered = categories.filter((c) => c.id !== id);
      setCategories(filtered);
      storyCategoriesService.saveStoryCategories(filtered);
      if (selectedCategory?.id === id) {
        setIsEditing(false);
        setSelectedCategory(null);
      }

      if (!id.startsWith("story-cat-")) {
        await storyApi.deleteStorySection(id);
      }
      showToast("Đã xóa phân cảnh danh mục khỏi Storytelling.");
    }
  };

  // Thêm mới một danh mục showcase
  const handleAddNew = () => {
    const newId = `story-cat-${Date.now()}`;
    // Ưu tiên chọn danh mục có món ăn trong CSDL
    const catWithDishes = dbCategories.find((c) =>
      dbDishes.some(
        (d) =>
          String(d.category_id) === String(c.id) ||
          String(d.category?.id) === String(c.id) ||
          d.category?.slug === c.slug
      )
    );
    const chosenCat = catWithDishes || dbCategories[0];
    const catId = chosenCat ? String(chosenCat.id) : "1";
    const catSlug = chosenCat?.slug || "mon-moi";
    const catName = chosenCat?.name || "Danh Mục Mới";

    const dishesInCat = dbDishes.filter(
      (d) =>
        String(d.category_id) === catId ||
        String(d.category?.id) === catId ||
        d.category?.slug === catSlug
    );
    const chosenDish = dishesInCat[0] || dbDishes[0];

    const newCat: CategoryStoryShowcase = {
      id: newId,
      categoryId: catId,
      categorySlug: catSlug,
      categoryName: catName,
      badgeTag: "Signature Tasting · Mỹ Vị Tuyển Chọn",
      headlineTitle: catName !== "Danh Mục Mới" ? catName : "Ẩm Thực Ba Miền",
      headlineHighlight: "Bếp Lửa Truyền Thống",
      description:
        "Mô tả tinh tế về phong vị đặc trưng của danh mục, nguồn gốc nguyên liệu di sản và phương pháp nấu chậm lưu giữ trọn vẹn tinh hoa ẩm thực quê nhà.",
      themeColor: "primary",
      animationType: "roll",
      badgeTop: "Nóng Hổi Vừa Ra Lò",
      badgeBottom: "⚡ Giao Nhanh 30 Phút",
      flavors: {
        top: "Hương nồng thơm nhẹ đặc trưng",
        heart: "Ngọt đượm tinh hoa nguyên liệu sạch",
        base: "Hậu vị lưu luyến khó phai",
      },
      mainDish: chosenDish
        ? {
            id: chosenDish.id,
            name: chosenDish.name,
            price: chosenDish.base_price,
            image: chosenDish.image_url || "",
          }
        : {
            id: "",
            name: "",
            price: 0,
            image: "",
          },
      satelliteDishes: [],
      isActive: true,
      sortOrder: categories.length + 1,
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    setSelectedCategory(newCat);
    setIsEditing(true);
    storyCategoriesService.saveStoryCategories(updated);
    showToast("Đã tạo phân cảnh danh mục mới! Mời bạn chỉnh sửa chi tiết.");
  };

  // Cập nhật thông tin danh mục đang chỉnh sửa
  const handleUpdateCurrentCategory = (
    updater: (prev: CategoryStoryShowcase) => CategoryStoryShowcase
  ) => {
    if (!selectedCategory) return;
    const updatedCat = updater(selectedCategory);
    setSelectedCategory(updatedCat);

    const updatedList = categories.map((c) =>
      c.id === updatedCat.id ? updatedCat : c
    );
    setCategories(updatedList);
  };

  return (
    <>
      <AdminHeader
        title="Quản lý Storytelling & Danh Mục Nổi Bật (SCR-30)"
        subtitle="Cấu hình danh mục câu chuyện trang chủ, hiệu ứng cuộn physics đĩa tròn và ảnh vệ tinh mini"
        action={
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Xem Trang Chủ</span>
              </Button>
            </Link>
            <Button
              onClick={() => {
                loadData();
                showToast("Đã tải lại danh mục và món ăn mới nhất từ CSDL!");
              }}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-ink-muted hover:text-ink cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tải Lại Dữ Liệu</span>
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              size="sm"
              className="gap-1.5 text-xs bg-brand-red text-white hover:bg-brand-red/90 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Đang Lưu CSDL..." : "Lưu Kịch Bản Storytelling"}</span>
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Banner hướng dẫn tính năng */}
        <div className="bg-gradient-to-r from-turmeric-light via-cream to-surface border border-turmeric/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-turmeric text-ink flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                Hệ Thống Showcase Danh Mục Di Sản Trang Chủ
              </h2>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Mỗi phân cảnh đại diện cho một <strong>Danh Mục Thực Đơn</strong>.
                Quanh đĩa lớn trung tâm là các <strong>ảnh vệ tinh nhỏ</strong>{" "}
                đại diện cho các món ăn trong danh mục. Nút hành động dẫn trực
                tiếp sang trang thực đơn lọc riêng danh mục đó.
              </p>
            </div>
          </div>
          <Button
            onClick={handleAddNew}
            size="sm"
            className="gap-1.5 text-xs bg-ink text-white hover:bg-ink/90 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Danh Mục Story Mới</span>
          </Button>
        </div>

        {/* Lưới danh sách các danh mục Storytelling */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cột trái (4 cột): Danh sách danh mục */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-red" />
                <span>Danh Mục Đang Cấu Hình ({categories.length})</span>
              </h3>
              <span className="text-[11px] text-ink-light">
                Kéo hoặc bấm ↑↓ để đổi thứ tự
              </span>
            </div>

            <div className="space-y-3">
              {categories.length === 0 ? (
                <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center space-y-3">
                  <Layers className="w-8 h-8 mx-auto text-ink-muted/40" />
                  <p className="text-xs font-semibold text-ink">
                    Chưa có phân cảnh danh mục nào
                  </p>
                  <p className="text-[11px] text-ink-muted max-w-xs mx-auto">
                    Bấm nút bên dưới để tạo phân cảnh đầu tiên kết nối với danh mục món ăn thực tế.
                  </p>
                  <Button
                    onClick={handleAddNew}
                    size="sm"
                    className="gap-1.5 text-xs bg-brand-red text-white hover:bg-brand-red/90 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo Phân Cảnh Mới</span>
                  </Button>
                </div>
              ) : (
                categories.map((cat, idx) => {
                const isSelected = selectedCategory?.id === cat.id && isEditing;
                return (
                  <div
                    key={cat.id}
                    className={`border rounded-2xl p-4 transition-all duration-200 relative bg-surface ${
                      isSelected
                        ? "border-brand-red shadow-md ring-2 ring-brand-red/10"
                        : "border-border hover:border-brand-red/40 hover:shadow-xs"
                    } ${!cat.isActive ? "opacity-60 bg-surface-hover/50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Ảnh đĩa thu nhỏ */}
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-turmeric shrink-0 relative bg-cream shadow-xs flex items-center justify-center">
                          {(() => {
                            const imgSrc = typeof cat.mainDish.image === "string" ? cat.mainDish.image : (cat.mainDish.image as any)?.asset_path || (cat.mainDish.image as any)?.image_url;
                            return imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={cat.mainDish.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">🍲</span>
                            );
                          })()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-brand-red">
                              #{idx + 1}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                cat.themeColor === "primary"
                                  ? "bg-red-50 text-red-700"
                                  : cat.themeColor === "secondary"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {cat.animationType.toUpperCase()}
                            </span>
                            {!cat.isActive && (
                              <span className="text-[9px] bg-ink-light text-white px-1.5 py-0.5 rounded font-bold">
                                ẨN
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-ink truncate mt-0.5">
                            {cat.headlineTitle}
                          </h4>
                          <p className="text-xs text-ink-muted truncate">
                            Liên kết:{" "}
                            <span className="font-semibold text-brand-red">
                              {cat.categoryName}
                            </span>{" "}
                            ({cat.satelliteDishes?.length || 0} món vệ tinh)
                          </p>
                        </div>
                      </div>

                      {/* Hành động nhanh */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, "up")}
                            disabled={idx === 0}
                            title="Di chuyển lên"
                            className="p-1 text-ink-muted hover:text-ink disabled:opacity-30 cursor-pointer"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, "down")}
                            disabled={idx === categories.length - 1}
                            title="Di chuyển xuống"
                            className="p-1 text-ink-muted hover:text-ink disabled:opacity-30 cursor-pointer"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(cat.id)}
                            title={
                              cat.isActive
                                ? "Bấm để ẩn khỏi trang chủ"
                                : "Bấm để hiển thị trên trang chủ"
                            }
                            className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                              cat.isActive
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-ink-light hover:bg-surface-hover"
                            }`}
                          >
                            {cat.isActive ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsEditing(true);
                            }}
                            title="Chỉnh sửa chi tiết"
                            className="p-1.5 rounded-lg text-brand-red hover:bg-red-50 text-xs cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            title="Xóa phân cảnh này"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* Cột phải (7 cột): Form biên tập chi tiết danh mục được chọn */}
          <div className="lg:col-span-7">
            {isEditing && selectedCategory ? (
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-brand-red" />
                    <div>
                      <h3 className="font-bold text-base text-ink">
                        Chỉnh Sửa Danh Mục Storytelling
                      </h3>
                      <p className="text-xs text-ink-muted">
                        ID: {selectedCategory.id} · Danh mục menu:{" "}
                        {selectedCategory.categoryName}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveAll}
                    size="sm"
                    className="gap-1.5 text-xs bg-brand-red text-white hover:bg-brand-red/90 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Thay Đổi</span>
                  </Button>
                </div>

                {/* Phần 1: Liên kết danh mục trong thực đơn */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                    <span>1. Thông Tin &amp; Danh Mục Liên Kết</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Chọn danh mục trong Menu hệ thống
                      </label>
                      <select
                        value={selectedCategory.categoryId}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = dbCategories.find(
                            (c) => String(c.id) === String(val) || c.slug === val
                          );
                          const newCatId = found ? String(found.id) : val;
                          const newCatSlug = found?.slug || "";
                          const newCatName = found?.name || "";

                          // Tìm các món thuộc danh mục mới
                          const matching = dbDishes.filter((d) => {
                            const dishCatId = String(d.category_id || "");
                            const dishCatObjId = String(d.category?.id || "");
                            const dishCatSlug = String(d.category?.slug || "");
                            return (
                              (newCatId && (dishCatId === newCatId || dishCatObjId === newCatId)) ||
                              (newCatSlug && dishCatSlug === newCatSlug)
                            );
                          });

                          handleUpdateCurrentCategory((prev) => {
                            const currentMainDishId = prev.mainDish?.id;
                            const isCurrentDishInNewCat =
                              currentMainDishId &&
                              matching.some((d) => String(d.id) === String(currentMainDishId));
                            const firstDish = matching[0];

                            return {
                              ...prev,
                              categoryId: newCatId,
                              categorySlug: newCatSlug || prev.categorySlug,
                              categoryName: newCatName || prev.categoryName,
                              headlineTitle:
                                !prev.headlineTitle ||
                                prev.headlineTitle === "Ẩm Thực Ba Miền" ||
                                dbCategories.some((c) => c.name === prev.headlineTitle)
                                  ? newCatName
                                  : prev.headlineTitle,
                              mainDish: (!isCurrentDishInNewCat && firstDish)
                                ? {
                                    id: firstDish.id,
                                    name: firstDish.name,
                                    price: firstDish.base_price,
                                    image: firstDish.image_url || prev.mainDish.image,
                                  }
                                : prev.mainDish,
                            };
                          });
                        }}
                        className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none"
                      >
                        {dbCategories.map((dbCat) => {
                          const count = dbDishes.filter(
                            (d) =>
                              String(d.category_id) === String(dbCat.id) ||
                              String(d.category?.id) === String(dbCat.id) ||
                              d.category?.slug === dbCat.slug
                          ).length;
                          return (
                            <option key={dbCat.id} value={dbCat.id}>
                              {dbCat.name} ({count} món trong thực đơn)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Huy hiệu trên badge nhỏ
                      </label>
                      <input
                        type="text"
                        value={selectedCategory.badgeTag}
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            badgeTag: e.target.value,
                          }))
                        }
                        placeholder="VD: Signature Tasting · Nước Dùng Di Sản"
                        className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Tiêu đề chính (Headline Title)
                      </label>
                      <input
                        type="text"
                        value={selectedCategory.headlineTitle}
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            headlineTitle: e.target.value,
                          }))
                        }
                        placeholder="VD: Món Nước & Nước Dùng"
                        className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Đoạn nhấn mạnh nghệ thuật (Highlight Italic)
                      </label>
                      <input
                        type="text"
                        value={selectedCategory.headlineHighlight}
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            headlineHighlight: e.target.value,
                          }))
                        }
                        placeholder="VD: Hầm Khói Trầm 48 Giờ"
                        className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none text-brand-red font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Mô tả câu chuyện di sản
                    </label>
                    <textarea
                      rows={3}
                      value={selectedCategory.description}
                      onChange={(e) =>
                        handleUpdateCurrentCategory((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Phần 2: Hiệu ứng Physics & Phong cách */}
                <div className="space-y-4 pt-3 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                    <span>2. Hiệu Ứng Cuộn Physics &amp; Phong Cách Màu</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Kiểu chuyển động Physics (Scroll Animation)
                      </label>
                      <select
                        value={selectedCategory.animationType}
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            animationType: e.target.value as any,
                          }))
                        }
                        className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none"
                      >
                        <option value="roll">
                          Lăn xoay 360° &amp; Ngọn lửa ấm (Roll + Steam)
                        </option>
                        <option value="3dflip">
                          Lật không gian 3D &amp; Gió biển sương mai (3D Flip)
                        </option>
                        <option value="spiral">
                          Phóng to xoắn ốc &amp; Hổ phách mật ong (Spiral Bloom)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Bộ màu chủ đạo (Theme Color)
                      </label>
                      <select
                        value={selectedCategory.themeColor}
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            themeColor: e.target.value as any,
                          }))
                        }
                        className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none"
                      >
                        <option value="primary">Đỏ Son Cung Đình (Primary #b72e24)</option>
                        <option value="secondary">Xanh Ngọc Bích (Secondary #4a654b)</option>
                        <option value="gold">Vàng Hổ Phách (Amber Gold #d97706)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Huy hiệu trên đĩa lớn (Top Badge)
                      </label>
                      <input
                        type="text"
                        value={selectedCategory.badgeTop}
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            badgeTop: e.target.value,
                          }))
                        }
                        placeholder="VD: Thố Sứ Nóng 88°C"
                        className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Huy hiệu dưới đĩa lớn (Bottom Badge)
                      </label>
                      <input
                        type="text"
                        value={selectedCategory.badgeBottom}
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            badgeBottom: e.target.value,
                          }))
                        }
                        placeholder="VD: ⚡ Giao Nhanh 30 Phút"
                        className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Phần 3: Món ăn chủ đạo trên đĩa lớn */}
                <div className="space-y-4 pt-3 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-brand-red" />
                    <span>3. Món Ăn Chủ Đạo Trên Đĩa Lớn (Center Platter)</span>
                  </h4>

                  {/* Dropdown chọn trực tiếp từ danh sách các món ăn trong CSDL */}
                  <div className="bg-turmeric-light/30 border border-turmeric/40 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink flex items-center gap-1.5 text-brand-red">
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        <span>Chọn món chính từ Thực Đơn ({dbDishes.length} món trong hệ thống)</span>
                      </label>
                      {selectedCategory.mainDish.id && (
                        <span className="text-[10px] text-ink-muted font-mono bg-surface px-2 py-0.5 rounded border border-border">
                          ID: {selectedCategory.mainDish.id}
                        </span>
                      )}
                    </div>

                    {/* Thông báo tình trạng món ăn của danh mục đang chọn */}
                    {dishesInSelectedCategory.length > 0 ? (
                      <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Tìm thấy <strong>{dishesInSelectedCategory.length} món ăn</strong> thuộc danh mục &quot;<strong>{selectedCategory.categoryName}</strong>&quot;.
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded">
                          Khuyên dùng
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">⚠️</span>
                          <span>
                            Danh mục &quot;<strong>{selectedCategory.categoryName}</strong>&quot; hiện chưa có món ăn nào trong thực đơn. Bạn có thể chọn món từ danh mục khác hoặc vào trang Thực đơn để thêm món.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Danh sách nút chọn nhanh các món thuộc danh mục đã chọn */}
                    {dishesInSelectedCategory.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-ink-muted flex items-center gap-1">
                          <span>Bấm để chọn nhanh món thuộc danh mục này:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {dishesInSelectedCategory.map((d) => {
                            const isCurrent = String(selectedCategory.mainDish.id) === String(d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  handleUpdateCurrentCategory((prev) => ({
                                    ...prev,
                                    mainDish: {
                                      ...prev.mainDish,
                                      id: d.id,
                                      name: d.name,
                                      price: d.base_price,
                                      image: d.image_url || prev.mainDish.image,
                                    },
                                  }));
                                }}
                                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isCurrent
                                    ? "bg-brand-red text-white shadow-xs font-bold ring-2 ring-brand-red/30"
                                    : "bg-surface border border-border text-ink hover:border-brand-red/50 hover:bg-brand-red/5"
                                }`}
                              >
                                <span>{d.name}</span>
                                <span className={isCurrent ? "text-white/80 text-[10px]" : "text-brand-red text-[10px]"}>
                                  ({formatVND(d.base_price)})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dropdown danh sách món ăn đầy đủ */}
                    <select
                      value={selectedCategory.mainDish.id || ""}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const dish = dbDishes.find((d) => String(d.id) === String(selectedId));
                        if (dish) {
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            mainDish: {
                              ...prev.mainDish,
                              id: dish.id,
                              name: dish.name,
                              price: dish.base_price,
                              image: dish.image_url || prev.mainDish.image,
                            },
                          }));
                        }
                      }}
                      className="w-full text-xs p-2.5 bg-surface border-2 border-brand-red/40 focus:border-brand-red rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:outline-none font-semibold text-ink cursor-pointer shadow-xs"
                    >
                      <option value="">
                        -- Bấm vào đây để chọn món ăn từ thực đơn --
                      </option>

                      {/* Nhóm ưu tiên: Món thuộc danh mục đang chọn */}
                      {dishesInSelectedCategory.length > 0 && (
                        <optgroup label={`⭐ CÁC MÓN THUỘC DANH MỤC "${selectedCategory.categoryName.toUpperCase()}" (${dishesInSelectedCategory.length} món)`}>
                          {dishesInSelectedCategory.map((d) => (
                            <option key={d.id} value={d.id}>
                              ⭐ {d.name} · {formatVND(d.base_price)}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* Các danh mục khác */}
                      {dbCategories
                        .filter((c) => String(c.id) !== String(selectedCategory.categoryId) && c.slug !== selectedCategory.categorySlug)
                        .map((c) => {
                          const inCat = dbDishes.filter(
                            (d) =>
                              String(d.category_id) === String(c.id) ||
                              String(d.category?.id) === String(c.id) ||
                              d.category?.slug === c.slug
                          );
                          if (inCat.length === 0) return null;
                          return (
                            <optgroup key={c.id} label={`📂 Danh mục: ${c.name}`}>
                              {inCat.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name} · {formatVND(d.base_price)}
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      <optgroup label="📋 Tất cả các món ăn trong hệ thống">
                        {dbDishes.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} · {formatVND(d.base_price)}
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    {/* Preview thẻ món đã chọn */}
                    {selectedCategory.mainDish.id && (
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-turmeric/20">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-red/40 shrink-0 bg-cream flex items-center justify-center">
                            {(() => {
                              const imgSrc = typeof selectedCategory.mainDish.image === "string" ? selectedCategory.mainDish.image : (selectedCategory.mainDish.image as any)?.asset_path || (selectedCategory.mainDish.image as any)?.image_url;
                              return imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={selectedCategory.mainDish.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px]">🍲</span>
                              );
                            })()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-ink truncate">
                              {selectedCategory.mainDish.name}
                            </p>
                            <p className="text-[11px] text-brand-red font-semibold">
                              {selectedCategory.mainDish.price
                                ? formatVND(selectedCategory.mainDish.price)
                                : "Chưa có giá"}
                            </p>
                          </div>
                        </div>

                        {/* Nút khôi phục thông tin từ món ăn trong DB */}
                        {dbDishes.some((d) => String(d.id) === String(selectedCategory.mainDish.id)) && (
                          <button
                            type="button"
                            onClick={() => {
                              const d = dbDishes.find((item) => String(item.id) === String(selectedCategory.mainDish.id));
                              if (d) {
                                handleUpdateCurrentCategory((prev) => ({
                                  ...prev,
                                  mainDish: {
                                    ...prev.mainDish,
                                    name: d.name,
                                    price: d.base_price,
                                    image: d.image_url || prev.mainDish.image,
                                  },
                                }));
                              }
                            }}
                            className="text-[11px] text-ink-muted hover:text-brand-red underline cursor-pointer shrink-0"
                          >
                            Đồng bộ lại tên &amp; ảnh gốc
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Tên món chính hiển thị trên Story
                      </label>
                      <input
                        type="text"
                        value={selectedCategory.mainDish.name}
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            mainDish: {
                              ...prev.mainDish,
                              name: e.target.value,
                            },
                          }))
                        }
                        className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Huy hiệu đặc trưng món
                      </label>
                      <input
                        type="text"
                        value={selectedCategory.badgeTop || ""}
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            badgeTop: e.target.value,
                          }))
                        }
                        placeholder="VD: Thố Sứ Nóng 88°C"
                        className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Link ảnh món chính
                    </label>
                    <input
                      type="text"
                      value={selectedCategory.mainDish.image}
                      onChange={(e) =>
                        handleUpdateCurrentCategory((prev) => ({
                          ...prev,
                          mainDish: {
                            ...prev.mainDish,
                            image: e.target.value,
                          },
                        }))
                      }
                      className="w-full text-xs p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-red focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Phần 4: Các món nhỏ vệ tinh bay quanh đĩa lớn */}
                <div className="space-y-4 pt-3 border-t border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                      <span>
                        4. Các Món Vệ Tinh Nhỏ Bay Quanh Đĩa Lớn (Orbiting Dishes)
                      </span>
                    </h4>

                    <div className="flex items-center gap-2">
                      {/* Chọn nhanh món từ thực đơn để thêm vào vệ tinh */}
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const dishId = e.target.value;
                          if (!dishId) return;
                          const dish = dbDishes.find((d) => String(d.id) === String(dishId));
                          if (dish) {
                            const newSat: SatelliteDish = {
                              id: dish.id,
                              name: dish.name,
                              price: dish.base_price,
                              image:
                                dish.image_url ||
                                "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
                              badge: dish.category?.name || "Đặc Sản",
                              tagline:
                                dish.description?.slice(0, 45) ||
                                "Món ăn truyền thống",
                            };
                            handleUpdateCurrentCategory((prev) => ({
                              ...prev,
                              satelliteDishes: [
                                ...(prev.satelliteDishes || []),
                                newSat,
                              ],
                            }));
                          }
                          e.target.value = "";
                        }}
                        className="text-xs p-1.5 bg-surface border border-brand-red/40 focus:border-brand-red rounded-lg font-medium cursor-pointer"
                      >
                        <option value="">
                          ➕ Thêm món từ thực đơn vào vệ tinh...
                        </option>

                        {/* Ưu tiên các món trong danh mục đang chọn */}
                        {dishesInSelectedCategory.length > 0 && (
                          <optgroup label={`⭐ MÓN THUỘC DANH MỤC "${selectedCategory.categoryName.toUpperCase()}" (${dishesInSelectedCategory.length} món)`}>
                            {dishesInSelectedCategory.map((d) => (
                              <option key={d.id} value={d.id}>
                                ⭐ {d.name} ({formatVND(d.base_price)})
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {dbCategories
                          .filter((c) => String(c.id) !== String(selectedCategory.categoryId) && c.slug !== selectedCategory.categorySlug)
                          .map((cat) => {
                            const inCat = dbDishes.filter(
                              (d) =>
                                String(d.category_id) === String(cat.id) ||
                                String(d.category?.id) === String(cat.id) ||
                                d.category?.slug === cat.slug
                            );
                            if (inCat.length === 0) return null;
                            return (
                              <optgroup key={cat.id} label={cat.name}>
                                {inCat.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} ({formatVND(d.base_price)})
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                        <optgroup label="Tất cả các món trong hệ thống">
                          {dbDishes.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({formatVND(d.base_price)})
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      <Button
                        onClick={() => {
                          const newSat: SatelliteDish = {
                            id: `sat-${Date.now()}`,
                            name: "Món mới thêm",
                            price: 0,
                            image:
                              "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
                            badge: "Đặc Sản",
                            tagline: "Hương vị quê nhà",
                          };
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            satelliteDishes: [
                              ...(prev.satelliteDishes || []),
                              newSat,
                            ],
                          }));
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm thủ công</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedCategory.satelliteDishes?.map((sat, sIdx) => (
                      <div
                        key={sat.id}
                        className="border border-border rounded-xl p-3 bg-surface-hover/30 flex items-start sm:items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gold shrink-0 bg-cream flex items-center justify-center">
                          {(() => {
                            const imgSrc = typeof sat.image === "string" ? sat.image : (sat.image as any)?.asset_path || (sat.image as any)?.image_url;
                            return imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={sat.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">🍲</span>
                            );
                          })()}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Dropdown đổi món từ thực đơn */}
                            <div>
                              <select
                                value={sat.id}
                                onChange={(e) => {
                                  const dishId = e.target.value;
                                  const dish = dbDishes.find((d) => d.id === dishId);
                                  if (dish) {
                                    handleUpdateCurrentCategory((prev) => ({
                                      ...prev,
                                      satelliteDishes: prev.satelliteDishes.map((d, idx) =>
                                        idx === sIdx
                                          ? {
                                              ...d,
                                              id: dish.id,
                                              name: dish.name,
                                              price: dish.base_price,
                                              image: dish.image_url || d.image,
                                              badge: dish.category?.name || d.badge || "Đặc Sản",
                                              tagline:
                                                dish.description?.slice(0, 45) ||
                                                d.tagline ||
                                                "Món ăn truyền thống",
                                            }
                                          : d
                                      ),
                                    }));
                                  }
                                }}
                                className="w-full text-xs p-1.5 bg-surface border border-brand-red/30 focus:border-brand-red rounded-lg font-semibold text-ink"
                              >
                                <option value={sat.id}>
                                  Đang chọn: {sat.name} {sat.price ? `(${formatVND(sat.price)})` : ""}
                                </option>
                                <optgroup label="Chọn đổi sang món khác trong thực đơn:">
                                  {dbDishes.map((d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.name} · {formatVND(d.base_price)}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>

                            <input
                              type="text"
                              value={sat.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateCurrentCategory((prev) => ({
                                  ...prev,
                                  satelliteDishes: prev.satelliteDishes.map(
                                    (d, idx) =>
                                      idx === sIdx ? { ...d, name: val } : d
                                  ),
                                }));
                              }}
                              placeholder="Tên món hiển thị"
                              className="text-xs p-1.5 bg-surface border border-border rounded-lg font-semibold"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={sat.tagline || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateCurrentCategory((prev) => ({
                                  ...prev,
                                  satelliteDishes: prev.satelliteDishes.map(
                                    (d, idx) =>
                                      idx === sIdx ? { ...d, tagline: val } : d
                                  ),
                                }));
                              }}
                              placeholder="Đặc trưng (VD: Sa tế cố đô)"
                              className="text-xs p-1.5 bg-surface border border-border rounded-lg"
                            />
                            <input
                              type="text"
                              value={sat.image}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateCurrentCategory((prev) => ({
                                  ...prev,
                                  satelliteDishes: prev.satelliteDishes.map(
                                    (d, idx) =>
                                      idx === sIdx ? { ...d, image: val } : d
                                  ),
                                }));
                              }}
                              placeholder="Link ảnh"
                              className="text-xs p-1.5 bg-surface border border-border rounded-lg font-mono text-[10px]"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateCurrentCategory((prev) => ({
                              ...prev,
                              satelliteDishes: prev.satelliteDishes.filter(
                                (_, idx) => idx !== sIdx
                              ),
                            }));
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0 mt-1"
                          title="Xóa món vệ tinh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phần 5: Cấu trúc 3 tầng hương vị */}
                <div className="space-y-4 pt-3 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                    <span>5. Cấu Trúc 3 Tầng Hương Vị (Flavor Profile)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-turmeric mb-1">
                        Hương Đầu (Top)
                      </label>
                      <input
                        type="text"
                        value={
                          typeof selectedCategory.flavors?.top === 'object'
                            ? (selectedCategory.flavors.top as any)?.note || ''
                            : selectedCategory.flavors?.top || ''
                        }
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            flavors: { ...prev.flavors, top: e.target.value },
                          }))
                        }
                        className="w-full text-xs p-2 bg-surface border border-border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-brand-red mb-1">
                        Hương Giữa (Heart)
                      </label>
                      <input
                        type="text"
                        value={
                          typeof selectedCategory.flavors?.heart === 'object'
                            ? (selectedCategory.flavors.heart as any)?.note || ''
                            : selectedCategory.flavors?.heart || ''
                        }
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            flavors: {
                              ...prev.flavors,
                              heart: e.target.value,
                            },
                          }))
                        }
                        className="w-full text-xs p-2 bg-surface border border-border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                        Hậu Vị (Base)
                      </label>
                      <input
                        type="text"
                        value={
                          typeof selectedCategory.flavors?.base === 'object'
                            ? (selectedCategory.flavors.base as any)?.note || ''
                            : selectedCategory.flavors?.base || ''
                        }
                        onChange={(e) =>
                          handleUpdateCurrentCategory((prev) => ({
                            ...prev,
                            flavors: { ...prev.flavors, base: e.target.value },
                          }))
                        }
                        className="w-full text-xs p-2 bg-surface border border-border rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Nút lưu cuối form */}
                <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                  <Button
                    onClick={handleSaveAll}
                    className="gap-2 bg-brand-red text-white hover:bg-brand-red/90 cursor-pointer text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lưu Cấu Hình Này</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center text-ink-muted space-y-3">
                <Layers className="w-10 h-10 mx-auto text-ink-light opacity-50" />
                <h4 className="font-bold text-sm text-ink">
                  Chưa chọn danh mục nào để chỉnh sửa
                </h4>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  Hãy bấm vào nút sửa (icon bút chì) ở danh sách bên trái hoặc
                  bấm &quot;Thêm Danh Mục Story Mới&quot; để biên tập kịch bản câu chuyện ẩm thực.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast thông báo lưu */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1917] text-white text-xs px-5 py-3 rounded-full shadow-2xl border border-turmeric/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-turmeric animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
