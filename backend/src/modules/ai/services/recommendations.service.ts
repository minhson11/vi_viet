import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { QueryRecommendationsDto } from '../dto/query-recommendations.dto.js';
import { TrackInteractionDto } from '../dto/track-interaction.dto.js';
import { RecommendationCard } from '../types/ai.interfaces.js';
import {
  dishes_availability,
  user_tag_preferences_preference,
} from '@prisma/client';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách món ăn gợi ý (API-90)
   * Chế độ PERSONALIZED nếu user bật cá nhân hóa; ngược lại POPULAR
   */
  async getRecommendations(
    userId: string | undefined,
    query: QueryRecommendationsDto,
  ): Promise<{
    mode: 'PERSONALIZED' | 'POPULAR';
    items: RecommendationCard[];
  }> {
    const limit = Math.min(Math.max(query.limit ?? 6, 1), 12);

    if (userId) {
      const uId = BigInt(userId);
      const pref = await this.prisma.user_preferences.findUnique({
        where: { user_id: uId },
      });

      if (pref && pref.personalization_enabled) {
        const personalizedItems = await this.getPersonalizedDishes(uId, pref, limit);
        if (personalizedItems.length > 0) {
          return {
            mode: 'PERSONALIZED',
            items: personalizedItems,
          };
        }
      }
    }

    // Chế độ POPULAR mặc định
    const popularItems = await this.getPopularDishes(limit);
    return {
      mode: 'POPULAR',
      items: popularItems,
    };
  }

  /**
   * Ghi nhận sự kiện tương tác của người dùng (API-91)
   */
  async trackInteraction(userId: string, dto: TrackInteractionDto) {
    const uId = BigInt(userId);
    const dId = BigInt(dto.dishId);
    const recId = dto.recommendationId ? BigInt(dto.recommendationId) : null;

    // Kiểm tra món ăn có tồn tại
    const dish = await this.prisma.dishes.findUnique({
      where: { id: dId },
    });
    if (!dish) {
      throw new BadRequestException('Món ăn không tồn tại.');
    }

    // Lưu tương tác - dùng upsert theo event_key để đảm bảo idempotency (chống duplicate)
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    try {
      await this.prisma.user_interactions.upsert({
        where: { event_key: dto.eventKey },
        update: {},
        create: {
          user_id: uId,
          dish_id: dId,
          recommendation_id: recId,
          event_type: dto.eventType,
          event_key: dto.eventKey,
          occurred_at: occurredAt,
        },
      });
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`Lỗi khi ghi nhận interaction key ${dto.eventKey}:`, err.message);
      return { success: true };
    }
  }

  private async getPersonalizedDishes(
    userId: bigint,
    pref: {
      spicy_level: number | null;
      budget_per_meal: any;
    },
    limit: number,
  ): Promise<RecommendationCard[]> {
    // 1. Lấy danh sách nguyên liệu dị ứng / kiêng
    const restrictions = await this.prisma.user_ingredient_restrictions.findMany({
      where: { user_id: userId },
      select: { ingredient_id: true },
    });
    const restrictedIngIds = restrictions.map((r) => r.ingredient_id);

    // 2. Lấy tags yêu thích
    const likedTags = await this.prisma.user_tag_preferences.findMany({
      where: {
        user_id: userId,
        preference: user_tag_preferences_preference.LIKE,
      },
      select: { tag_id: true },
    });
    const likedTagIds = likedTags.map((t) => t.tag_id);

    // 3. Xây dựng điều kiện lọc
    const where: any = {
      availability: dishes_availability.AVAILABLE,
      deleted_at: null,
      categories: { is_active: true },
    };

    if (restrictedIngIds.length > 0) {
      where.dish_ingredients = {
        none: {
          ingredient_id: { in: restrictedIngIds },
        },
      };
    }

    if (pref.spicy_level !== null && pref.spicy_level !== undefined) {
      where.spicy_level = { lte: pref.spicy_level };
    }

    if (pref.budget_per_meal) {
      where.dish_variants = {
        some: {
          is_active: true,
          price: { lte: pref.budget_per_meal },
        },
      };
    }

    if (likedTagIds.length > 0) {
      where.dish_tags = {
        some: {
          tag_id: { in: likedTagIds },
        },
      };
    }

    const dishes = await this.prisma.dishes.findMany({
      where,
      take: limit,
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: {
        dish_variants: {
          where: { is_active: true },
          orderBy: { price: 'asc' },
          take: 1,
          select: { price: true },
        },
        dish_images: {
          where: { kind: 'COVER' },
          take: 1,
          select: { asset_path: true },
        },
      },
    });

    return dishes.map((d, idx) => ({
      dishId: d.id.toString(),
      dishName: d.name,
      slug: d.slug,
      coverUrl: d.dish_images[0]?.asset_path ?? null,
      startingPrice:
        d.dish_variants.length > 0 ? Number(d.dish_variants[0].price) : 0,
      availability: d.availability,
      reason:
        d.description ||
        'Gợi ý phù hợp hoàn hảo với khẩu vị và sở thích cá nhân của bạn',
      rankPosition: idx + 1,
    }));
  }

  private async getPopularDishes(limit: number): Promise<RecommendationCard[]> {
    const dishes = await this.prisma.dishes.findMany({
      where: {
        availability: dishes_availability.AVAILABLE,
        deleted_at: null,
        categories: { is_active: true },
      },
      take: limit,
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
      include: {
        dish_variants: {
          where: { is_active: true },
          orderBy: { price: 'asc' },
          take: 1,
          select: { price: true },
        },
        dish_images: {
          where: { kind: 'COVER' },
          take: 1,
          select: { asset_path: true },
        },
      },
    });

    return dishes.map((d, idx) => ({
      dishId: d.id.toString(),
      dishName: d.name,
      slug: d.slug,
      coverUrl: d.dish_images[0]?.asset_path ?? null,
      startingPrice:
        d.dish_variants.length > 0 ? Number(d.dish_variants[0].price) : 0,
      availability: d.availability,
      reason:
        d.description ||
        'Món ăn truyền thống tiêu biểu được thực khách Vị Việt yêu thích nhất',
      rankPosition: idx + 1,
    }));
  }
}
