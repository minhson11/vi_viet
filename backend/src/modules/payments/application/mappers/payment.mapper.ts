export interface SerializedRefund {
  id: string;
  payment_id: string;
  refund_reference: string;
  provider_refund_id: string | null;
  amount: number;
  reason: string;
  status: string;
  requested_by: string;
  refunded_at: Date | null;
  created_at: Date;
  updated_at: Date;
  payment?: {
    id: string;
    merchant_reference: string;
    amount: number;
    order_id: string;
  };
}

export interface SerializedPayment {
  id: string;
  order_id: string;
  provider: string;
  merchant_reference: string;
  provider_transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  paid_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  order?: {
    id: string;
    order_code: string;
    status: string;
    payment_status: string;
    total_amount: number;
  };
  refunds?: Array<{
    id: string;
    refund_reference: string;
    provider_refund_id: string | null;
    amount: number;
    reason: string;
    status: string;
    refunded_at: Date | null;
    created_at: Date;
  }>;
}

export class PaymentMapper {
  static toSerializedPayment(p: any): SerializedPayment {
    return {
      id: p.id.toString(),
      order_id: p.order_id.toString(),
      provider: p.provider,
      merchant_reference: p.merchant_reference,
      provider_transaction_id: p.provider_transaction_id,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      paid_at: p.paid_at,
      expires_at: p.expires_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
      order: p.orders
        ? {
            id: p.orders.id.toString(),
            order_code: p.orders.order_code,
            status: p.orders.status,
            payment_status: p.orders.payment_status,
            total_amount: Number(p.orders.total_amount),
          }
        : undefined,
      refunds: p.refunds
        ? p.refunds.map((r: any) => ({
            id: r.id.toString(),
            refund_reference: r.refund_reference,
            provider_refund_id: r.provider_refund_id,
            amount: Number(r.amount),
            reason: r.reason,
            status: r.status,
            refunded_at: r.refunded_at,
            created_at: r.created_at,
          }))
        : undefined,
    };
  }

  static toSerializedRefund(r: any): SerializedRefund {
    return {
      id: r.id.toString(),
      payment_id: r.payment_id.toString(),
      refund_reference: r.refund_reference,
      provider_refund_id: r.provider_refund_id,
      amount: Number(r.amount),
      reason: r.reason,
      status: r.status,
      requested_by: r.requested_by.toString(),
      refunded_at: r.refunded_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      payment: r.payments
        ? {
            id: r.payments.id.toString(),
            merchant_reference: r.payments.merchant_reference,
            amount: Number(r.payments.amount),
            order_id: r.payments.order_id.toString(),
          }
        : undefined,
    };
  }
}
