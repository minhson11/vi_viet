import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { CreateStorySectionDto } from '../dto/create-story-section.dto.js';
import { UpdateStorySectionDto } from '../dto/update-story-section.dto.js';
import { story_sections_animation_preset } from '@prisma/client';

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Chuyển đổi từ Prisma story_sections sang CategoryStoryShowcase model của Frontend
  private mapToCategoryStoryShowcase(section: any): any {
    const extra = (section.extra_assets as Record<string, any>) || {};

    let animType: 'roll' | '3dflip' | 'spiral' = 'roll';
    if (extra.animation_type) {
      animType = extra.animation_type;
    } else if (
      section.animation_preset === story_sections_animation_preset.SLIDE_RIGHT
    ) {
      animType = '3dflip';
    } else if (
      section.animation_preset === story_sections_animation_preset.RISE
    ) {
      animType = 'spiral';
    }

    const normalizeFlavor = (val: any, defaultText: string = ''): string => {
      if (!val) return defaultText;
      if (typeof val === 'string') return val;
      return val.note || val.title || defaultText;
    };

    const flavors = extra.flavors
      ? {
          top: normalizeFlavor(
            extra.flavors.top,
            'Hương thơm thanh tao dịu nhẹ',
          ),
          heart: normalizeFlavor(
            extra.flavors.heart,
            'Vị ngọt sâu từ nguyên liệu ninh chậm',
          ),
          base: normalizeFlavor(
            extra.flavors.base,
            'Hậu vị đậm đà ấm áp lưu luyến',
          ),
        }
      : {
          top: 'Hương thơm thanh tao dịu nhẹ',
          heart: 'Vị ngọt sâu từ nguyên liệu ninh chậm',
          base: 'Hậu vị đậm đà ấm áp lưu luyến',
        };

    return {
      id: section.id.toString(),
      categoryId:
        extra.category_id || section.dishes?.category_id?.toString() || '',
      categoryName: extra.category_name || section.chapter_label || '',
      categorySlug: extra.category_slug || '',
      badgeTag: extra.badge_tag || section.chapter_label || '',
      headlineTitle: extra.headline_title || section.headline || '',
      headlineHighlight: extra.headline_highlight || '',
      description: extra.description || section.body || '',
      themeColor: extra.theme_color || 'primary',
      animationType: animType,
      badgeTop: extra.badge_top || '',
      badgeBottom: extra.badge_bottom || '',
      flavors,
      mainDish: section.dishes
        ? {
            id: section.dishes.id.toString(),
            name: section.dishes.name,
            slug: section.dishes.slug,
            image:
              section.dish_images?.asset_path ||
              section.dishes.dish_images?.find(
                (img: any) => img.kind === 'COVER',
              )?.asset_path ||
              section.dishes.dish_images?.[0]?.asset_path ||
              extra.main_dish?.image ||
              '',
            price:
              extra.main_dish?.price !== undefined
                ? Number(extra.main_dish.price)
                : section.dishes.dish_variants?.[0]?.price
                  ? Number(section.dishes.dish_variants[0].price)
                  : 0,
          }
        : extra.main_dish || null,
      satelliteDishes: extra.satellite_dishes || [],
      isActive: section.is_published,
      sortOrder: section.sort_order,
    };
  }

  // Chuyển đổi enum animation_preset Prisma
  private mapAnimationPreset(
    animType?: string,
  ): story_sections_animation_preset {
    if (animType === '3dflip')
      return story_sections_animation_preset.SLIDE_RIGHT;
    if (animType === 'spiral') return story_sections_animation_preset.RISE;
    return story_sections_animation_preset.ROLL_LEFT;
  }

  // ==========================================
  // 1. PUBLIC API (CHO TRANG CHỦ STOREFRONT)
  // ==========================================
  async findAllPublic(): Promise<any[]> {
    const sections = await this.prisma.story_sections.findMany({
      where: {
        is_published: true,
        dishes: {
          deleted_at: null,
          availability: 'AVAILABLE',
        },
      },
      orderBy: { sort_order: 'asc' },
      include: {
        dishes: {
          include: {
            dish_images: true,
            dish_variants: true,
          },
        },
        dish_images: true,
      },
    });

    return sections.map((sec) => this.mapToCategoryStoryShowcase(sec));
  }

  // ==========================================
  // 2. ADMIN API (CHO TRANG QUẢN TRỊ ADMIN/CONTENT)
  // ==========================================
  async findAllAdmin(): Promise<any[]> {
    const sections = await this.prisma.story_sections.findMany({
      orderBy: { sort_order: 'asc' },
      include: {
        dishes: {
          include: {
            dish_images: true,
            dish_variants: true,
          },
        },
        dish_images: true,
      },
    });

    return sections.map((sec) => this.mapToCategoryStoryShowcase(sec));
  }

  async findOne(id: string): Promise<any> {
    const section = await this.prisma.story_sections.findUnique({
      where: { id: BigInt(id) },
      include: {
        dishes: {
          include: {
            dish_images: true,
            dish_variants: true,
          },
        },
        dish_images: true,
      },
    });
    if (!section) {
      throw new NotFoundException(`Không tìm thấy phân cảnh câu chuyện #${id}`);
    }
    return this.mapToCategoryStoryShowcase(section);
  }

  async create(dto: CreateStorySectionDto): Promise<any> {
    let dishId: bigint = 1n;
    if (dto.mainDish?.id && !isNaN(Number(dto.mainDish.id))) {
      dishId = BigInt(dto.mainDish.id);
    } else {
      const firstDish = await this.prisma.dishes.findFirst({
        where: { deleted_at: null },
      });
      if (firstDish) dishId = firstDish.id;
    }

    const created = await this.prisma.story_sections.create({
      data: {
        dish_id: dishId,
        chapter_label: dto.badgeTag || dto.categoryName || '',
        headline: dto.headlineTitle || '',
        body: dto.description || '',
        cta_label: dto.categoryName
          ? `Khám Phá Danh Mục ${dto.categoryName}`
          : '',
        background_color: '#fff8f6',
        text_color: '#1c1917',
        animation_preset: this.mapAnimationPreset(dto.animationType),
        sort_order: dto.sortOrder || 0,
        is_published: dto.isActive !== false,
        extra_assets: {
          category_id: dto.categoryId,
          category_name: dto.categoryName,
          category_slug: dto.categorySlug,
          badge_tag: dto.badgeTag,
          headline_title: dto.headlineTitle,
          headline_highlight: dto.headlineHighlight,
          description: dto.description,
          theme_color: dto.themeColor || 'primary',
          animation_type: dto.animationType || 'roll',
          badge_top: dto.badgeTop,
          badge_bottom: dto.badgeBottom,
          flavors: dto.flavors,
          main_dish: dto.mainDish,
          satellite_dishes: dto.satelliteDishes || [],
        } as any,
      },
      include: {
        dishes: {
          include: {
            dish_images: true,
            dish_variants: true,
          },
        },
        dish_images: true,
      },
    });

    return this.mapToCategoryStoryShowcase(created);
  }

  async update(id: string, dto: UpdateStorySectionDto): Promise<any> {
    const existing = await this.prisma.story_sections.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(
        `Không tìm thấy phân cảnh #${id} để cập nhật`,
      );
    }

    const currentExtra = (existing.extra_assets as Record<string, any>) || {};
    const updatedExtra = {
      ...currentExtra,
      category_id: dto.categoryId ?? currentExtra.category_id,
      category_name: dto.categoryName ?? currentExtra.category_name,
      category_slug: dto.categorySlug ?? currentExtra.category_slug,
      badge_tag: dto.badgeTag ?? currentExtra.badge_tag,
      headline_title: dto.headlineTitle ?? currentExtra.headline_title,
      headline_highlight:
        dto.headlineHighlight ?? currentExtra.headline_highlight,
      description: dto.description ?? currentExtra.description,
      theme_color: dto.themeColor ?? currentExtra.theme_color,
      animation_type: dto.animationType ?? currentExtra.animation_type,
      badge_top: dto.badgeTop ?? currentExtra.badge_top,
      badge_bottom: dto.badgeBottom ?? currentExtra.badge_bottom,
      flavors: dto.flavors ?? currentExtra.flavors,
      main_dish: dto.mainDish ?? currentExtra.main_dish,
      satellite_dishes: dto.satelliteDishes ?? currentExtra.satellite_dishes,
    };

    let dishIdUpdate: bigint | undefined = undefined;
    if (dto.mainDish?.id && !isNaN(Number(dto.mainDish.id))) {
      dishIdUpdate = BigInt(dto.mainDish.id);
    }

    const updated = await this.prisma.story_sections.update({
      where: { id: BigInt(id) },
      data: {
        ...(dishIdUpdate ? { dish_id: dishIdUpdate } : {}),
        chapter_label:
          dto.badgeTag || dto.categoryName || existing.chapter_label,
        headline: dto.headlineTitle || existing.headline,
        body: dto.description ?? existing.body,
        cta_label: dto.categoryName
          ? `Khám Phá Danh Mục ${dto.categoryName}`
          : existing.cta_label,
        animation_preset: dto.animationType
          ? this.mapAnimationPreset(dto.animationType)
          : existing.animation_preset,
        sort_order: dto.sortOrder ?? existing.sort_order,
        is_published:
          dto.isActive !== undefined ? dto.isActive : existing.is_published,
        extra_assets: updatedExtra as any,
      },
      include: {
        dishes: {
          include: {
            dish_images: true,
            dish_variants: true,
          },
        },
        dish_images: true,
      },
    });

    return this.mapToCategoryStoryShowcase(updated);
  }

  async toggleActive(id: string): Promise<any> {
    const existing = await this.prisma.story_sections.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy phân cảnh #${id}`);
    }

    const updated = await this.prisma.story_sections.update({
      where: { id: BigInt(id) },
      data: {
        is_published: !existing.is_published,
      },
    });

    return { id: updated.id.toString(), isActive: updated.is_published };
  }

  async reorder(
    items: Array<{ id: string; sort_order: number }>,
  ): Promise<boolean> {
    const validItems = (items || []).filter(
      (it) => it.id && !isNaN(Number(it.id)),
    );
    if (validItems.length === 0) return true;
    await this.prisma.$transaction(
      validItems.map((it) =>
        this.prisma.story_sections.update({
          where: { id: BigInt(it.id) },
          data: { sort_order: it.sort_order },
        }),
      ),
    );
    return true;
  }

  async remove(id: string): Promise<boolean> {
    await this.prisma.story_sections.delete({
      where: { id: BigInt(id) },
    });
    return true;
  }

  async resetToDefaults(): Promise<any[]> {
    await this.prisma.story_sections.deleteMany({});
    return [];
  }
}
