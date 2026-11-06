import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { AddToCartDto } from '../dto/add-to-cart.dto.js';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto.js';
import { MergeCartDto } from '../dto/merge-cart.dto.js';
import { dishes_availability } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy hoặc tạo giỏ hàng cho người dùng
  async getOrCreateCart(userId: string) {
    const uId = BigInt(userId);
    return this.prisma.carts.upsert({
      where: { user_id: uId },
      update: {},
      create: { user_id: uId },
    });
  }

  // 1. Xem chi tiết giỏ hàng hiện tại (Tính lại giá theo DB & gắn cờ cảnh báo - BR-06, ASM-04)
  async getCart(userId: string, existingCart?: { id: bigint }) {
    const cart = existingCart || (await this.getOrCreateCart(userId));

    const items = await this.prisma.cart_items.findMany({
      where: { cart_id: cart.id },
      include: {
        dish_variants: {
          select: {
            id: true,
            name: true,
            price: true,
            is_active: true,
            dishes: {
              select: {
                id: true,
                name: true,
                slug: true,
                availability: true,
                deleted_at: true,
                categories: { select: { is_active: true } },
                dish_images: {
                  where: { kind: 'COVER' },
                  select: { asset_path: true, alt_text: true },
                  take: 1,
                },
              },
            },
          },
        },
        cart_item_options: {
          include: {
            option_values: {
              select: {
                id: true,
                group_id: true,
                name: true,
                extra_price: true,
                is_active: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    let totalQuantity = 0;
    let subtotal = 0;

    const formattedItems = items.map((item) => {
      const dish = item.dish_variants.dishes;
      const basePrice = Number(item.dish_variants.price);
      const optionsPrice = item.cart_item_options.reduce(
        (sum, opt) => sum + Number(opt.option_values.extra_price),
        0,
      );
      const unitPrice = basePrice + optionsPrice;
      const lineTotal = unitPrice * item.quantity;

      const isCategoryActive = (dish as any).categories?.is_active ?? true;
      const isDishAvailable =
        dish.availability === dishes_availability.AVAILABLE &&
        !dish.deleted_at &&
        isCategoryActive;
      const isVariantAvailable = item.dish_variants.is_active;
      const areOptionsAvailable = item.cart_item_options.every(
        (opt) => opt.option_values.is_active,
      );

      const isAvailable =
        isDishAvailable && isVariantAvailable && areOptionsAvailable;

      let warning: string | null = null;
      if (!isCategoryActive) {
        warning = 'Danh mục món ăn hiện đang tạm đóng.';
      } else if (!isDishAvailable) {
        warning = 'Món ăn đã ngừng bán hoặc tạm ngưng phục vụ.';
      } else if (!isVariantAvailable) {
        warning = 'Biến thể món này tạm ngưng phục vụ.';
      } else if (!areOptionsAvailable) {
        warning = 'Một hoặc nhiều tùy chọn đã tạm hết.';
      }

      if (isAvailable) {
        totalQuantity += item.quantity;
        subtotal += lineTotal;
      }

      return {
        id: item.id.toString(),
        dish_id: item.dish_id.toString(),
        variant_id: item.variant_id.toString(),
        dish_name: dish.name,
        dish_slug: dish.slug,
        cover_image: dish.dish_images[0] ?? null,
        variant_name: item.dish_variants.name,
        quantity: item.quantity,
        note: item.note,
        base_price: basePrice,
        options_price: optionsPrice,
        unit_price: unitPrice,
        line_total: lineTotal,
        is_available: isAvailable,
        warning,
        options: item.cart_item_options.map((opt) => ({
          option_value_id: opt.option_value_id.toString(),
          name: opt.option_values.name,
          extra_price: Number(opt.option_values.extra_price),
          is_active: opt.option_values.is_active,
        })),
      };
    });

    return {
      cart_id: cart.id.toString(),
      item_count: formattedItems.length,
      total_quantity: totalQuantity,
      subtotal,
      items: formattedItems,
    };
  }

  // 2. Thêm món vào giỏ (BR-04, BR-09, ASM-06)
  async addToCart(
    userId: string,
    dto: AddToCartDto,
    returnCart: boolean = true,
  ) {
    const cart = await this.getOrCreateCart(userId);
    const dishId = BigInt(dto.dish_id);
    const variantId = BigInt(dto.variant_id);
    const rawOptionIds = (dto.option_value_ids || []).map((id) => BigInt(id));
    const optionIds = Array.from(new Set(rawOptionIds));
    const quantity = dto.quantity ?? 1;
    const note = dto.note?.trim() || null;

    // 1. Kiểm tra món ăn đang mở bán (BR-04)
    const dish = await this.prisma.dishes.findUnique({
      where: { id: dishId },
      include: {
        categories: { select: { is_active: true } },
        option_groups: {
          where: { is_active: true },
          include: {
            option_values: {
              where: { is_active: true },
            },
          },
        },
      },
    });

    if (
      !dish ||
      dish.deleted_at !== null ||
      dish.availability !== dishes_availability.AVAILABLE ||
      dish.categories?.is_active === false
    ) {
      throw new BadRequestException(
        'Món ăn hiện không khả dụng để thêm vào giỏ.',
      );
    }

    // 2. Kiểm tra biến thể thuộc về món và đang hoạt động (BR-04)
    const variant = await this.prisma.dish_variants.findUnique({
      where: {
        id_dish_id: { id: variantId, dish_id: dishId },
      },
    });

    if (!variant || !variant.is_active) {
      throw new BadRequestException(
        'Biến thể món ăn không tồn tại hoặc đã ngưng bán.',
      );
    }

    // 3. Kiểm tra tính hợp lệ của các tùy chọn (BR-04)
    const activeValuesMap = new Map<string, { id: bigint; group_id: bigint }>();
    const groupMap = new Map<
      string,
      { id: bigint; name: string; min_select: number; max_select: number }
    >();

    for (const group of dish.option_groups) {
      groupMap.set(group.id.toString(), {
        id: group.id,
        name: group.name,
        min_select: group.min_select,
        max_select: group.max_select,
      });
      for (const val of group.option_values) {
        activeValuesMap.set(val.id.toString(), {
          id: val.id,
          group_id: group.id,
        });
      }
    }

    const groupSelectionCounts = new Map<string, number>();

    for (const optId of optionIds) {
      const optVal = activeValuesMap.get(optId.toString());
      if (!optVal) {
        throw new BadRequestException(
          `Tùy chọn ID ${optId} không hợp lệ hoặc đã ngừng hoạt động cho món này.`,
        );
      }
      const gId = optVal.group_id.toString();
      groupSelectionCounts.set(gId, (groupSelectionCounts.get(gId) || 0) + 1);
    }

    // Ràng buộc min_select / max_select (BR-04)
    for (const group of dish.option_groups) {
      const count = groupSelectionCounts.get(group.id.toString()) || 0;
      if (count < group.min_select) {
        throw new BadRequestException(
          `Vui lòng chọn ít nhất ${group.min_select} lựa chọn cho nhóm "${group.name}".`,
        );
      }
      if (count > group.max_select) {
        throw new BadRequestException(
          `Nhóm "${group.name}" chỉ được phép chọn tối đa ${group.max_select} lựa chọn.`,
        );
      }
    }

    // 4. Kiểm tra dòng giỏ trùng hoàn toàn (BR-09)
    const existingItems = await this.prisma.cart_items.findMany({
      where: {
        cart_id: cart.id,
        dish_id: dishId,
        variant_id: variantId,
      },
      include: {
        cart_item_options: true,
      },
    });

    const sortedNewOptIds = optionIds.map((id) => id.toString()).sort();

    const matchedItem = existingItems.find((item) => {
      const itemNote = item.note || null;
      if (itemNote !== note) return false;

      const existingOptIds = item.cart_item_options
        .map((o) => o.option_value_id.toString())
        .sort();

      if (existingOptIds.length !== sortedNewOptIds.length) return false;
      return existingOptIds.every((id, idx) => id === sortedNewOptIds[idx]);
    });

    if (matchedItem) {
      const newQty = matchedItem.quantity + quantity;
      if (newQty > 99) {
        throw new BadRequestException(
          `Số lượng tối đa cho mỗi món là 99 (hiện tại trong giỏ đã có ${matchedItem.quantity}).`,
        );
      }

      await this.prisma.cart_items.update({
        where: { id: matchedItem.id },
        data: { quantity: newQty },
      });
    } else {
      if (quantity > 99) {
        throw new BadRequestException('Số lượng tối đa cho mỗi món là 99.');
      }

      await this.prisma.cart_items.create({
        data: {
          cart_id: cart.id,
          dish_id: dishId,
          variant_id: variantId,
          quantity,
          note,
          ...(optionIds.length > 0
            ? {
                cart_item_options: {
                  create: optionIds.map((optId) => ({
                    option_value_id: optId,
                  })),
                },
              }
            : {}),
        },
      });
    }

    if (!returnCart) {
      return null as any;
    }

    return this.getCart(userId, cart);
  }

  // 3. Cập nhật số lượng hoặc ghi chú của một dòng giỏ
  async updateCartItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const iId = BigInt(itemId);

    const item = await this.prisma.cart_items.findFirst({
      where: {
        id: iId,
        cart_id: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy dòng món trong giỏ hàng.');
    }

    const data: { quantity?: number; note?: string | null } = {};
    if (dto.quantity !== undefined) {
      data.quantity = dto.quantity;
    }
    if (dto.note !== undefined) {
      data.note = dto.note.trim() || null;
    }

    await this.prisma.cart_items.update({
      where: { id: iId },
      data,
    });

    return this.getCart(userId, cart);
  }

  // 4. Xóa một dòng món khỏi giỏ
  async removeCartItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const iId = BigInt(itemId);

    const item = await this.prisma.cart_items.findFirst({
      where: {
        id: iId,
        cart_id: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy dòng món trong giỏ hàng.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.cart_item_options.deleteMany({
        where: { cart_item_id: iId },
      });
      await tx.cart_items.delete({
        where: { id: iId },
      });
    });

    return this.getCart(userId, cart);
  }

  // 5. Làm rỗng giỏ hàng
  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const cartItems = await this.prisma.cart_items.findMany({
      where: { cart_id: cart.id },
      select: { id: true },
    });

    const itemIds = cartItems.map((ci) => ci.id);

    if (itemIds.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.cart_item_options.deleteMany({
          where: { cart_item_id: { in: itemIds } },
        });
        await tx.cart_items.deleteMany({
          where: { cart_id: cart.id },
        });
      });
    }

    return {
      message: 'Đã làm rỗng giỏ hàng.',
      cart_id: cart.id.toString(),
      item_count: 0,
      total_quantity: 0,
      subtotal: 0,
      items: [],
    };
  }

  // 6. Hợp nhất giỏ khách vãng lai sau khi đăng nhập
  async mergeCart(userId: string, dto: MergeCartDto) {
    if (!dto.items || dto.items.length === 0) {
      return this.getCart(userId);
    }

    for (const item of dto.items) {
      try {
        await this.addToCart(userId, item, false);
      } catch {
        continue;
      }
    }

    return this.getCart(userId);
  }
}
