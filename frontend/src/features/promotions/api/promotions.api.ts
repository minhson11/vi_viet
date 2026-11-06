import { httpClient } from "@/lib/http/client";

export interface CouponItem {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discount_type: "PERCENT" | "FIXED" | "FREE_SHIPPING" | "PERCENTAGE" | "FIXED_AMOUNT" | string;
  discount_value: number;
  min_subtotal?: number;
  min_order_amount?: number;
  max_discount?: number | null;
  max_discount_amount?: number | null;
  redemptions_count?: number;
  used_count?: number;
  total_limit?: number | null;
  usage_limit?: number | null;
  per_user_limit?: number;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
  expires_at?: string;
  created_at?: string;
}

export interface CreateCouponInput {
  code: string;
  name: string;
  discount_type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  discount_value: number;
  min_subtotal?: number;
  max_discount?: number;
  starts_at: string;
  ends_at: string;
  total_limit?: number;
  per_user_limit?: number;
  is_active?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discount_amount: number;
  discount_type: string;
  message?: string;
}

export const promotionsApi = {
  async getAdminCoupons(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: CouponItem[]; total: number }> {
    try {
      const res = await httpClient.get<any>("/admin/coupons", { params });
      const items = Array.isArray(res) ? res : res?.items || res?.data || [];
      const total = typeof res?.total === "number" ? res.total : items.length;
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async createCoupon(data: CreateCouponInput): Promise<CouponItem> {
    return httpClient.post<CouponItem>("/admin/coupons", data);
  },

  async updateCoupon(id: string, data: Partial<CreateCouponInput>): Promise<CouponItem> {
    return httpClient.put<CouponItem>(`/admin/coupons/${id}`, data);
  },

  async toggleCouponStatus(id: string, is_active: boolean): Promise<CouponItem> {
    return httpClient.patch<CouponItem>(`/admin/coupons/${id}/status`, { is_active });
  },

  async validateCoupon(code: string, subtotal: number, shipping_fee: number = 0): Promise<CouponValidationResult> {
    try {
      const res = await httpClient.post<any>("/coupons/validate", {
        code,
        subtotal,
        shipping_fee,
      });
      return {
        valid: true,
        code,
        discount_amount: Number(res.discount_amount || res.discount || 0),
        discount_type: res.discount_type || "FIXED_AMOUNT",
        message: res.message,
      };
    } catch (err: any) {
      return {
        valid: false,
        code,
        discount_amount: 0,
        discount_type: "NONE",
        message: err.message || "Mã giảm giá không hợp lệ",
      };
    }
  },
};
