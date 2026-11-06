export interface SalesKpi {
  today_revenue: number;
  today_orders: number;
  avg_order_value: number;
  revenue_growth_pct: number;
}

export interface DishSalesRanking {
  dish_id: string;
  name: string;
  category_name: string;
  quantity_sold: number;
  revenue: number;
}

