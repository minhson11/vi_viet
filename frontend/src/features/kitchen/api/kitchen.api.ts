import { httpClient } from "@/lib/http/client";

export interface KitchenQueueItem {
  id: string;
  order_code: string;
  status: "CONFIRMED" | "PREPARING" | "READY";
  fulfillment_type: string;
  customer_note?: string;
  created_at: string;
  items: Array<{
    dish_name: string;
    variant_name?: string;
    quantity: number;
    note?: string;
    options?: Array<{
      group_name: string;
      option_name: string;
    }>;
  }>;
}

export const kitchenApi = {
  async getKitchenQueue(): Promise<KitchenQueueItem[]> {
    try {
      const res = await httpClient.get<KitchenQueueItem[]>("/kitchen/queue");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async startCooking(orderId: string): Promise<any> {
    return httpClient.post(`/kitchen/orders/${orderId}/start`);
  },

  async finishCooking(orderId: string): Promise<any> {
    return httpClient.post(`/kitchen/orders/${orderId}/finish`);
  },
};
