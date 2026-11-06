export interface Review {
  id: string;
  order_id: string;
  customer_name: string;
  rating: number;
  comment?: string | null;
  images?: string[];
  is_verified_purchase: boolean;
  is_visible: boolean;
  created_at: string;
}

