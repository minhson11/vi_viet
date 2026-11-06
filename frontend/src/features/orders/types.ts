export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  dish_name: string;
  variant_name?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  notes?: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total_amount: number;
  payment_status: "PENDING" | "PAID" | "REFUNDED" | "FAILED";
  items: OrderItem[];
  created_at: string;
}

