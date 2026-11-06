import { CategoryStoryShowcase } from "../types";
import { storyApi } from "../api/story.api";

export const storyCategoriesService = {
  // Lấy danh sách rỗng ban đầu, chờ API nạp trực tiếp từ cơ sở dữ liệu
  getStoryCategories(): CategoryStoryShowcase[] {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("viviet_story_categories_config");
      } catch {
        // ignore
      }
    }
    return [];
  },

  // Tải trực tiếp 100% từ Database qua Backend API
  async fetchStoryCategories(): Promise<CategoryStoryShowcase[]> {
    try {
      const remote = await storyApi.getPublicStorySections();
      if (Array.isArray(remote)) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("viviet_story_categories_updated", {
              detail: remote,
            })
          );
        }
        return remote;
      }
    } catch (e) {
      console.warn("Không thể tải story categories từ Backend API:", e);
    }
    return [];
  },

  // Dispatch event khi có cập nhật
  saveStoryCategories(categories: CategoryStoryShowcase[]): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("viviet_story_categories_updated", {
        detail: categories,
      })
    );
  },

  // Khôi phục rỗng
  resetStoryCategories(): CategoryStoryShowcase[] {
    return [];
  },
};
