import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { CreateCouponDto } from '../dto/create-coupon.dto.js';
import { UpdateCouponDto } from '../dto/update-coupon.dto.js';
import { QueryCouponsDto } from '../dto/query-coupons.dto.js';
import { coupon_redemptions_status, Prisma } from '@prisma/client';
import { calculateCouponDiscount } from '../domain/coupon-discount.policy.js';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeCoupon(c: any) {
    return {
      id: c.id.toString(),
      code: c.code,
      name: c.name,
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value),
      min_subtotal: Number(c.min_subtotal),
      max_discount: c.max_discount !== null ? Number(c.max_discount) : null,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      total_limit: c.total_limit,
      per_user_limit: c.per_user_limit,
      is_active: c.is_active,
      created_at: c.created_at,
      updated_at: c.updated_at,
      ...(c._count && { redemptions_count: c._count.coupon_redemptions }),
    };
  }

  // 1. Kiểm tra tính hợp lệ và tính mức giảm giá cho mã ưu đãi (BR-10, BR-11, BR-13)
  async validateCoupon(
    userId: string,
    code: string,
    subtotal: number,
    shippingFee = 0,
  ) {
    const cleanCode = code.toUpperCase().trim();
    const coupon = await this.prisma.coupons.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon) {
      throw new NotFoundException(`Không tìm thấy mã ưu đãi "${cleanCode}".`);
    }

    if (!coupon.is_active) {
      throw new BadRequestException('Mã ưu đãi hiện đang bị tạm khóa.');
    }

    const now = new Date();
    if (now < coupon.starts_at) {
      throw new BadRequestException('Chương trình ưu đãi này chưa bắt đầu.');
    }
    if (now > coupon.ends_at) {
      throw new BadRequestException('Mã ưu đãi đã hết hạn sử dụng.');
    }

    // Kiểm tra tổng lượt sử dụng toàn hệ thống (BR-13)
    if (coupon.total_limit !== null) {
      const totalRedeemed = await this.prisma.coupon_redemptions.count({
        where: {
          coupon_id: coupon.id,
          status: {
            in: [
              coupon_redemptions_status.RESERVED,
              coupon_redemptions_status.CONSUMED,
            ],
          },
        },
      });

      if (totalRedeemed >= coupon.total_limit) {
        throw new BadRequestException('Mã ưu đãi đã hết lượt sử dụng.');
      }
    }

    // Kiểm tra lượt sử dụng của riêng người dùng (BR-13)
    const uId = BigInt(userId);
    const userRedeemed = await this.prisma.coupon_redemptions.count({
      where: {
        coupon_id: coupon.id,
        user_id: uId,
        status: {
          in: [
            coupon_redemptions_status.RESERVED,
            coupon_redemptions_status.CONSUMED,
          ],
        },
      },
    });

    if (userRedeemed >= coupon.per_user_limit) {
      throw new BadRequestException(
        'Bạn đã dùng hết số lượt cho phép của mã ưu đãi này.',
      );
    }

    // Kiểm tra giá trị đơn hàng tối thiểu trên tiền món (BR-10)
    const minSubtotal = Number(coupon.min_subtotal);
    if (subtotal < minSubtotal) {
      throw new BadRequestException(
        `Đơn hàng cần tối thiểu ${minSubtotal.toLocaleString('vi-VN')}đ tiền món để áp dụng mã này.`,
      );
    }

    // Tính toán số tiền giảm theo chuẩn VND (BR-11) qua Domain Policy
    const discountResult = calculateCouponDiscount(
      {
        type: coupon.discount_type as any,
        value: Number(coupon.discount_value),
        maxDiscount:
          coupon.max_discount !== null ? Number(coupon.max_discount) : null,
      },
      subtotal,
      shippingFee,
    );

    return {
      is_valid: true,
      coupon: this.serializeCoupon(coupon),
      discount_type: coupon.discount_type,
      discount_amount: discountResult.amount,
      applied_to: discountResult.appliedTo,
    };
  }

  // 2. Danh sách các mã ưu đãi công khai đang có hiệu lực (cho khách hàng)
  async getAvailableCoupons(userId?: string) {
    const now = new Date();
    const coupons = await this.prisma.coupons.findMany({
      where: {
        is_active: true,
        starts_at: { lte: now },
        ends_at: { gte: now },
      },
      orderBy: { created_at: 'desc' },
    });

    const couponIds = coupons.map((c) => c.id);
    const activeStatuses = [
      coupon_redemptions_status.RESERVED,
      coupon_redemptions_status.CONSUMED,
    ];

    // Gom nhóm thống kê tổng lượt sử dụng trong 1 truy vấn thay vì lặp N+1 (Issue 7)
    const totalRedemptions =
      couponIds.length > 0
        ? await this.prisma.coupon_redemptions.groupBy({
            by: ['coupon_id'],
            where: {
              coupon_id: { in: couponIds },
              status: { in: activeStatuses },
            },
            _count: { id: true },
          })
        : [];

    const totalCountMap = new Map<string, number>();
    for (const r of totalRedemptions) {
      totalCountMap.set(r.coupon_id.toString(), r._count.id);
    }

    // Gom nhóm thống kê lượt sử dụng của user trong 1 truy vấn
    const userCountMap = new Map<string, number>();
    if (userId && couponIds.length > 0) {
      const userRedemptions = await this.prisma.coupon_redemptions.groupBy({
        by: ['coupon_id'],
        where: {
          coupon_id: { in: couponIds },
          user_id: BigInt(userId),
          status: { in: activeStatuses },
        },
        _count: { id: true },
      });
      for (const r of userRedemptions) {
        userCountMap.set(r.coupon_id.toString(), r._count.id);
      }
    }

    const result = coupons.map((c) => {
      let canUse = true;
      let reason: string | null = null;
      const cIdStr = c.id.toString();

      if (c.total_limit !== null) {
        const totalUsed = totalCountMap.get(cIdStr) || 0;
        if (totalUsed >= c.total_limit) {
          canUse = false;
          reason = 'Đã hết lượt sử dụng';
        }
      }

      if (canUse && userId) {
        const userUsed = userCountMap.get(cIdStr) || 0;
        if (userUsed >= c.per_user_limit) {
          canUse = false;
          reason = 'Bạn đã dùng hết lượt mã này';
        }
      }

      return {
        ...this.serializeCoupon(c),
        can_use: canUse,
        reason,
      };
    });

    return result;
  }

  // ==========================================
  // ADMIN & OPERATOR: QUẢN LÝ MÃ ƯU ĐÃI
  // ==========================================

  async findAllAdmin(query: QueryCouponsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.couponsWhereInput = {};
    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
      ];
    }
    if (query.is_active !== undefined) {
      where.is_active = query.is_active;
    }

    const [total, rawCoupons] = await Promise.all([
      this.prisma.coupons.count({ where }),
      this.prisma.coupons.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { coupon_redemptions: true },
          },
        },
      }),
    ]);

    return {
      items: rawCoupons.map((c) => this.serializeCoupon(c)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAdmin(id: string) {
    const coupon = await this.prisma.coupons.findUnique({
      where: { id: BigInt(id) },
      include: {
        _count: {
          select: { coupon_redemptions: true },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Không tìm thấy mã ưu đãi ID ${id}.`);
    }

    return this.serializeCoupon(coupon);
  }

  async createCoupon(dto: CreateCouponDto) {
    const code = dto.code.toUpperCase().trim();

    const existing = await this.prisma.coupons.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`Mã ưu đãi "${code}" đã tồn tại.`);
    }

    const startsAt = new Date(dto.starts_at);
    const endsAt = new Date(dto.ends_at);
    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu.',
      );
    }

    const coupon = await this.prisma.coupons.create({
      data: {
        code,
        name: dto.name.trim(),
        discount_type: dto.discount_type,
        discount_value: dto.discount_value,
        min_subtotal: dto.min_subtotal ?? 0,
        max_discount: dto.max_discount ?? null,
        starts_at: startsAt,
        ends_at: endsAt,
        total_limit: dto.total_limit ?? null,
        per_user_limit: dto.per_user_limit ?? 1,
        is_active: dto.is_active ?? true,
      },
    });

    return {
      message: 'Tạo mã ưu đãi thành công.',
      coupon: this.serializeCoupon(coupon),
    };
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const cId = BigInt(id);
    const existing = await this.prisma.coupons.findUnique({
      where: { id: cId },
    });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy mã ưu đãi ID ${id}.`);
    }

    const data: Prisma.couponsUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.discount_type !== undefined) data.discount_type = dto.discount_type;
    if (dto.discount_value !== undefined)
      data.discount_value = dto.discount_value;
    if (dto.min_subtotal !== undefined) data.min_subtotal = dto.min_subtotal;
    if (dto.max_discount !== undefined) data.max_discount = dto.max_discount;
    if (dto.starts_at !== undefined) data.starts_at = new Date(dto.starts_at);
    if (dto.ends_at !== undefined) data.ends_at = new Date(dto.ends_at);
    if (dto.total_limit !== undefined) data.total_limit = dto.total_limit;
    if (dto.per_user_limit !== undefined)
      data.per_user_limit = dto.per_user_limit;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;

    const updated = await this.prisma.coupons.update({
      where: { id: cId },
      data,
    });

    return {
      message: 'Cập nhật mã ưu đãi thành công.',
      coupon: this.serializeCoupon(updated),
    };
  }

  async toggleStatus(id: string, isActive: boolean) {
    const cId = BigInt(id);
    const existing = await this.prisma.coupons.findUnique({
      where: { id: cId },
    });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy mã ưu đãi ID ${id}.`);
    }

    const updated = await this.prisma.coupons.update({
      where: { id: cId },
      data: { is_active: isActive },
    });

    return {
      message: `Đã ${isActive ? 'kích hoạt' : 'tạm khóa'} mã ưu đãi.`,
      coupon: this.serializeCoupon(updated),
    };
  }
}
