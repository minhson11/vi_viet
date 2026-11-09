export interface SerializedOrderItemOption {
  id: string;
  option_value_id: string;
  group_name: string;
  option_name: string;
  extra_price: number;
}

export interface SerializedOrderItemReview {
  id: string;
  rating: number;
  content: string | null;
  images?: string[];
  reply: string | null;
  created_at: Date;
}

export interface SerializedOrderItem {
  id: string;
  dish_id: string;
  variant_id: string;
  dish_name: string;
  variant_name: string;
  base_price: number;
  options_price: number;
  quantity: number;
  line_total: number;
  note: string | null;
  options?: SerializedOrderItemOption[];
  review?: SerializedOrderItemReview | null;
}

export interface SerializedOrderEvent {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  actor_user_id: string | null;
  created_at: Date;
}

export interface SerializedOrderRefund {
  id: string;
  refund_reference: string;
  amount: number;
  reason: string;
  status: string;
  provider_refund_id: string | null;
  refunded_at: Date | null;
  created_at: Date;
}

export interface SerializedOrder {
  id: string;
  order_code: string;
  checkout_key: string;
  user_id: string;
  fulfillment_type: string;
  status: string;
  payment_method: string;
  payment_status: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string | null;
  delivery_note: string | null;
  customer_note: string | null;
  subtotal: number;
  food_discount: number;
  delivery_fee: number;
  shipping_discount: number;
  total_amount: number;
  coupon_id: string | null;
  coupon_snapshot: unknown;
  payment_deadline: Date | null;
  estimated_ready_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
  cancel_reason: string | null;
  created_at: Date;
  updated_at: Date;
  items?: SerializedOrderItem[];
  events?: SerializedOrderEvent[];
  refunds?: SerializedOrderRefund[];
}

export class OrderMapper {
  static toSerialized(o: any): SerializedOrder {
    return {
      id: o.id.toString(),
      order_code: o.order_code,
      checkout_key: o.checkout_key,
      user_id: o.user_id.toString(),
      fulfillment_type: o.fulfillment_type,
      status: o.status,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      recipient_name: o.recipient_name,
      recipient_phone: o.recipient_phone,
      delivery_address: o.delivery_address,
      delivery_note: o.delivery_note,
      customer_note: o.customer_note,
      subtotal: Number(o.subtotal),
      food_discount: Number(o.food_discount),
      delivery_fee: Number(o.delivery_fee),
      shipping_discount: Number(o.shipping_discount),
      total_amount: Number(o.total_amount),
      coupon_id: o.coupon_id ? o.coupon_id.toString() : null,
      coupon_snapshot: o.coupon_snapshot,
      payment_deadline: o.payment_deadline,
      estimated_ready_at: o.estimated_ready_at,
      completed_at: o.completed_at,
      cancelled_at: o.cancelled_at,
      cancel_reason: o.cancel_reason,
      created_at: o.created_at,
      updated_at: o.updated_at,
      items: o.order_items?.map((item: any) => ({
        id: item.id.toString(),
        dish_id: item.dish_id.toString(),
        variant_id: item.variant_id.toString(),
        dish_name: item.dish_name,
        variant_name: item.variant_name,
        base_price: Number(item.base_price),
        options_price: Number(item.options_price),
        quantity: item.quantity,
        line_total: Number(item.line_total),
        note: item.note,
        options: item.order_item_options?.map((opt: any) => ({
          id: opt.id.toString(),
          option_value_id: opt.option_value_id.toString(),
          group_name: opt.group_name,
          option_name: opt.option_name,
          extra_price: Number(opt.extra_price),
        })),
        review: item.reviews
          ? {
              id: item.reviews.id.toString(),
              rating: item.reviews.rating,
              content: item.reviews.content,
              images: Array.isArray(item.reviews.images) ? item.reviews.images : [],
              reply: item.reviews.reply || null,
              created_at: item.reviews.created_at,
            }
          : null,
      })),
      events: o.order_events?.map((ev: any) => ({
        id: ev.id.toString(),
        event_type: ev.event_type,
        from_status: ev.from_status,
        to_status: ev.to_status,
        note: ev.note,
        actor_user_id: ev.actor_user_id ? ev.actor_user_id.toString() : null,
        created_at: ev.created_at,
      })),
      refunds: (o.payments || [])
        .flatMap((p: any) => p.refunds || [])
        .map((rf: any) => ({
          id: rf.id.toString(),
          refund_reference: rf.refund_reference,
          amount: Number(rf.amount),
          reason: rf.reason,
          status: rf.status,
          provider_refund_id: rf.provider_refund_id || null,
          refunded_at: rf.refunded_at || null,
          created_at: rf.created_at,
        })),
    };
  }
}
