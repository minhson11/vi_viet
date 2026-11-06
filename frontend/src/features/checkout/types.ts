export interface CheckoutPayload {
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  notes?: string;
  payment_method: "COD" | "VNPAY";
  coupon_code?: string;
}

export interface CheckoutResult {
  order_id: string;
  order_code: string;
  payment_url?: string;
}

