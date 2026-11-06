export interface PaymentTransaction {
  id: string;
  order_id: string;
  amount: number;
  provider: "VNPAY" | "COD";
  transaction_no?: string;
  bank_code?: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  paid_at?: string;
}

