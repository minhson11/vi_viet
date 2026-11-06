import { httpClient } from "@/lib/http/client";
import {
  Category,
  Dish,
  DishFilters,
  DishImage,
  DishIngredientInput,
  Ingredient,
  IngredientDataStatus,
  MenuImportPreview,
  MenuImportResult,
  PaginatedDishes,
  Tag,
} from "../types";

interface BackendIngredient {
  id: string | number | bigint;
  name: string;
  code: string;
  is_allergen: boolean;
  note?: string | null;
}

type BackendDishIngredient = Partial<BackendIngredient> & {
  ingredient_id?: string | number | bigint;
  ingredients?: BackendIngredient;
};

function mapIngredient(item: BackendIngredient): Ingredient {
  return {
    id: item.id.toString(),
    name: item.name,
    code: item.code,
    is_allergen: Boolean(item.is_allergen),
  };
}

export function mapBackendDish(item: any): Dish {
  const basePrice = item.starting_price !== undefined
    ? Number(item.starting_price)
    : item.dish_variants?.[0]?.price !== undefined
    ? Number(item.dish_variants[0].price)
    : Number(item.base_price || 0);

  let coverImage: string | null = null;
  if (typeof item.cover_image === "string" && item.cover_image.trim()) {
    coverImage = item.cover_image.trim();
  } else if (item.cover_image && typeof item.cover_image === "object") {
    coverImage = item.cover_image.asset_path || item.cover_image.image_url || null;
  }

  if (!coverImage) {
    if (typeof item.image_url === "string" && item.image_url.trim()) {
      coverImage = item.image_url.trim();
    } else if (Array.isArray(item.dish_images) && item.dish_images.length > 0) {
      const coverObj =
        item.dish_images.find((img: any) => img.kind === "COVER" || img.is_cover) ||
        item.dish_images[0];
      coverImage = coverObj?.asset_path || coverObj?.image_url || null;
    }
  }

  return {
    id: item.id ? item.id.toString() : "",
    category_id: item.category_id ? item.category_id.toString() : item.categories?.id?.toString() || "",
    category: item.categories
      ? {
          id: item.categories.id.toString(),
          name: item.categories.name,
          slug: item.categories.slug || "",
          sort_order: item.categories.sort_order || 0,
          is_active: true,
        }
      : item.category,
    name: item.name || "",
    slug: item.slug || "",
    description: item.description || null,
    story: item.story || null,
    base_price: basePrice,
    is_active: item.availability === "AVAILABLE" || item.is_active === true,
    is_featured: Boolean(item.is_featured),
    spicy_level: Number(item.spicy_level || 0),
    calories: item.calories || null,
    prep_time_minutes: item.prep_time_minutes || null,
    image_url: coverImage,
    sort_order: item.sort_order || 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
    images: (() => {
      const rawList = item.dish_images || item.images || [];
      if (rawList.length === 0 && item.image_url) {
        return [
          {
            id: `img-primary-default`,
            dish_id: item.id ? item.id.toString() : undefined,
            image_url: item.image_url,
            alt_text: item.name || "Ảnh đại diện món ăn",
            is_primary: true,
            sort_order: 1,
          },
        ];
      }
      const coverIdx = rawList.findIndex((img: any) => img.kind === "COVER" || Boolean(img.is_cover));
      const primaryIdx = coverIdx !== -1 ? coverIdx : 0;
      return rawList.map((img: any, idx: number) => ({
        id: img.id ? img.id.toString() : `img-${idx}`,
        dish_id: item.id ? item.id.toString() : undefined,
        image_url: typeof img === "string" ? img : img.asset_path || img.image_url || "",
        alt_text: img.alt_text || null,
        is_primary: rawList.length > 0 ? idx === primaryIdx : false,
        sort_order: img.sort_order || idx + 1,
      }));
    })(),
    variants: (item.dish_variants || item.variants || []).map((v: any, idx: number) => ({
      id: v.id ? v.id.toString() : `v-${idx}`,
      dish_id: item.id ? item.id.toString() : undefined,
      name: v.name,
      sku: v.sku || null,
      price_adjustment: Number(v.price !== undefined ? v.price - basePrice : v.price_adjustment || 0),
      is_available: v.is_active !== undefined ? Boolean(v.is_active) : Boolean(v.is_available ?? true),
      is_default: idx === 0,
      sort_order: v.sort_order || idx + 1,
    })),
    option_groups: (item.option_groups || []).map((g: any, gIdx: number) => ({
      id: g.id ? g.id.toString() : `og-${gIdx}`,
      dish_id: item.id ? item.id.toString() : undefined,
      name: g.name,
      is_required: Number(g.min_select || g.min_choices || 0) > 0,
      min_choices: Number(g.min_select || g.min_choices || 0),
      max_choices: Number(g.max_select || g.max_choices || 1),
      sort_order: g.sort_order || gIdx + 1,
      items: (g.option_values || g.options || g.items || []).map((ov: any, ovIdx: number) => ({
        id: ov.id ? ov.id.toString() : `ov-${ovIdx}`,
        group_id: g.id ? g.id.toString() : undefined,
        name: ov.name,
        price_adjustment: Number(ov.extra_price ?? ov.price_adjustment ?? 0),
        is_available: ov.is_active !== undefined ? Boolean(ov.is_active) : true,
        is_default: Boolean(ov.is_default),
        sort_order: ov.sort_order || ovIdx + 1,
      })),
    })),
    tags: (() => {
      if (Array.isArray(item.dish_tags)) {
        return item.dish_tags.map((dt: any) => {
          const t = dt.tags || dt.tag || dt;
          return {
            tag: {
              id: t.id ? t.id.toString() : "",
              name: t.name || "",
              slug: t.code || t.slug || "",
              color: t.color || null,
            },
          };
        });
      }
      if (Array.isArray(item.tags)) {
        return item.tags.map((t: any) => {
          if (t.tag) {
            return {
              tag: {
                id: t.tag.id ? t.tag.id.toString() : "",
                name: t.tag.name || "",
                slug: t.tag.code || t.tag.slug || "",
                color: t.tag.color || null,
              },
            };
          }
          return {
            tag: {
              id: t.id ? t.id.toString() : "",
              name: t.name || "",
              slug: t.code || t.slug || "",
              color: t.color || null,
            },
          };
        });
      }
      return [];
    })(),
    ingredient_data_status: item.ingredient_data_status || "UNKNOWN",
    ingredients: (item.dish_ingredients || item.ingredients || []).map((entry: BackendDishIngredient) => {
      const ingredient = entry.ingredients || entry;
      return {
        id: ingredient.id?.toString() || entry.ingredient_id?.toString() || "",
        name: ingredient.name || "",
        code: ingredient.code || "",
        is_allergen: Boolean(ingredient.is_allergen),
        note: entry.note ?? ingredient.note ?? null,
      };
    }),
  };
}

export const adminCatalogApi = {
  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const res = await httpClient.get<any>("/admin/menu/categories");
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      return list.map((c: any) => ({
        id: c.id ? c.id.toString() : "",
        name: c.name,
        slug: c.slug,
        description: c.description || null,
        image_url: c.image_url || null,
        sort_order: c.sort_order || 0,
        is_active: c.is_active ?? true,
        dish_count: c._count?.dishes ?? c.dish_count ?? 0,
      }));
    } catch {
      // Fallback sang public menu categories nếu chưa auth
      const publicRes = await httpClient.get<any>("/menu/categories");
      const list = Array.isArray(publicRes) ? publicRes : publicRes?.items || publicRes?.data || [];
      return list.map((c: any) => ({
        id: c.id ? c.id.toString() : "",
        name: c.name,
        slug: c.slug,
        description: c.description || null,
        image_url: c.image_url || null,
        sort_order: c.sort_order || 0,
        is_active: c.is_active ?? true,
        dish_count: c._count?.dishes ?? c.dish_count ?? 0,
      }));
    }
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    return httpClient.post<Category>("/admin/menu/categories", {
      name: data.name,
      slug: data.slug,
      description: data.description,
      sort_order: data.sort_order || 0,
      is_active: data.is_active ?? true,
    });
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return httpClient.put<Category>(`/admin/menu/categories/${id}`, {
      name: data.name,
      slug: data.slug,
      description: data.description,
      sort_order: data.sort_order || 0,
      is_active: data.is_active ?? true,
    });
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    return httpClient.delete<{ success: boolean }>(`/admin/menu/categories/${id}`);
  },

  // Dishes
  async getDishes(filters: DishFilters = {}): Promise<PaginatedDishes | Dish[]> {
    const params: Record<string, any> = {};
    if (filters.categoryId) params.category_id = filters.categoryId;
    if (filters.search) params.search = filters.search;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = Math.min(Number(filters.limit), 100);

    try {
      const res = await httpClient.get<any>("/admin/menu/dishes", { params });
      const rawList = Array.isArray(res) ? res : res?.items || res?.data || [];
      const mapped = rawList.map(mapBackendDish);

      if (res && res.pagination) {
        return {
          data: mapped,
          total: res.pagination.total,
          page: res.pagination.page,
          limit: res.pagination.limit,
          totalPages: res.pagination.totalPages,
        };
      }
      return mapped;
    } catch {
      // Fallback sang public menu dishes
      const res = await httpClient.get<any>("/menu/dishes", { params });
      const rawList = Array.isArray(res) ? res : res?.items || res?.data || [];
      const mapped = rawList.map(mapBackendDish);

      if (res && res.pagination) {
        return {
          data: mapped,
          total: res.pagination.total,
          page: res.pagination.page,
          limit: res.pagination.limit,
          totalPages: res.pagination.totalPages,
        };
      }
      return mapped;
    }
  },

  async getDishById(id: string): Promise<Dish> {
    try {
      const res = await httpClient.get<any>(`/admin/menu/dishes/${id}`);
      return mapBackendDish(res);
    } catch {
      const res = await httpClient.get<any>(`/menu/dishes/${id}`);
      return mapBackendDish(res);
    }
  },

  // Upload Image trực tiếp lên Cloudinary
  async uploadImage(file: File, folder: string = "dishes"): Promise<{ secure_url: string; url: string; public_id: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return httpClient.upload<any>(`/admin/upload/image?folder=${encodeURIComponent(folder)}`, formData);
  },

  // Đồng bộ toàn bộ danh sách hình ảnh món ăn (Sync Images: xóa ảnh cũ, thêm ảnh mới, cập nhật ảnh chính COVER duy nhất)
  async syncDishImages(dishId: string, images: DishImage[]): Promise<any> {
    const primaryImg = images.find((img) => img.is_primary) || images[0];
    const payload = {
      images: images.map((img, idx) => {
        const isCover = primaryImg ? img.image_url === primaryImg.image_url : idx === 0;
        return {
          id: img.id && !img.id.startsWith("img-") ? String(img.id) : undefined,
          asset_path: img.image_url || (img as any).asset_path,
          is_primary: isCover,
          kind: isCover ? "COVER" : "GALLERY",
          alt_text: img.alt_text || "Ảnh món ăn",
          sort_order: img.sort_order || idx + 1,
        };
      }),
    };
    return httpClient.put(`/admin/menu/dishes/${dishId}/images/sync`, payload);
  },

  async deleteDishImage(dishId: string, imageId: string): Promise<any> {
    return httpClient.delete(`/admin/menu/dishes/${dishId}/images/${imageId}`);
  },

  async setDishCoverImage(dishId: string, imageId: string): Promise<any> {
    return httpClient.patch(`/admin/menu/dishes/${dishId}/images/${imageId}/cover`, {});
  },

  async createDish(data: any): Promise<Dish> {
    const basePrice = Number(data.base_price || 50000);
    const variantsList = data.variants && data.variants.length > 0 ? data.variants : [{ name: "Khẩu phần tiêu chuẩn", price_adjustment: 0 }];
    const firstVariant = variantsList[0];
    const defaultVariantPrice = basePrice + Number(firstVariant.price_adjustment || 0);

    // 1. Tạo món ăn cơ bản với biến thể mặc định
    const payload = {
      category_id: String(data.category_id),
      name: data.name,
      slug: data.slug || undefined,
      description: data.description || undefined,
      spicy_level: Number(data.spicy_level || 0),
      ingredient_data_status: data.ingredient_data_status || "UNKNOWN",
      availability: data.is_active ? "AVAILABLE" : "HIDDEN",
      sort_order: Number(data.sort_order || 0),
      default_variant: {
        name: firstVariant.name || "Khẩu phần tiêu chuẩn",
        price: defaultVariantPrice,
      },
    };

    const created = await httpClient.post<any>("/admin/menu/dishes", payload);
    const dishId = created.id ? created.id.toString() : "";

    // 2. Tạo toàn bộ các biến thể bổ sung (variants thứ 2 trở đi)
    if (variantsList.length > 1 && dishId) {
      for (let i = 1; i < variantsList.length; i++) {
        const v = variantsList[i];
        try {
          await httpClient.post(`/admin/menu/dishes/${dishId}/variants`, {
            name: v.name,
            price: basePrice + Number(v.price_adjustment || 0),
            is_active: v.is_available !== false,
          });
        } catch (err) {
          console.warn("Failed to create variant:", v.name, err);
        }
      }
    }

    // 3. Tạo các nhóm tùy chọn (Option Groups) và lựa chọn con (Values)
    if (data.option_groups && data.option_groups.length > 0 && dishId) {
      for (const group of data.option_groups) {
        try {
          const createdGroup: any = await httpClient.post(`/admin/menu/dishes/${dishId}/option-groups`, {
            name: group.name,
            min_select: Number(group.min_choices || group.min_select || 0),
            max_select: Number(group.max_choices || group.max_select || 1),
            is_active: true,
          });

          const groupId = createdGroup?.id ? createdGroup.id.toString() : "";
          if (groupId && group.items && group.items.length > 0) {
            for (const item of group.items) {
              if (item.name) {
                try {
                  await httpClient.post(`/admin/menu/dishes/${dishId}/option-groups/${groupId}/values`, {
                    name: item.name,
                    extra_price: Number(item.price_adjustment || 0),
                    is_active: item.is_available !== false,
                  });
                } catch (e) {
                  console.warn("Failed to create option value:", item.name, e);
                }
              }
            }
          }
        } catch (err) {
          console.warn("Failed to create option group:", group.name, err);
        }
      }
    }

    // 4. Lưu toàn bộ danh sách hình ảnh món ăn
    const imagesToSave = [...(data.images || [])];
    if (data.image_url && !imagesToSave.some((img: any) => img.image_url === data.image_url)) {
      imagesToSave.unshift({
        image_url: data.image_url,
        is_primary: true,
        sort_order: 1,
      });
    }

    if (imagesToSave.length > 0 && dishId) {
      try {
        await this.syncDishImages(dishId, imagesToSave);
      } catch (e) {
        console.warn("Failed to sync images during createDish:", e);
      }
    }

    // 5. Gán tags cho món ăn
    if (data.tag_ids && data.tag_ids.length > 0 && dishId) {
      try {
        await httpClient.put(`/admin/menu/dishes/${dishId}/tags`, {
          tag_ids: data.tag_ids.map(String),
        });
      } catch (e) {
        console.warn("Failed to assign tags:", e);
      }
    }

    if (Array.isArray(data.ingredients) && dishId) {
      await this.assignDishIngredients(
        dishId,
        data.ingredients,
        data.ingredient_data_status || "UNKNOWN",
      );
    }

    return this.getDishById(dishId);
  },

  async updateDish(id: string, data: any): Promise<Dish> {
    const basePrice = Number(data.base_price || 50000);

    const payload: any = {
      category_id: data.category_id ? String(data.category_id) : undefined,
      name: data.name,
      slug: data.slug || undefined,
      description: data.description,
      spicy_level: Number(data.spicy_level || 0),
      ingredient_data_status: data.ingredient_data_status,
      availability: data.is_active ? "AVAILABLE" : "HIDDEN",
    };

    await httpClient.put<any>(`/admin/menu/dishes/${id}`, payload);

    // Cập nhật/thêm các biến thể mới
    if (data.variants && data.variants.length > 0) {
      for (const v of data.variants) {
        if (!v.id || v.id.startsWith("v-")) {
          try {
            await httpClient.post(`/admin/menu/dishes/${id}/variants`, {
              name: v.name,
              price: basePrice + Number(v.price_adjustment || 0),
              is_active: v.is_available !== false,
            });
          } catch (e) {
            console.warn("Failed to add new variant:", v.name, e);
          }
        } else {
          try {
            await httpClient.put(`/admin/menu/dishes/${id}/variants/${v.id}`, {
              name: v.name,
              price: basePrice + Number(v.price_adjustment || 0),
              is_active: v.is_available !== false,
            });
          } catch (e) {
            console.warn("Failed to update variant:", v.id, e);
          }
        }
      }
    }

    // Đồng bộ toàn diện hình ảnh món ăn: Xóa triệt để ảnh cũ đã loại bỏ, thêm ảnh mới và bảo đảm duy nhất 1 ảnh COVER
    if (data.images && Array.isArray(data.images)) {
      try {
        await this.syncDishImages(id, data.images);
      } catch (e) {
        console.warn("Failed to sync dish images during updateDish:", e);
      }

      // Cập nhật luôn ảnh đại diện chính của món ăn trong bảng dishes
      const primary = (data.images as DishImage[]).find((img: DishImage) => img.is_primary) || data.images[0];
      if (primary && primary.image_url) {
        try {
          await httpClient.patch(`/admin/menu/dishes/${id}`, {
            image_url: primary.image_url,
          });
        } catch (e) {
          console.warn("Failed to update cover image_url on dish:", e);
        }
      }
    }

    // Gán tags
    if (data.tag_ids && data.tag_ids.length > 0) {
      try {
        await httpClient.put(`/admin/menu/dishes/${id}/tags`, {
          tag_ids: data.tag_ids.map(String),
        });
      } catch (e) {
        console.warn("Failed to update tags:", e);
      }
    }

    if (Array.isArray(data.ingredients)) {
      try {
        await this.assignDishIngredients(
          id,
          data.ingredients,
          data.ingredient_data_status || "UNKNOWN",
        );
      } catch (e) {
        console.warn("Failed to assign dish ingredients:", e);
      }
    }

    return this.getDishById(id);
  },

  async deleteDish(id: string): Promise<{ success: boolean }> {
    return httpClient.delete<{ success: boolean }>(`/admin/menu/dishes/${id}`);
  },

  async toggleDishActive(id: string, is_active: boolean): Promise<Dish> {
    const availability = is_active ? "AVAILABLE" : "HIDDEN";
    const res = await httpClient.patch<any>(`/admin/menu/dishes/${id}/availability`, {
      availability,
    });
    return mapBackendDish(res);
  },

  downloadMenuImportTemplate(): Promise<Blob> {
    return httpClient.download("/admin/menu/import/template");
  },

  previewMenuImport(file: File): Promise<MenuImportPreview> {
    const formData = new FormData();
    formData.append("file", file);
    return httpClient.upload<MenuImportPreview>(
      "/admin/menu/import/preview",
      formData,
    );
  },

  importMenu(file: File): Promise<MenuImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    return httpClient.upload<MenuImportResult>("/admin/menu/import", formData);
  },

  async getIngredients(): Promise<Ingredient[]> {
    const res = await httpClient.get<
      BackendIngredient[] | { items?: BackendIngredient[]; data?: BackendIngredient[] }
    >("/menu/ingredients");
    const list = Array.isArray(res) ? res : res?.items || res?.data || [];
    return list.map(mapIngredient);
  },

  async createIngredient(data: {
    name: string;
    code?: string;
    is_allergen?: boolean;
  }): Promise<Ingredient> {
    const item = await httpClient.post<BackendIngredient>(
      "/admin/menu/ingredients",
      data,
    );
    return mapIngredient(item);
  },

  async updateIngredient(
    id: string,
    data: { name?: string; is_allergen?: boolean },
  ): Promise<Ingredient> {
    const item = await httpClient.patch<BackendIngredient>(
      `/admin/menu/ingredients/${id}`,
      data,
    );
    return mapIngredient(item);
  },

  async assignDishIngredients(
    dishId: string,
    ingredients: DishIngredientInput[],
    ingredientDataStatus: IngredientDataStatus,
  ): Promise<void> {
    const cleanIngredients = (ingredients || [])
      .filter((item) => item && item.ingredient_id && /^[1-9]\d*$/.test(String(item.ingredient_id)))
      .map((item) => ({
        ingredient_id: String(item.ingredient_id),
        ...(item.note && typeof item.note === "string" && item.note.trim()
          ? { note: item.note.trim().slice(0, 500) }
          : {}),
      }));

    const validStatus = ["UNKNOWN", "PARTIAL", "VERIFIED"].includes(ingredientDataStatus)
      ? ingredientDataStatus
      : "UNKNOWN";

    await httpClient.put(`/admin/menu/dishes/${dishId}/ingredients`, {
      ingredients: cleanIngredients,
      ingredient_data_status: validStatus,
    });
  },

  // Tags
  async getTags(): Promise<Tag[]> {
    try {
      const res = await httpClient.get<any>("/menu/tags");
      const list = Array.isArray(res) ? res : res?.items || [];
      return list.map((t: any) => ({
        id: t.id ? t.id.toString() : "",
        name: t.name,
        slug: t.code || t.slug,
        color: t.color || null,
      }));
    } catch {
      return [];
    }
  },
};
