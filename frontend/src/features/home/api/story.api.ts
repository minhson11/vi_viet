import { httpClient } from "@/lib/http/client";
import { CategoryStoryShowcase } from "../types";

export const storyApi = {
  // 1. Lấy danh sách phân cảnh hiển thị cho Trang chủ Storefront (Public)
  async getPublicStorySections(): Promise<CategoryStoryShowcase[]> {
    try {
      const res = await httpClient.get<any>("/story/sections");
      const list = Array.isArray(res) ? res : res?.data || res?.items || [];
      return list;
    } catch (err) {
      console.warn("Lỗi khi tải story sections từ backend:", err);
      return [];
    }
  },

  // 2. Lấy danh sách toàn bộ phân cảnh cho Quản trị viên (Admin)
  async getAdminStorySections(): Promise<CategoryStoryShowcase[]> {
    try {
      const res = await httpClient.get<any>("/admin/story/sections");
      const list = Array.isArray(res) ? res : res?.data || res?.items || [];
      return list;
    } catch (err) {
      console.warn("Lỗi khi tải admin story sections:", err);
      return [];
    }
  },

  // 3. Tạo mới một phân cảnh câu chuyện danh mục
  async createStorySection(
    data: Partial<CategoryStoryShowcase>
  ): Promise<CategoryStoryShowcase | null> {
    try {
      const { id, ...createPayload } = data;
      const payload = id && id.startsWith("story-cat-") ? createPayload : data;
      return await httpClient.post<CategoryStoryShowcase>(
        "/admin/story/sections",
        payload
      );
    } catch (err) {
      console.error("Lỗi khi tạo story section:", err);
      return null;
    }
  },

  // 4. Cập nhật phân cảnh câu chuyện danh mục
  async updateStorySection(
    id: string,
    data: Partial<CategoryStoryShowcase>
  ): Promise<CategoryStoryShowcase | null> {
    try {
      return await httpClient.put<CategoryStoryShowcase>(
        `/admin/story/sections/${id}`,
        data
      );
    } catch (err) {
      console.error(`Lỗi khi cập nhật story section #${id}:`, err);
      return null;
    }
  },

  // 5. Bật / Tắt trạng thái hiển thị
  async toggleActive(
    id: string
  ): Promise<{ id: string; isActive: boolean } | null> {
    try {
      return await httpClient.patch<any>(`/admin/story/sections/${id}/toggle`);
    } catch (err) {
      console.error(`Lỗi khi bật/tắt story section #${id}:`, err);
      return null;
    }
  },

  // 6. Cập nhật thứ tự sắp xếp
  async reorder(
    items: Array<{ id: string; sort_order: number }>
  ): Promise<boolean> {
    try {
      await httpClient.post("/admin/story/sections/reorder", { items });
      return true;
    } catch (err) {
      console.error("Lỗi khi sắp xếp thứ tự story sections:", err);
      return false;
    }
  },

  // 7. Xóa một phân cảnh câu chuyện
  async deleteStorySection(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/admin/story/sections/${id}`);
      return true;
    } catch (err) {
      console.error(`Lỗi khi xóa story section #${id}:`, err);
      return false;
    }
  },

  // 8. Khôi phục về kịch bản Michelin mặc định trên TiDB Database
  async resetToDefaults(): Promise<CategoryStoryShowcase[]> {
    try {
      const res = await httpClient.post<any>(
        "/admin/story/sections/seed-defaults"
      );
      return Array.isArray(res) ? res : res?.data || [];
    } catch (err) {
      console.error("Lỗi khi khôi phục mặc định story sections:", err);
      return [];
    }
  },
};

