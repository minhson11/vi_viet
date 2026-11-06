import { httpClient } from "@/lib/http/client";

export interface CheckoutPayload {
  checkout_key: string;
  fulfillment_type: "DELIVERY" | "PICKUP";
  payment_method: "COD" | "VNPAY";
  recipient_name: string;
  recipient_phone: string;
  delivery_address?: string;
  delivery_note?: string;
  customer_note?: string;
  coupon_code?: string;
}

export interface OrderItemOption {
  id?: string;
  group_name: string;
  option_name: string;
  extra_price?: number;
  price_adjustment?: number;
}

export interface OrderItem {
  id: string;
  dish_name: string;
  variant_name?: string;
  quantity: number;
  unit_price?: number;
  base_price?: number;
  subtotal?: number;
  line_total?: number;
  note?: string;
  options?: OrderItemOption[];
}

export interface OrderEvent {
  id: string;
  event_type: string;
  from_status?: string | null;
  to_status: string;
  note?: string | null;
  actor_user_id?: string | null;
  created_at: string;
}

export interface OrderRefund {
  id: string;
  refund_reference: string;
  amount: number;
  reason: string;
  status: "REQUESTED" | "PROCESSING" | "SUCCEEDED" | "FAILED" | string;
  provider_refund_id?: string | null;
  refunded_at?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  status:
    | "PENDING_PAYMENT"
    | "PENDING_CONFIRMATION"
    | "CONFIRMED"
    | "PREPARING"
    | "READY"
    | "DELIVERING"
    | "COMPLETED"
    | "CANCELLED"
    | "DELIVERY_FAILED"
    | "PENDING"
    | string;
  payment_method: "COD" | "VNPAY" | string;
  payment_status:
    | "UNPAID"
    | "PROCESSING"
    | "PAID"
    | "REFUND_PENDING"
    | "PARTIALLY_REFUNDED"
    | "REFUNDED"
    | "FAILED"
    | "EXPIRED"
    | string;
  fulfillment_type: "DELIVERY" | "PICKUP" | string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address?: string | null;
  delivery_note?: string | null;
  customer_note?: string | null;
  subtotal: number;
  food_discount?: number;
  discount_amount?: number;
  delivery_fee?: number;
  shipping_fee?: number;
  shipping_discount?: number;
  total_amount: number;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
  payment_deadline?: string | null;
  created_at: string;
  items?: OrderItem[];
  events?: OrderEvent[];
  refunds?: OrderRefund[];
}

export const ordersApi = {
  async checkout(payload: CheckoutPayload): Promise<Order> {
    return httpClient.post<Order>("/orders/checkout", payload);
  },

  async getMyOrders(params?: Record<string, any>): Promise<{ items: Order[]; total: number }> {
    try {
      const res = await httpClient.get<any>("/orders", { params });
      const items = Array.isArray(res) ? res : res?.items || res?.data || [];
      const total = typeof res?.total === "number" ? res.total : items.length;
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async getOrderDetail(orderIdOrCode: string): Promise<Order | null> {
    try {
      return await httpClient.get<Order>(`/orders/${orderIdOrCode}`);
    } catch {
      return null;
    }
  },

  async cancelMyOrder(
    orderId: string,
    dtoOrReason?:
      | string
      | {
          reason?: string;
          bank_name?: string;
          bank_account_number?: string;
          bank_account_name?: string;
        }
  ): Promise<Order> {
    const payload =
      typeof dtoOrReason === "string" ? { reason: dtoOrReason } : dtoOrReason || {};
    return httpClient.post<Order>(`/orders/${orderId}/cancel`, payload);
  },

  async createPaymentAttempt(
    orderId: string,
    provider: "VNPAY" | "COD" = "VNPAY"
  ): Promise<{ redirectUrl?: string; payment_url?: string; status: string }> {
    return httpClient.post<{ redirectUrl?: string; payment_url?: string; status: string }>(
      `/orders/${orderId}/payment-attempts`,
      { provider }
    );
  },

  async adminFindAll(params?: Record<string, any>): Promise<{ items: Order[]; total: number }> {
    try {
      const res = await httpClient.get<any>("/admin/orders", { params });
      const items = Array.isArray(res) ? res : res?.items || res?.data || [];
      const total = typeof res?.total === "number" ? res.total : items.length;
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async adminFindOne(orderId: string): Promise<Order | null> {
    try {
      return await httpClient.get<Order>(`/admin/orders/${orderId}`);
    } catch {
      return null;
    }
  },

  async adminUpdateStatus(
    orderId: string,
    dto: { status: string; note?: string; cancel_reason?: string }
  ): Promise<Order> {
    return httpClient.patch<Order>(`/admin/orders/${orderId}/status`, dto);
  },
};
