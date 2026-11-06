import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { SubmitReviewDto } from '../dto/submit-review.dto.js';
import { QueryReviewsDto } from '../dto/query-reviews.dto.js';
import { ModerateReviewDto } from '../dto/moderate-review.dto.js';
import { orders_status, reviews_visibility, Prisma } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Hàm ẩn danh hóa họ tên khách hàng để bảo vệ dữ liệu riêng tư (BR-24, API-85)
  private maskCustomerName(fullName?: string | null): string {
    if (!fullName || fullName.trim().length === 0) {
      return 'Khách hàng';
    }
    const words = fullName.trim().split(/\s+/);
    if (words.length === 1) {
      return `${words[0].slice(0, 1)}***`;
    }
    const first = words[0];
    const last = words[words.length - 1];
    return `${first} ${last.slice(0, 1)}***`;
  }

  public serializeReviewPublic(r: any) {
    const rawName = r.order_items?.orders?.users?.full_name || null;
    return {
      id: r.id.toString(),
      order_item_id: r.order_item_id.toString(),
      dish_id: r.order_items?.dish_id?.toString() || null,
      dish_name: r.order_items?.dish_name || null,
      variant_name: r.order_items?.variant_name || null,
      rating: r.rating,
      content: r.content,
      author_display_name: this.maskCustomerName(rawName),
      reply: r.reply,
      replied_at: r.replied_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  public serializeReviewAdmin(r: any) {
    return {
      id: r.id.toString(),
      order_item_id: r.order_item_id.toString(),
      rating: r.rating,
      content: r.content,
      visibility: r.visibility,
      moderation_reason: r.moderation_reason,
      reply: r.reply,
      replied_by: r.replied_by ? r.replied_by.toString() : null,
      replied_by_name: r.users?.full_name || null,
      replied_at: r.replied_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      order_item: r.order_items
        ? {
            id: r.order_items.id.toString(),
            dish_id: r.order_items.dish_id.toString(),
            dish_name: r.order_items.dish_name,
            variant_name: r.order_items.variant_name,
            order_id: r.order_items.order_id.toString(),
            order_code: r.order_items.orders?.order_code || null,
            customer_name: r.order_items.orders?.users?.full_name || null,
            customer_email: r.order_items.orders?.users?.email || null,
          }
        : undefined,
    };
  }

  // 1. Khách hàng gửi hoặc cập nhật đánh giá món sau khi đơn đã COMPLETED (API-85 - BR-24, AC-16)
  async submitReview(
    userId: string,
    orderItemId: string,
    dto: SubmitReviewDto,
  ) {
    const oiId = BigInt(orderItemId);
    const uId = BigInt(userId);

    const orderItem = await this.prisma.order_items.findUnique({
      where: { id: oiId },
      include: {
        orders: {
          include: {
            users: { select: { full_name: true } },
          },
        },
      },
    });

    if (!orderItem) {
      throw new NotFoundException(
        `Không tìm thấy dòng món ăn với ID ${orderItemId}.`,
      );
    }

    // Kiểm tra quyền sở hữu đơn hàng
    if (orderItem.orders.user_id !== uId) {
      throw new ForbiddenException(
        'Bạn chỉ có quyền đánh giá món ăn từ đơn hàng của chính mình.',
      );
    }

    // [BR-24, AC-16] Bắt buộc đơn hàng phải hoàn thành mới được đánh giá
    if (orderItem.orders.status !== orders_status.COMPLETED) {
      throw new BadRequestException(
        `Chỉ có thể đánh giá món ăn khi đơn hàng đã hoàn thành (COMPLETED - BR-24, AC-16)! Trạng thái hiện tại: "${orderItem.orders.status}".`,
      );
    }

    // Upsert đánh giá theo order_item_id (chống tạo 2 đánh giá trên cùng dòng món)
    const review = await this.prisma.reviews.upsert({
      where: { order_item_id: oiId },
      update: {
        rating: dto.rating,
        content: dto.content !== undefined ? dto.content : null,
        visibility: reviews_visibility.VISIBLE,
      },
      create: {
        order_item_id: oiId,
        rating: dto.rating,
        content: dto.content || null,
        visibility: reviews_visibility.VISIBLE,
      },
      include: {
        order_items: {
          include: {
            orders: {
              include: { users: { select: { full_name: true } } },
            },
          },
        },
      },
    });

    return this.serializeReviewPublic(review);
  }

  // 2. Khách vãng lai / Public xem danh sách đánh giá của một món ăn (API-25)
  async getDishReviews(dishId: string, page = 1, limit = 20) {
    const dId = BigInt(dishId);
    const skip = (page - 1) * limit;

    const dish = await this.prisma.dishes.findUnique({
      where: { id: dId },
    });

    if (!dish) {
      throw new NotFoundException(`Không tìm thấy món ăn ID ${dishId}.`);
    }

    const where: Prisma.reviewsWhereInput = {
      order_items: { dish_id: dId },
      visibility: reviews_visibility.VISIBLE,
    };

    const [total, items, avgRating] = await Promise.all([
      this.prisma.reviews.count({ where }),
      this.prisma.reviews.findMany({
        where,
        skip,
        take: limit,
        include: {
          order_items: {
            include: {
              orders: {
                include: { users: { select: { full_name: true } } },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.reviews.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    return {
      items: items.map((r) => this.serializeReviewPublic(r)),
      total,
      average_rating: avgRating._avg.rating
        ? Number(avgRating._avg.rating.toFixed(1))
        : null,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  // 3. Admin tra cứu và quản lý danh sách đánh giá (API-72)
  async adminFindAll(query: QueryReviewsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.reviewsWhereInput = {};

    if (query.visibility) {
      where.visibility = query.visibility;
    }

    if (query.dish_id) {
      where.order_items = { dish_id: BigInt(query.dish_id) };
    }

    const [total, items] = await Promise.all([
      this.prisma.reviews.count({ where }),
      this.prisma.reviews.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: { select: { full_name: true } },
          order_items: {
            include: {
              orders: {
                include: {
                  users: { select: { full_name: true, email: true } },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      items: items.map((r) => this.serializeReviewAdmin(r)),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  // 4. Admin phản hồi hoặc kiểm duyệt ẩn đánh giá (API-73 - BR-25)
  async adminModerateReview(
    adminId: string,
    reviewId: string,
    dto: ModerateReviewDto,
  ) {
    const rId = BigInt(reviewId);
    const aId = BigInt(adminId);

    const review = await this.prisma.reviews.findUnique({
      where: { id: rId },
    });

    if (!review) {
      throw new NotFoundException(`Không tìm thấy đánh giá ID ${reviewId}.`);
    }

    const updateData: Prisma.reviewsUpdateInput = {};

    // [BR-25] Ẩn đánh giá bắt buộc phải có lý do kiểm duyệt
    if (dto.visibility !== undefined) {
      if (dto.visibility === reviews_visibility.HIDDEN) {
        if (!dto.moderationReason || dto.moderationReason.trim().length === 0) {
          throw new BadRequestException(
            'Khi ẩn đánh giá của khách hàng, bắt buộc phải cung cấp lý do kiểm duyệt (moderationReason) theo quy tắc BR-25!',
          );
        }
        updateData.moderation_reason = dto.moderationReason;
      } else {
        updateData.moderation_reason = null;
      }
      updateData.visibility = dto.visibility;
    }

    // Phản hồi từ cửa hàng
    if (dto.reply !== undefined) {
      updateData.reply = dto.reply;
      updateData.users = { connect: { id: aId } };
      updateData.replied_at = new Date();
    }

    const updated = await this.prisma.reviews.update({
      where: { id: rId },
      data: updateData,
      include: {
        users: { select: { full_name: true } },
        order_items: {
          include: {
            orders: {
              include: { users: { select: { full_name: true, email: true } } },
            },
          },
        },
      },
    });

    return this.serializeReviewAdmin(updated);
  }
}
