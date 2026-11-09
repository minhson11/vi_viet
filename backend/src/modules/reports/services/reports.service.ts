import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { QueryReportDto } from '../dto/query-report.dto.js';
import { QueryTopDishesDto } from '../dto/query-top-dishes.dto.js';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán báo cáo tổng quan kinh doanh & doanh thu (API-79)
   */
  async getSummary(query: QueryReportDto) {
    const toDate = query.to ? new Date(query.to) : new Date();
    const fromDate = query.from
      ? new Date(query.from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Lấy tất cả đơn hàng phát sinh trong khoảng thời gian
    const orders = await this.prisma.orders.findMany({
      where: {
        created_at: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        id: true,
        user_id: true,
        status: true,
        payment_status: true,
        payment_method: true,
        total_amount: true,
        created_at: true,
      },
    });

    let totalRevenue = 0;
    let completedOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let pendingOrdersCount = 0;
    let vnpayCount = 0;
    let vnpayRevenue = 0;
    let codCount = 0;
    let codRevenue = 0;

    // Map gom nhóm doanh thu theo ngày: YYYY-MM-DD -> { revenue, order_count }
    const dailyMap = new Map<string, { revenue: number; orderCount: number }>();

    for (const order of orders) {
      const amount = Number(order.total_amount || 0);
      const isPaidOrCompleted =
        order.status === 'COMPLETED' || order.payment_status === 'PAID';

      if (order.status === 'COMPLETED') {
        completedOrdersCount++;
      } else if (order.status === 'CANCELLED') {
        cancelledOrdersCount++;
      } else {
        pendingOrdersCount++;
      }

      if (isPaidOrCompleted) {
        totalRevenue += amount;
      }

      if (order.payment_method === 'VNPAY') {
        vnpayCount++;
        if (isPaidOrCompleted) vnpayRevenue += amount;
      } else {
        codCount++;
        if (isPaidOrCompleted) codRevenue += amount;
      }

      // Nhóm theo ngày (YYYY-MM-DD theo múi giờ Việt Nam GMT+7)
      const gmt7Time = new Date(order.created_at.getTime() + 7 * 60 * 60 * 1000);
      const dateKey = gmt7Time.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { revenue: 0, orderCount: 0 };
      existing.orderCount++;
      if (isPaidOrCompleted) {
        existing.revenue += amount;
      }
      dailyMap.set(dateKey, existing);
    }

    const averageOrderValue =
      completedOrdersCount > 0
        ? Math.round(totalRevenue / completedOrdersCount)
        : 0;

    // Chuyển Map thành mảng danh sách theo thứ tự ngày tăng dần
    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, val]) => ({
        date,
        revenue: val.revenue,
        order_count: val.orderCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Thống kê khách hàng mới và khách hàng quay lại
    const newCustomersCount = await this.prisma.users.count({
      where: {
        role: 'CUSTOMER',
        created_at: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    return {
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      orders: {
        total: orders.length,
        completed: completedOrdersCount,
        cancelled: cancelledOrdersCount,
        pending: pendingOrdersCount,
      },
      financial: {
        total_revenue: totalRevenue,
        average_order_value: averageOrderValue,
      },
      payment_methods: {
        vnpay: {
          count: vnpayCount,
          revenue: vnpayRevenue,
        },
        cod: {
          count: codCount,
          revenue: codRevenue,
        },
      },
      daily_revenue: dailyRevenue,
      customers: {
        new_registered: newCustomersCount,
      },
    };
  }

  /**
   * Lấy danh sách món ăn bán chạy nhất trong kỳ (API-80)
   */
  async getTopDishes(query: QueryTopDishesDto) {
    const toDate = query.to ? new Date(query.to) : new Date();
    const fromDate = query.from
      ? new Date(query.from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const limit = query.limit || 10;

    // Lấy các order_items thuộc đơn hàng thành công hoặc đã thanh toán
    const items = await this.prisma.order_items.findMany({
      where: {
        orders: {
          created_at: {
            gte: fromDate,
            lte: toDate,
          },
          OR: [{ status: 'COMPLETED' }, { payment_status: 'PAID' }],
        },
      },
      select: {
        dish_id: true,
        dish_name: true,
        quantity: true,
        base_price: true,
        line_total: true,
        dish_variants: {
          select: {
            dishes: {
              select: {
                id: true,
                name: true,
                slug: true,
                dish_images: {
                  where: { kind: 'COVER' },
                  take: 1,
                  select: { asset_path: true },
                },
              },
            },
          },
        },
      },
    });

    // Gom nhóm theo dish_id
    const dishMap = new Map<
      string,
      {
        dishId: string;
        name: string;
        slug: string;
        coverUrl: string | null;
        totalSold: number;
        revenue: number;
      }
    >();

    for (const item of items) {
      const dishId = item.dish_id.toString();
      const dishObj = item.dish_variants?.dishes;
      const existing = dishMap.get(dishId) || {
        dishId,
        name: dishObj?.name || item.dish_name,
        slug: dishObj?.slug || '',
        coverUrl: dishObj?.dish_images[0]?.asset_path || null,
        totalSold: 0,
        revenue: 0,
      };

      existing.totalSold += item.quantity;
      existing.revenue += Number(
        item.line_total || item.quantity * Number(item.base_price),
      );
      dishMap.set(dishId, existing);
    }

    // Sắp xếp giảm dần theo số lượng / doanh thu và giới hạn limit
    const topDishes = Array.from(dishMap.values())
      .sort((a, b) => b.totalSold - a.totalSold || b.revenue - a.revenue)
      .slice(0, limit);

    return {
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      limit,
      items: topDishes,
    };
  }
}
