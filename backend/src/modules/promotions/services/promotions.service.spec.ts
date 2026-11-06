import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromotionsService } from './promotions.service.js';
import { PrismaService } from '../../../database/prisma.service.js';
import { coupons_discount_type } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PromotionsService - Unit Tests (Kiểm thử Công thức & Ràng buộc Ưu đãi)', () => {
  let service: PromotionsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      coupons: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      coupon_redemptions: {
        count: vi.fn(),
        groupBy: vi.fn(),
      },
    };
    service = new PromotionsService(mockPrisma as unknown as PrismaService);
  });

  it('Ném lỗi NotFoundException khi mã ưu đãi không tồn tại', async () => {
    mockPrisma.coupons.findUnique.mockResolvedValue(null);

    await expect(
      service.validateCoupon('1', 'KHONGTONTAI', 100000, 20000),
    ).rejects.toThrow(NotFoundException);
  });

  it('Ném lỗi BadRequestException khi mã ưu đãi đang bị tạm khóa (is_active = false)', async () => {
    mockPrisma.coupons.findUnique.mockResolvedValue({
      id: 1n,
      code: 'LOCKED',
      is_active: false,
      starts_at: new Date(Date.now() - 3600000),
      ends_at: new Date(Date.now() + 3600000),
    });

    await expect(
      service.validateCoupon('1', 'LOCKED', 100000, 20000),
    ).rejects.toThrow(BadRequestException);
  });

  it('Ném lỗi BadRequestException khi mã ưu đãi đã hết hạn sử dụng', async () => {
    mockPrisma.coupons.findUnique.mockResolvedValue({
      id: 1n,
      code: 'EXPIRED',
      is_active: true,
      starts_at: new Date(Date.now() - 7200000),
      ends_at: new Date(Date.now() - 3600000), // Đã hết hạn 1 tiếng trước
    });

    await expect(
      service.validateCoupon('1', 'EXPIRED', 100000, 20000),
    ).rejects.toThrow('Mã ưu đãi đã hết hạn sử dụng');
  });

  it('Ném lỗi BadRequestException khi đơn hàng chưa đạt giá trị tối thiểu (min_subtotal)', async () => {
    mockPrisma.coupons.findUnique.mockResolvedValue({
      id: 1n,
      code: 'MIN150K',
      is_active: true,
      starts_at: new Date(Date.now() - 3600000),
      ends_at: new Date(Date.now() + 3600000),
      total_limit: null,
      per_user_limit: 5,
      min_subtotal: 150000,
    });
    mockPrisma.coupon_redemptions.count.mockResolvedValue(0);

    await expect(
      service.validateCoupon('1', 'MIN150K', 120000, 20000),
    ).rejects.toThrow('Đơn hàng cần tối thiểu');
  });

  it('Tính chính xác mức giảm FIXED (Số tiền cố định)', async () => {
    mockPrisma.coupons.findUnique.mockResolvedValue({
      id: 10n,
      code: 'GIAM30K',
      name: 'Giảm 30.000đ',
      discount_type: coupons_discount_type.FIXED,
      discount_value: 30000,
      min_subtotal: 100000,
      max_discount: null,
      is_active: true,
      starts_at: new Date(Date.now() - 3600000),
      ends_at: new Date(Date.now() + 3600000),
      total_limit: null,
      per_user_limit: 3,
      created_at: new Date(),
      updated_at: new Date(),
    });
    mockPrisma.coupon_redemptions.count.mockResolvedValue(0);

    const result = await service.validateCoupon('1', 'GIAM30K', 200000, 20000);
    expect(result.is_valid).toBe(true);
    expect(result.discount_amount).toBe(30000);
    expect(result.applied_to).toBe('FOOD');
  });

  it('Giảm FIXED không được vượt quá subtotal nếu subtotal nhỏ hơn mức giảm', async () => {
    mockPrisma.coupons.findUnique.mockResolvedValue({
      id: 11n,
      code: 'GIAM50K',
      name: 'Giảm 50.000đ',
      discount_type: coupons_discount_type.FIXED,
      discount_value: 50000,
      min_subtotal: 30000,
      max_discount: null,
      is_active: true,
      starts_at: new Date(Date.now() - 3600000),
      ends_at: new Date(Date.now() + 3600000),
      total_limit: null,
      per_user_limit: 3,
      created_at: new Date(),
      updated_at: new Date(),
    });
    mockPrisma.coupon_redemptions.count.mockResolvedValue(0);

    const result = await service.validateCoupon('1', 'GIAM50K', 40000, 20000);
    expect(result.discount_amount).toBe(40000); // Tối đa bằng subtotal
  });

  it('Tính chính xác mức giảm PERCENT có chặn trần tối đa (max_discount cap)', async () => {
    mockPrisma.coupons.findUnique.mockResolvedValue({
      id: 12n,
      code: 'SALE20',
      name: 'Giảm 20% tối đa 40.000đ',
      discount_type: coupons_discount_type.PERCENT,
      discount_value: 20, // 20% của 300.000đ là 60.000đ, nhưng trần là 40.000đ
      min_subtotal: 100000,
      max_discount: 40000,
      is_active: true,
      starts_at: new Date(Date.now() - 3600000),
      ends_at: new Date(Date.now() + 3600000),
      total_limit: null,
      per_user_limit: 3,
      created_at: new Date(),
      updated_at: new Date(),
    });
    mockPrisma.coupon_redemptions.count.mockResolvedValue(0);

    const result = await service.validateCoupon('1', 'SALE20', 300000, 20000);
    expect(result.discount_amount).toBe(40000); // Bị trần 40.000đ
  });

  it('Tính chính xác mức giảm FREE_SHIPPING (Miễn phí vận chuyển)', async () => {
    mockPrisma.coupons.findUnique.mockResolvedValue({
      id: 13n,
      code: 'FREESHIP',
      name: 'Freeship tối đa 25.000đ',
      discount_type: coupons_discount_type.FREE_SHIPPING,
      discount_value: 25000,
      min_subtotal: 50000,
      max_discount: null,
      is_active: true,
      starts_at: new Date(Date.now() - 3600000),
      ends_at: new Date(Date.now() + 3600000),
      total_limit: null,
      per_user_limit: 3,
      created_at: new Date(),
      updated_at: new Date(),
    });
    mockPrisma.coupon_redemptions.count.mockResolvedValue(0);

    const result = await service.validateCoupon('1', 'FREESHIP', 100000, 20000);
    expect(result.discount_amount).toBe(20000); // Phí ship là 20.000đ, giảm tối đa 20.000đ
    expect(result.applied_to).toBe('SHIPPING');
  });
});
