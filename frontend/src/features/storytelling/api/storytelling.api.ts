import { httpClient } from "@/lib/http/client";
import { StoryScene } from "../types";

export const storytellingApi = {
  async getScenes(): Promise<StoryScene[]> {
    try {
      const res = await httpClient.get<any[]>("/story/sections");
      if (!Array.isArray(res) || res.length === 0) {
        return [];
      }
      return res.map((s: any, idx: number) => ({
        id: s.id?.toString() || `scene-${idx + 1}`,
        order: s.sortOrder ?? idx + 1,
        title: s.headlineTitle || s.categoryName || "Di Sản Ẩm Thực",
        subtitle: s.badgeTag || s.headlineHighlight || "",
        description: s.description || "",
        dishName: s.mainDish?.name || s.categoryName || "",
        region: (s.categorySlug?.includes("bac") ? "Bac" : s.categorySlug?.includes("nam") ? "Nam" : "Trung") as "Bac" | "Trung" | "Nam",
        backgroundAsset: s.mainDish?.image || "/images/story-pho.jpg",
      }));
    } catch {
      return [];
    }
  },
};
