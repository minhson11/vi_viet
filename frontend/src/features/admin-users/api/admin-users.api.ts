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
};
