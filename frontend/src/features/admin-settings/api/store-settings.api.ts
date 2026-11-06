import { httpClient } from "@/lib/http/client";

export interface StoreSettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  opening_hours: Record<string, any>;
  delivery_rules: Record<string, any>;
  accepting_orders: boolean;
  payment_timeout_minutes: number;
}

export const storeSettingsApi = {
  async getSettings(): Promise<StoreSettings | null> {
    try {
      return await httpClient.get<StoreSettings>("/admin/store");
    } catch {
      return null;
    }
  },

  async updateSettings(dto: Partial<StoreSettings>): Promise<StoreSettings> {
    return httpClient.put<StoreSettings>("/admin/store", dto);
  },

  async getPublicSettings(): Promise<StoreSettings | null> {
    try {
      return await httpClient.get<StoreSettings>("/store");
    } catch {
      return null;
    }
  },
};
