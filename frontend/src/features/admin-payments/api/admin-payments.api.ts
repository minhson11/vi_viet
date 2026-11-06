import { httpClient } from "@/lib/http/client";

export interface RefundItem {
  id: string;
  refund_reference: string;
  provider_refund_id?: string | null;
  amount: number;
  reason: string;
  status: "REQUESTED" | "PROCESSING" | "SUCCEEDED" | "FAILED" | string;
  refunded_at?: string | null;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  order?: {
    id: string;
    order_code: string;
    status: string;
    payment_status: string;
    total_amount: number;
  };
  order_code?: string;
  provider: string;
  gateway?: string;
  merchant_reference: string;
  provider_transaction_id?: string | null;
  transaction_ref?: string;
  amount: number;
  currency: string;
  status: "SUCCEEDED" | "SUCCESS" | "PENDING" | "FAILED" | "EXPIRED" | string;
  bank_code?: string;
  paid_at?: string;
  created_at: string;
  refunds?: RefundItem[];
}

export interface PaymentAttemptResponse {
  payment_id?: string;
  paymentId?: string;
  order_id?: string;
  payment_url?: string;
  redirectUrl?: string;
  merchantReference?: string;
  merchant_reference?: string;
  gateway?: string;
  status: string;
  amount?: number;
}

export const paymentsApi = {
  async getAdminPayments(params?: {
    status?: string;
    order_id?: string;
    merchant_reference?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: PaymentTransaction[]; total: number }> {
    try {
      const res = await httpClient.get<any>("/admin/payments", { params });
      const items = Array.isArray(res) ? res : res?.items || res?.data || [];
      const total = typeof res?.total === "number" ? res.total : items.length;
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async createPaymentAttempt(
    orderId: string,
    dto?: { provider?: "VNPAY" | "COD"; gateway?: string; bank_code?: string }
  ): Promise<PaymentAttemptResponse> {
    const provider =
      dto?.provider || (dto?.gateway === "COD" || dto?.gateway === "CASH" ? "COD" : "VNPAY");
    const payload: Record<string, any> = { provider };
    if (dto?.bank_code) payload.bank_code = dto.bank_code;

    return httpClient.post<PaymentAttemptResponse>(
      `/orders/${orderId}/payment-attempts`,
      payload
    );
  },

  async executeRefundCommand(
    refundId: string,
    dto: {
      type: "TRIGGER_VNPAY_REFUND" | "CONFIRM_MANUAL_SUCCESS" | "START_PROCESSING" | "MARK_FAILED";
      commandKey: string;
      reason?: string;
      providerReference?: string;
    }
  ): Promise<any> {
    return httpClient.post(`/admin/refunds/${refundId}/commands`, dto);
  },

  async createRefund(
    paymentId: string,
    dto: {
      amount: number;
      reason: string;
    }
  ): Promise<any> {
    return httpClient.post(`/admin/payments/${paymentId}/refunds`, dto);
  },
};
