import { httpClient } from "@/lib/http/client";

export interface ReviewItem {
  id: string;
  order_item_id?: string;
  dish_id?: string;
  dish_name?: string;
  variant_name?: string;
  user_id?: string;
  user_name?: string;
  author_display_name?: string;
  rating: number;
  content?: string;
  comment?: string;
  images?: string[];
  visibility: "VISIBLE" | "HIDDEN" | "FLAGGED" | string;
  status?: string;
  reply?: string;
  replied_at?: string;
  created_at: string;
}

export const reviewsApi = {
  async submitReview(
    orderItemId: string,
    dto: {
      rating: number;
      content?: string;
      images?: string[];
    }
  ): Promise<ReviewItem> {
    return httpClient.put<ReviewItem>(`/order-items/${orderItemId}/review`, dto);
  },

  async uploadReviewImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return httpClient.post<{ url: string }>("/upload/review-image", formData);
  },

  async getAdminReviews(params?: {
    visibility?: string;
    dish_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ReviewItem[]; total: number }> {
    try {
      const res = await httpClient.get<any>("/admin/reviews", { params });
      const items = Array.isArray(res) ? res : res?.items || res?.data || [];
      const total = typeof res?.total === "number" ? res.total : items.length;
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async moderateReview(
    reviewId: string,
    dto: {
      visibility?: "VISIBLE" | "HIDDEN" | "FLAGGED";
      reply?: string;
      moderationReason?: string;
    }
  ): Promise<ReviewItem> {
    return httpClient.patch<ReviewItem>(`/admin/reviews/${reviewId}`, dto);
  },

  async getDishReviews(dishId: string, page = 1, limit = 20): Promise<{ items: ReviewItem[]; total: number }> {
    try {
      const res = await httpClient.get<any>(`/dishes/${dishId}/reviews`, {
        params: { page, limit },
      });
      const items = Array.isArray(res) ? res : res?.items || res?.data || [];
      const total = typeof res?.total === "number" ? res.total : items.length;
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },
};
