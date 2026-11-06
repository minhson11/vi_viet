import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import {
  CreateVariantDto,
  UpdateVariantDto,
} from '../dto/create-variant.dto.js';

@Injectable()
export class VariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByDishId(dishId: string) {
    return this.prisma.dish_variants.findMany({
      where: { dish_id: BigInt(dishId) },
      orderBy: { price: 'asc' },
    });
  }

  async create(dishId: string, dto: CreateVariantDto) {
    const dishBigInt = BigInt(dishId);
    const dish = await this.prisma.dishes.findUnique({
      where: { id: dishBigInt },
    });
    if (!dish || dish.deleted_at) {
      throw new NotFoundException(`Không tìm thấy món ăn với ID: ${dishId}`);
    }

    const existingName = await this.prisma.dish_variants.findFirst({
      where: { dish_id: dishBigInt, name: dto.name },
    });
    if (existingName) {
      throw new ConflictException(`Món này đã có biến thể tên '${dto.name}'!`);
    }

    return this.prisma.dish_variants.create({
      data: {
        dish_id: dishBigInt,
        name: dto.name,
        price: dto.price,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async update(dishId: string, variantId: string, dto: UpdateVariantDto) {
    const dishBigInt = BigInt(dishId);
    const varBigInt = BigInt(variantId);

    const variant = await this.prisma.dish_variants.findFirst({
      where: { id: varBigInt, dish_id: dishBigInt },
    });
    if (!variant) {
      throw new NotFoundException(
        `Không tìm thấy biến thể ID: ${variantId} của món ID: ${dishId}`,
      );
    }

    // Kiểm tra tên trùng lặp nếu đổi tên
    if (dto.name && dto.name !== variant.name) {
      const existingName = await this.prisma.dish_variants.findFirst({
        where: { dish_id: dishBigInt, name: dto.name },
      });
      if (existingName) {
        throw new ConflictException(
          `Món này đã có biến thể tên '${dto.name}'!`,
        );
      }
    }

    // Kiểm tra BR-03: Nếu tắt is_active, đảm bảo món vẫn còn ít nhất 1 biến thể active khác nếu món đang mở bán
    if (dto.is_active === false && variant.is_active === true) {
      const dish = await this.prisma.dishes.findUnique({
        where: { id: dishBigInt },
      });
      if (dish && dish.availability === 'AVAILABLE') {
        const activeVariantsCount = await this.prisma.dish_variants.count({
          where: { dish_id: dishBigInt, is_active: true },
        });
        if (activeVariantsCount <= 1) {
          throw new BadRequestException(
            'Không thể tắt biến thể hoạt động duy nhất của món đang mở bán (BR-03)! Vui lòng chuyển trạng thái món sang Hết món hoặc Ẩn trước.',
          );
        }
      }
    }

    return this.prisma.dish_variants.update({
      where: { id: varBigInt },
      data: {
        name: dto.name,
        price: dto.price !== undefined ? dto.price : undefined,
        is_active: dto.is_active,
      },
    });
  }

  async remove(dishId: string, variantId: string) {
    const dishBigInt = BigInt(dishId);
    const varBigInt = BigInt(variantId);

    const variant = await this.prisma.dish_variants.findFirst({
      where: { id: varBigInt, dish_id: dishBigInt },
    });
    if (!variant) {
      throw new NotFoundException(
        `Không tìm thấy biến thể ID: ${variantId} thuộc món ID: ${dishId}`,
      );
    }

    // Kiểm tra xem biến thể đã có trong order_items chưa (BR-33)
    const orderItemsCount = await this.prisma.order_items.count({
      where: { variant_id: varBigInt },
    });
    if (orderItemsCount > 0) {
      throw new BadRequestException(
        'Biến thể này đã phát sinh đơn hàng trong quá khứ (BR-33), không thể xóa cứng! Hãy chuyển trạng thái is_active = false.',
      );
    }

    // Kiểm tra BR-03: Chỉ chặn xóa nếu biến thể này đang active và món đang mở bán mà không còn biến thể active nào khác
    if (variant.is_active) {
      const dish = await this.prisma.dishes.findUnique({
        where: { id: dishBigInt },
      });
      if (dish && dish.availability === 'AVAILABLE') {
        const activeVariantsCount = await this.prisma.dish_variants.count({
          where: { dish_id: dishBigInt, is_active: true },
        });
        if (activeVariantsCount <= 1) {
          throw new BadRequestException(
            'Món đang mở bán phải giữ ít nhất một biến thể hoạt động (BR-03)!',
          );
        }
      }
    }

    return this.prisma.dish_variants.delete({
      where: { id: varBigInt },
    });
  }
}
