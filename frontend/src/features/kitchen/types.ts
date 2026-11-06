export interface KitchenOrderItem {
  id: string;
  order_code: string;
  dish_name: string;
  variant_name?: string;
  quantity: number;
  notes?: string;
  status: "QUEUED" | "COOKING" | "READY";
  prep_time_minutes: number;
  created_at: string;
}

