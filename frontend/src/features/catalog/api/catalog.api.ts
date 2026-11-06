import { httpClient } from "@/lib/http/client";
import { CatalogCategory, CatalogDish } from "../types";
import { Dish } from "@/features/admin-catalog/types";
import { mapBackendDish } from "@/features/admin-catalog/api/admin-catalog.api";

export const catalogApi = {
  async getCategories(): Promise<CatalogCategory[]> {
    try {
      const res = await httpClient.get<any>("/menu/categories");
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      return list.map((c: any) => ({
        id: c.id ? c.id.toString() : "",
        name: c.name,
        slug: c.slug,
        description: c.description || null,
        image_url: c.image_url || null,
        sort_order: c.sort_order || 0,
      }));
    } catch {
      return [];
    }
  },

  async getDishes(params?: Record<string, any>): Promise<CatalogDish[]> {
    try {
      const res = await httpClient.get<any>("/menu/dishes", { params });
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      return list.map((d: any) => ({
        id: d.id ? d.id.toString() : "",
        category_id: d.category_id ? d.category_id.toString() : "",
        category: d.category || d.categories
          ? {
              id: (d.category?.id || d.categories?.id || "").toString(),
              name: d.category?.name || d.categories?.name || "",
              slug: d.category?.slug || d.categories?.slug || "",
              sort_order: 0,
            }
          : undefined,
        name: d.name,
        slug: d.slug,
        description: d.description || null,
        base_price: Number(d.starting_price ?? d.base_price ?? d.dish_variants?.[0]?.price ?? 0),
        image_url:
          typeof d.cover_image === "object" && d.cover_image?.asset_path
            ? d.cover_image.asset_path
            : typeof d.cover_image === "string"
            ? d.cover_image
            : d.image_url || null,
        is_active: d.availability === "AVAILABLE",
        is_featured: Boolean(d.is_featured),
        spicy_level: Number(d.spicy_level || 0),
        prep_time_minutes: d.prep_time_minutes || null,
      }));
    } catch {
      return [];
    }
  },

  async getDishBySlug(slug: string): Promise<CatalogDish | null> {
    try {
      const d = await httpClient.get<any>(`/menu/dishes/${slug}`);
      if (!d) return null;
      return {
        id: d.id ? d.id.toString() : "",
        category_id: d.category_id ? d.category_id.toString() : "",
        category: d.category || d.categories
          ? {
              id: (d.category?.id || d.categories?.id || "").toString(),
              name: d.category?.name || d.categories?.name || "",
              slug: d.category?.slug || d.categories?.slug || "",
              sort_order: 0,
            }
          : undefined,
        name: d.name,
        slug: d.slug,
        description: d.description || null,
        base_price: Number(d.starting_price ?? d.base_price ?? d.dish_variants?.[0]?.price ?? 0),
        image_url:
          typeof d.cover_image === "object" && d.cover_image?.asset_path
            ? d.cover_image.asset_path
            : typeof d.cover_image === "string"
            ? d.cover_image
            : d.image_url || null,
        is_active: d.availability === "AVAILABLE",
        is_featured: Boolean(d.is_featured),
        spicy_level: Number(d.spicy_level || 0),
        prep_time_minutes: d.prep_time_minutes || null,
      };
    } catch {
      return null;
    }
  },

  /**
   * Lấy chi tiết món ăn công khai đầy đủ (variants, option_groups, images, story)
   * Không cần quyền Admin, hoạt động cho mọi khách hàng storefront.
   */
  async getDishDetail(slugOrId: string): Promise<Dish | null> {
    try {
      const res = await httpClient.get<any>(`/menu/dishes/${encodeURIComponent(slugOrId)}`);
      const payload = res?.data !== undefined ? res.data : res;
      if (payload && (payload.id || payload.name)) {
        return mapBackendDish(payload);
      }
    } catch (err) {
      console.warn("Direct slug lookup failed, trying list search fallback:", err);
    }

    // Fallback: Tìm kiếm trong danh sách món công khai nếu slug có ký tự đặc biệt hoặc dùng ID
    try {
      const res = await httpClient.get<any>("/menu/dishes", { params: { limit: 100 } });
      const payload = res?.data?.items || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.items || []);
      const matched = payload.find((d: any) => d.slug === slugOrId || d.id?.toString() === slugOrId);
      if (matched) {
        // Gọi lại bằng slug chuẩn hoặc id
        try {
          const detailRes = await httpClient.get<any>(`/menu/dishes/${encodeURIComponent(matched.slug || matched.id)}`);
          const detailItem = detailRes?.data !== undefined ? detailRes.data : detailRes;
          return mapBackendDish(detailItem || matched);
        } catch {
          return mapBackendDish(matched);
        }
      }
    } catch (err2) {
      console.error("Failed to load dish detail fallback:", err2);
    }

    return null;
  },
};
