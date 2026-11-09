import { httpClient } from "@/lib/http/client";

export interface ReportSummaryResponse {
  period: {
    from: string;
    to: string;
  };
  orders: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
  };
  financial: {
    total_revenue: number;
    average_order_value: number;
  };
  payment_methods: {
    vnpay: {
      count: number;
      revenue: number;
    };
    cod: {
      count: number;
      revenue: number;
    };
  };
  daily_revenue: Array<{
    date: string;
    revenue: number;
    order_count: number;
  }>;
  customers: {
    new_registered: number;
  };
}

export interface TopDishesResponse {
  period: {
    from: string;
    to: string;
  };
  limit: number;
  items: Array<{
    dishId: string;
    name: string;
    slug: string;
    coverUrl: string | null;
    totalSold: number;
    revenue: number;
  }>;
}

export const reportsApi = {
  getSummary: async (params?: { from?: string; to?: string }) => {
    return httpClient.get<ReportSummaryResponse>("/admin/reports/summary", {
      params,
    });
  },

  getTopDishes: async (params?: {
    from?: string;
    to?: string;
    limit?: number;
  }) => {
    return httpClient.get<TopDishesResponse>("/admin/reports/top-dishes", {
      params,
    });
  },
};
