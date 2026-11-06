export interface Promotion {
  id: string;
  code: string;
  discount_type: "PERCENT" | "FIXED_AMOUNT" | "FREESHIP";
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_amount?: number | null;
  usage_limit?: number | null;
  used_count: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

