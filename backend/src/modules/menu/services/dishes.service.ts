import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { CreateDishDto, DishAvailability } from '../dto/create-dish.dto.js';
import { UpdateDishDto } from '../dto/update-dish.dto.js';
import { QueryDishesDto } from '../dto/query-dishes.dto.js';
import { slugify } from '../../../common/utils/slug.util.js';
import {
  Prisma,
  dishes_availability,
  dishes_ingredient_data_status,
} from '@prisma/client';

@Injectable()
export class DishesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // KHÁCH HÀNG: XEM VÀ LỌC THỰC ĐƠN
  // ==========================================
  async findPublicDishes(query: QueryDishesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.dishesWhereInput = {
      availability: dishes_availability.AVAILABLE,
      deleted_at: null,
      categories: {
        is_active: true,
      },
    };

    if (query.search) {
      where.name = { contains: query.search };
    }

    if (query.category_slug) {
      where.categories = {
        slug: query.category_slug,
        is_active: true,
      };
    } else if (query.category_id) {
      where.category_id = BigInt(query.category_id);
    }

    if (query.tag_code) {
      where.dish_tags = {
        some: {
          tags: {
            code: query.tag_code.toLowerCase().trim(),
          },
        },
      };
    }

    if (query.spicy_level !== undefined) {
      where.spicy_level = query.spicy_level;
    }

    if (query.min_price !== undefined || query.max_price !== undefined) {
      const priceFilter: Prisma.DecimalFilter = {};
      if (query.min_price !== undefined) priceFilter.gte = query.min_price;
      if (query.max_price !== undefined) priceFilter.lte = query.max_price;

      where.dish_variants = {
        some: {
          is_active: true,
          price: priceFilter,
        },
      };
    }

    const [total, rawDishes] = await Promise.all([
      this.prisma.dishes.count({ where }),
      this.prisma.dishes.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        include: {
          categories: {
            select: { id: true, name: true, slug: true },
          },
          dish_variants: {
            where: { is_active: true },
            select: { id: true, name: true, price: true },
            orderBy: { price: 'asc' },
          },
          dish_images: {
            where: { kind: 'COVER' },
            select: { id: true, asset_path: true, alt_text: true, kind: true },
            take: 1,
          },
          dish_tags: {
            include: {
              tags: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      }),
    ]);

    // Chuẩn hóa dữ liệu trả về cho frontend
    const items = rawDishes.map((dish) => {
      // dish_variants đã được sắp xếp tăng dần theo giá trong query Prisma (orderBy: { price: 'asc' })
      const startingPrice =
        dish.dish_variants.length > 0 ? Number(dish.dish_variants[0].price) : 0;
      const coverImage = dish.dish_images[0] ?? null;
      const tags = dish.dish_tags.map((dt) => dt.tags);

      return {
        id: dish.id.toString(),
        category_id: dish.category_id.toString(),
        name: dish.name,
        slug: dish.slug,
        description: dish.description,
        spicy_level: dish.spicy_level,
        starting_price: startingPrice,
        availability: dish.availability,
        cover_image: coverImage,
        category: dish.categories,
        variants_count: dish.dish_variants.length,
        tags,
      };
    });

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicDishBySlug(slug: string) {
    const dish = await this.prisma.dishes.findUnique({
      where: { slug },
      include: {
        categories: {
          select: { id: true, name: true, slug: true },
        },
        dish_variants: {
          where: { is_active: true },
          orderBy: { price: 'asc' },
        },
        option_groups: {
          where: { is_active: true },
          include: {
            option_values: {
              where: { is_active: true },
              orderBy: { extra_price: 'asc' },
            },
          },
        },
        dish_images: {
          orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
        },
        dish_tags: {
          include: {
            tags: true,
          },
        },
        dish_ingredients: {
          include: {
            ingredients: true,
          },
        },
      },
    });

    if (!dish || dish.deleted_at || dish.availability === 'HIDDEN') {
      throw new NotFoundException(
        `Không tìm thấy món ăn với đường dẫn: ${slug}`,
      );
    }

    const startingPrice =
      dish.dish_variants.length > 0 ? Number(dish.dish_variants[0].price) : 0;

    return {
      id: dish.id.toString(),
      category_id: dish.category_id.toString(),
      category: dish.categories,
      name: dish.name,
      slug: dish.slug,
      description: dish.description,
      story: dish.story,
      spicy_level: dish.spicy_level,
      ingredient_data_status: dish.ingredient_data_status,
      availability: dish.availability,
      starting_price: startingPrice,
      variants: dish.dish_variants.map((v) => ({
        id: v.id.toString(),
        name: v.name,
        price: Number(v.price),
        is_active: v.is_active,
      })),
      option_groups: dish.option_groups.map((g) => ({
        id: g.id.toString(),
        name: g.name,
        min_select: g.min_select,
        max_select: g.max_select,
        options: g.option_values.map((ov) => ({
          id: ov.id.toString(),
          name: ov.name,
          extra_price: Number(ov.extra_price),
          is_active: ov.is_active,
        })),
      })),
      images: dish.dish_images,
      tags: dish.dish_tags.map((dt) => dt.tags),
      ingredients: dish.dish_ingredients.map((di) => ({
        id: di.ingredients.id.toString(),
        name: di.ingredients.name,
        code: di.ingredients.code,
        is_allergen: di.ingredients.is_allergen,
        note: di.note,
      })),
    };
  }

  // ==========================================
  // QUẢN TRỊ VIÊN: QUẢN LÝ MÓN ĂN (ADMIN)
  // ==========================================
  async findAllAdmin(query: QueryDishesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.dishesWhereInput = {
      deleted_at: null,
    };

    if (query.search) {
      where.name = { contains: query.search };
    }
    if (query.category_id) {
      where.category_id = BigInt(query.category_id);
    }
    if (query.availability) {
      where.availability = query.availability;
    }

    const [total, rawItems] = await Promise.all([
      this.prisma.dishes.count({ where }),
      this.prisma.dishes.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sort_order: 'asc' }, { id: 'desc' }],
        include: {
          categories: { select: { id: true, name: true } },
          dish_variants: {
            select: { id: true, name: true, price: true, is_active: true },
          },
          dish_images: {
            where: { kind: 'COVER' },
            select: { id: true, asset_path: true, alt_text: true, kind: true },
            take: 1,
          },
          _count: {
            select: {
              dish_variants: true,
              option_groups: true,
              dish_images: true,
            },
          },
        },
      }),
    ]);

    const items = rawItems.map((d) => ({
      ...d,
      variants: d.dish_variants,
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async ensureDishExists(id: bigint) {
    const dish = await this.prisma.dishes.findUnique({
      where: { id },
      select: { id: true, slug: true, deleted_at: true },
    });
    if (!dish || dish.deleted_at) {
      throw new NotFoundException(`Không tìm thấy món ăn ID: ${id}`);
    }
    return dish;
  }

  async findById(id: string) {
    const dish = await this.prisma.dishes.findUnique({
      where: { id: BigInt(id) },
      include: {
        categories: true,
        dish_variants: true,
        option_groups: {
          include: { option_values: true },
        },
        dish_images: true,
        dish_tags: { include: { tags: true } },
        dish_ingredients: { include: { ingredients: true } },
      },
    });

    if (!dish || dish.deleted_at) {
      throw new NotFoundException(`Không tìm thấy món ăn ID: ${id}`);
    }
    return dish;
  }

  async create(dto: CreateDishDto) {
    const categoryBigInt = BigInt(dto.category_id);
    const category = await this.prisma.categories.findUnique({
      where: { id: categoryBigInt },
    });
    if (!category) {
      throw new NotFoundException(
        `Không tìm thấy danh mục ID: ${dto.category_id}`,
      );
    }

    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    const existingSlug = await this.prisma.dishes.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Slug món '${slug}' đã tồn tại!`);
    }

    const availability =
      (dto.availability as dishes_availability) ??
      dishes_availability.AVAILABLE;
    const ingredientStatus =
      (dto.ingredient_data_status as dishes_ingredient_data_status) ??
      dishes_ingredient_data_status.UNKNOWN;

    // Tối ưu: Tạo món và biến thể tiêu chuẩn trong đúng 1 câu INSERT lồng (Nested Write)
    const dish = await this.prisma.dishes.create({
      data: {
        category_id: categoryBigInt,
        name: dto.name,
        slug,
        description: dto.description ?? null,
        story: dto.story ?? null,
        spicy_level: dto.spicy_level ?? null,
        ingredient_data_status: ingredientStatus,
        availability,
        sort_order: dto.sort_order ?? 0,
        dish_variants: {
          create: {
            name: dto.default_variant.name || 'Tiêu chuẩn',
            price: dto.default_variant.price,
            is_active: true,
          },
        },
      },
      include: {
        dish_variants: true,
      },
    });

    return {
      ...dish,
      default_variant: dish.dish_variants[0],
    };
  }

  async update(id: string, dto: UpdateDishDto) {
    const dishBigInt = BigInt(id);
    await this.ensureDishExists(dishBigInt);

    let slug = dto.slug ? slugify(dto.slug) : undefined;
    if (!slug && dto.name) {
      slug = slugify(dto.name);
    }

    if (slug) {
      const existing = await this.prisma.dishes.findUnique({
        where: { slug },
      });
      if (existing && existing.id !== dishBigInt) {
        throw new ConflictException(`Slug món '${slug}' đã được sử dụng!`);
      }
    }

    const availability = dto.availability
      ? (dto.availability as dishes_availability)
      : undefined;
    const ingredientStatus = dto.ingredient_data_status
      ? (dto.ingredient_data_status as dishes_ingredient_data_status)
      : undefined;

    return this.prisma.dishes.update({
      where: { id: dishBigInt },
      data: {
        category_id: dto.category_id ? BigInt(dto.category_id) : undefined,
        name: dto.name,
        slug,
        description: dto.description,
        story: dto.story,
        spicy_level: dto.spicy_level,
        ingredient_data_status: ingredientStatus,
        availability,
        sort_order: dto.sort_order,
      },
    });
  }

  async updateAvailability(id: string, availability: DishAvailability) {
    const dishBigInt = BigInt(id);
    await this.ensureDishExists(dishBigInt);

    // Kiểm tra BR-03: Nếu muốn chuyển sang AVAILABLE, bắt buộc phải có ít nhất 1 biến thể active
    if (availability === DishAvailability.AVAILABLE) {
      const activeVariantCount = await this.prisma.dish_variants.count({
        where: { dish_id: dishBigInt, is_active: true },
      });
      if (activeVariantCount === 0) {
        throw new BadRequestException(
          'Không thể mở bán món ăn (AVAILABLE) khi chưa có bất kỳ biến thể nào đang hoạt động (BR-03)!',
        );
      }
    }

    return this.prisma.dishes.update({
      where: { id: dishBigInt },
      data: {
        availability: availability as dishes_availability,
      },
    });
  }

  async softDelete(id: string) {
    const dishBigInt = BigInt(id);
    const dish = await this.ensureDishExists(dishBigInt);

    // Xóa mềm: gán deleted_at = new Date(), chuyển availability sang HIDDEN (BR-33),
    // đồng thời giải phóng slug gốc bằng cách gắn hậu tố timestamp để có thể tạo lại món cùng tên.
    // Giới hạn slug gốc ở 160 ký tự để tổng độ dài không bao giờ vượt quá VARCHAR(180) của database.
    const safeBaseSlug = dish.slug.slice(0, 160);
    const deletedSlug = `${safeBaseSlug}_del_${Date.now()}`;

    return this.prisma.dishes.update({
      where: { id: dishBigInt },
      data: {
        deleted_at: new Date(),
        availability: dishes_availability.HIDDEN,
        slug: deletedSlug,
      },
    });
  }
}
