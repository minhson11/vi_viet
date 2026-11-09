import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportsService } from './reports.service.js';

describe('ReportsService', () => {
  let service: ReportsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      orders: {
        findMany: vi.fn(),
      },
      users: {
        count: vi.fn(),
      },
      order_items: {
        findMany: vi.fn(),
      },
    };
    service = new ReportsService(prismaMock);
  });

  describe('getSummary', () => {
    it('tính toán chính xác tổng doanh thu, số đơn và phân bổ thanh toán', async () => {
      const mockOrders = [
        {
          id: BigInt(1),
          user_id: BigInt(10),
          status: 'COMPLETED',
          payment_status: 'PAID',
          payment_method: 'VNPAY',
          total_amount: '150000',
          created_at: new Date('2026-11-05T10:00:00Z'),
        },
        {
          id: BigInt(2),
          user_id: BigInt(11),
          status: 'COMPLETED',
          payment_status: 'PAID',
          payment_method: 'COD',
          total_amount: '250000',
          created_at: new Date('2026-11-05T12:00:00Z'),
        },
        {
          id: BigInt(3),
          user_id: BigInt(12),
          status: 'CANCELLED',
          payment_status: 'REFUNDED',
          payment_method: 'VNPAY',
          total_amount: '100000',
          created_at: new Date('2026-11-06T08:00:00Z'),
        },
      ];

      prismaMock.orders.findMany.mockResolvedValue(mockOrders);
      prismaMock.users.count.mockResolvedValue(5);

      const result = await service.getSummary({
        from: '2026-11-01T00:00:00Z',
        to: '2026-11-10T23:59:59Z',
      });

      expect(result.orders.total).toBe(3);
      expect(result.orders.completed).toBe(2);
      expect(result.orders.cancelled).toBe(1);
      expect(result.financial.total_revenue).toBe(400000);
      expect(result.financial.average_order_value).toBe(200000);
      expect(result.payment_methods.vnpay.count).toBe(2);
      expect(result.payment_methods.cod.count).toBe(1);
      expect(result.customers.new_registered).toBe(5);
      expect(result.daily_revenue.length).toBe(2);
    });
  });

  describe('getTopDishes', () => {
    it('gom nhóm số lượng bán và sắp xếp món ăn chạy nhất', async () => {
      const mockOrderItems = [
        {
          dish_id: BigInt(101),
          dish_name: 'Phở Bò Tái Lăn',
          quantity: 2,
          base_price: '65000',
          line_total: '130000',
          dish_variants: {
            dishes: {
              id: BigInt(101),
              name: 'Phở Bò Tái Lăn',
              slug: 'pho-bo-tai-lan',
              dish_images: [{ asset_path: '/images/pho.jpg' }],
            },
          },
        },
        {
          dish_id: BigInt(101),
          dish_name: 'Phở Bò Tái Lăn',
          quantity: 3,
          base_price: '65000',
          line_total: '195000',
          dish_variants: {
            dishes: {
              id: BigInt(101),
              name: 'Phở Bò Tái Lăn',
              slug: 'pho-bo-tai-lan',
              dish_images: [{ asset_path: '/images/pho.jpg' }],
            },
          },
        },
        {
          dish_id: BigInt(102),
          dish_name: 'Bún Chả Hà Nội',
          quantity: 1,
          base_price: '55000',
          line_total: '55000',
          dish_variants: {
            dishes: {
              id: BigInt(102),
              name: 'Bún Chả Hà Nội',
              slug: 'bun-cha-ha-noi',
              dish_images: [{ asset_path: '/images/buncha.jpg' }],
            },
          },
        },
      ];

      prismaMock.order_items.findMany.mockResolvedValue(mockOrderItems);

      const result = await service.getTopDishes({ limit: 5 });

      expect(result.items.length).toBe(2);
      expect(result.items[0].dishId).toBe('101');
      expect(result.items[0].totalSold).toBe(5);
      expect(result.items[0].revenue).toBe(325000);
      expect(result.items[1].dishId).toBe('102');
      expect(result.items[1].totalSold).toBe(1);
    });
  });
});
