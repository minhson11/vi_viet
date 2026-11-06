import { Order } from "../orders/types";

export interface StaffOrderFilters {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export type StaffOrderSummary = Order;

