import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { dishes_availability } from '@prisma/client';
import { MenuItemSummary } from '../types/ai.interfaces.js';

@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tra cứu thực đơn món ăn Vị Việt theo các tiêu chí khẩu vị, ngân sách, độ cay và dị ứng
   */
  async searchMenu(params: {
    keyword?: string;
    categorySlug?: string;
    maxSpicyLevel?: number;
    maxPrice?: number;
    minPrice?: number;
    avoidIngredients?: string[];
    tagCodes?: string[];
    limit?: number;
  }): Promise<MenuItemSummary[]> {
    const limit = Math.min(Math.max(params.limit ?? 15, 1), 20);

    const where: any = {
      availability: dishes_availability.AVAILABLE,
      deleted_at: null,
      categories: {
        is_active: true,
      },
    };

    if (params.categorySlug) {
      where.categories = {
        slug: params.categorySlug,
        is_active: true,
      };
    }

    if (params.keyword && params.keyword.trim()) {
      const kw = params.keyword.trim();
      where.OR = [
        { name: { contains: kw } },
        { description: { contains: kw } },
      ];
    }

    if (params.maxSpicyLevel !== undefined && params.maxSpicyLevel !== null) {
      where.spicy_level = { lte: Number(params.maxSpicyLevel) };
    }

    if (params.maxPrice !== undefined || params.minPrice !== undefined) {
      const priceFilter: any = {};
      if (params.minPrice !== undefined) priceFilter.gte = Number(params.minPrice);
      if (params.maxPrice !== undefined) priceFilter.lte = Number(params.maxPrice);

      where.dish_variants = {
        some: {
          is_active: true,
          price: priceFilter,
        },
      };
    }

    if (params.tagCodes && params.tagCodes.length > 0) {
      where.dish_tags = {
        some: {
          tags: {
            code: { in: params.tagCodes.map((t) => t.toLowerCase().trim()) },
          },
        },
      };
    }

    const dishes = await this.prisma.dishes.findMany({
      where,
      take: limit * 2, // Lấy dư để lọc dị ứng nếu có
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: {
        categories: { select: { id: true, name: true, slug: true } },
        dish_variants: {
          where: { is_active: true },
          select: { id: true, name: true, price: true },
          orderBy: { price: 'asc' },
        },
        dish_images: {
          where: { kind: 'COVER' },
          select: { asset_path: true },
          take: 1,
        },
        dish_tags: {
          include: { tags: { select: { code: true, name: true } } },
        },
        dish_ingredients: {
          include: { ingredients: { select: { id: true, name: true } } },
        },
      },
    });

    // Lọc bỏ món chứa nguyên liệu kiêng / dị ứng
    const avoidList = (params.avoidIngredients || [])
      .map((item) => item.toLowerCase().trim())
      .filter(Boolean);

    const filtered = dishes.filter((dish) => {
      if (avoidList.length === 0) return true;
      const ingredientNames = dish.dish_ingredients.map((di) =>
        di.ingredients.name.toLowerCase(),
      );
      for (const avoid of avoidList) {
        if (ingredientNames.some((ing) => ing.includes(avoid))) {
          return false;
        }
      }
      return true;
    });

    return filtered.slice(0, limit).map((dish) => {
      const startingPrice =
        dish.dish_variants.length > 0 ? Number(dish.dish_variants[0].price) : 0;
      const coverUrl = dish.dish_images[0]?.asset_path ?? null;

      return {
        id: dish.id.toString(),
        name: dish.name,
        slug: dish.slug,
        description: dish.description,
        spicy_level: dish.spicy_level,
        startingPrice,
        coverUrl,
        categoryName: dish.categories?.name,
        tags: dish.dish_tags.map((dt) => dt.tags.name),
        ingredients: dish.dish_ingredients.map((di) => di.ingredients.name),
      };
    });
  }

  /**
   * Lấy chi tiết thông tin món ăn (biến thể giá, tùy chọn, thành phần đầy đủ)
   */
  async getDishDetails(dishIds: string[]) {
    if (!dishIds || dishIds.length === 0) return [];

    const ids = dishIds
      .slice(0, 10)
      .map((id) => {
        try {
          return BigInt(id);
        } catch {
          return null;
        }
      })
      .filter((id): id is bigint => id !== null);

    const dishes = await this.prisma.dishes.findMany({
      where: {
        id: { in: ids },
        deleted_at: null,
      },
      include: {
        categories: { select: { id: true, name: true, slug: true } },
        dish_variants: {
          where: { is_active: true },
          select: { id: true, name: true, price: true },
          orderBy: { price: 'asc' },
        },
        dish_images: {
          select: { asset_path: true, kind: true },
          orderBy: { sort_order: 'asc' },
        },
        dish_ingredients: {
          include: { ingredients: { select: { id: true, name: true } } },
        },
      },
    });

    return dishes.map((d) => ({
      id: d.id.toString(),
      name: d.name,
      slug: d.slug,
      description: d.description,
      story: d.story,
      spicy_level: d.spicy_level,
      availability: d.availability,
      category: d.categories?.name,
      variants: d.dish_variants.map((v) => ({
        id: v.id.toString(),
        name: v.name,
        price: Number(v.price),
      })),
      images: d.dish_images.map((img) => img.asset_path),
      ingredients: d.dish_ingredients.map((di) => di.ingredients.name),
    }));
  }
}
