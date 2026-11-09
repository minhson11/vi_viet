import { httpClient } from "@/lib/http/client";

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "ADMIN" | "OPERATOR" | "KITCHEN" | "CUSTOMER" | string;
  status: "ACTIVE" | "LOCKED" | "DEACTIVATED" | "SUSPENDED" | "BANNED" | string;
  created_at: string;
}

export interface AdminCreateUserInput {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role: "ADMIN" | "OPERATOR" | "KITCHEN" | "CUSTOMER";
}

export const adminUsersApi = {
  async getUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: AdminUserItem[]; total: number }> {
    try {
      const res = await httpClient.get<any>("/admin/users", { params });
      const items = Array.isArray(res) ? res : res?.items || res?.data || [];
      const total = typeof res?.total === "number" ? res.total : items.length;
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async createUser(dto: AdminCreateUserInput): Promise<AdminUserItem> {
    return httpClient.post<AdminUserItem>("/admin/users", dto);
  },

  async updateUser(
    id: string,
    dto: { role?: string; status?: string }
  ): Promise<AdminUserItem> {
    return httpClient.patch<AdminUserItem>(`/admin/users/${id}`, dto);
  },

  async getCustomerDetail(id: string): Promise<CustomerDetail360> {
    return httpClient.get<CustomerDetail360>(`/admin/customers/${id}`);
  },

  async getCustomerOrders(
    id: string,
    params?: { page?: number; limit?: number; status?: string }
  ): Promise<{
    items: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  }> {
    return httpClient.get<any>(`/admin/customers/${id}/orders`, { params });
  },
};

export interface CustomerDetail360 {
  customer: AdminUserItem;
  statistics: {
    total_orders_count: number;
    completed_orders_count: number;
    lifetime_spend: number;
    first_order_at: string | null;
    last_order_at: string | null;
  };
  addresses: Array<{
    id: string;
    recipient_name: string;
    phone: string;
    address_line: string;
    delivery_note: string | null;
    is_default: boolean;
    created_at: string;
  }>;
  preferences: {
    spicy_level: number | null;
    budget_per_meal: number;
    dietary_note: string | null;
    tag_preferences: Array<{
      tag_id: string;
      tag_name: string;
      preference: string;
    }>;
    ingredient_restrictions: Array<{
      ingredient_id: string;
      ingredient_name: string;
      reason: string;
    }>;
  } | null;
}
