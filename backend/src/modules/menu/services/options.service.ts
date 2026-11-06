import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import {
  CreateOptionGroupDto,
  UpdateOptionGroupDto,
} from '../dto/create-option-group.dto.js';
import {
  CreateOptionValueDto,
  UpdateOptionValueDto,
} from '../dto/create-option-value.dto.js';

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findGroupsByDishId(dishId: string) {
    return this.prisma.option_groups.findMany({
      where: { dish_id: BigInt(dishId) },
      include: {
        option_values: {
          orderBy: { extra_price: 'asc' },
        },
      },
    });
  }

  // ==========================================
  // NHÓM TÙY CHỌN (OPTION GROUPS)
  // ==========================================
  async createGroup(dishId: string, dto: CreateOptionGroupDto) {
    const dishBigInt = BigInt(dishId);
    const minSelect = dto.min_select ?? 0;
    const maxSelect = dto.max_select ?? 1;

    if (maxSelect < minSelect) {
      throw new BadRequestException(
        'max_select không được nhỏ hơn min_select!',
      );
    }

    return this.prisma.option_groups.create({
      data: {
        dish_id: dishBigInt,
        name: dto.name,
        min_select: minSelect,
        max_select: maxSelect,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async updateGroup(
    dishId: string,
    groupId: string,
    dto: UpdateOptionGroupDto,
  ) {
    const group = await this.prisma.option_groups.findFirst({
      where: { id: BigInt(groupId), dish_id: BigInt(dishId) },
    });
    if (!group) {
      throw new NotFoundException(
        `Không tìm thấy nhóm tùy chọn ID: ${groupId} thuộc món ID: ${dishId}`,
      );
    }

    const minSelect = dto.min_select ?? group.min_select;
    const maxSelect = dto.max_select ?? group.max_select;

    if (maxSelect < minSelect) {
      throw new BadRequestException(
        'max_select không được nhỏ hơn min_select!',
      );
    }

    return this.prisma.option_groups.update({
      where: { id: BigInt(groupId) },
      data: {
        name: dto.name,
        min_select: dto.min_select,
        max_select: dto.max_select,
        is_active: dto.is_active,
      },
    });
  }

  async removeGroup(dishId: string, groupId: string) {
    const groupBigInt = BigInt(groupId);
    const dishBigInt = BigInt(dishId);

    const group = await this.prisma.option_groups.findFirst({
      where: { id: groupBigInt, dish_id: dishBigInt },
    });
    if (!group) {
      throw new NotFoundException(
        `Không tìm thấy nhóm tùy chọn ID: ${groupId} thuộc món ID: ${dishId}`,
      );
    }

    // Đưa toàn bộ kiểm tra ràng buộc đơn hàng và xóa cascade vào trong 1 Transaction nguyên tử
    return this.prisma.$transaction(async (tx) => {
      const usedCount = await tx.order_item_options.count({
        where: {
          option_values: {
            group_id: groupBigInt,
          },
        },
      });

      if (usedCount > 0) {
        throw new BadRequestException(
          'Nhóm tùy chọn này có giá trị đã được mua trong đơn hàng cũ (BR-33), không thể xóa cứng! Hãy chuyển is_active = false.',
        );
      }

      await tx.option_values.deleteMany({
        where: { group_id: groupBigInt, dish_id: dishBigInt },
      });

      return tx.option_groups.delete({
        where: { id: groupBigInt },
      });
    });
  }

  // ==========================================
  // GIÁ TRỊ TÙY CHỌN (OPTION VALUES)
  // ==========================================
  async createValue(
    dishId: string,
    groupId: string,
    dto: CreateOptionValueDto,
  ) {
    const dishBigInt = BigInt(dishId);
    const groupBigInt = BigInt(groupId);

    const group = await this.prisma.option_groups.findFirst({
      where: { id: groupBigInt, dish_id: dishBigInt },
    });
    if (!group) {
      throw new NotFoundException(
        `Nhóm tùy chọn ID: ${groupId} không thuộc món ID: ${dishId}`,
      );
    }

    const existingName = await this.prisma.option_values.findFirst({
      where: { group_id: groupBigInt, name: dto.name },
    });
    if (existingName) {
      throw new ConflictException(
        `Nhóm đã có lựa chọn mang tên '${dto.name}'!`,
      );
    }

    return this.prisma.option_values.create({
      data: {
        group_id: groupBigInt,
        dish_id: dishBigInt,
        name: dto.name,
        extra_price: dto.extra_price ?? 0,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async updateValue(
    dishId: string,
    groupId: string,
    valueId: string,
    dto: UpdateOptionValueDto,
  ) {
    const dishBigInt = BigInt(dishId);
    const groupBigInt = BigInt(groupId);
    const valBigInt = BigInt(valueId);

    const value = await this.prisma.option_values.findFirst({
      where: { id: valBigInt, group_id: groupBigInt, dish_id: dishBigInt },
    });
    if (!value) {
      throw new NotFoundException(`Không tìm thấy lựa chọn ID: ${valueId}`);
    }

    if (dto.name && dto.name !== value.name) {
      const existingName = await this.prisma.option_values.findFirst({
        where: { group_id: groupBigInt, name: dto.name },
      });
      if (existingName) {
        throw new ConflictException(
          `Nhóm đã có lựa chọn mang tên '${dto.name}'!`,
        );
      }
    }

    return this.prisma.option_values.update({
      where: { id: valBigInt },
      data: {
        name: dto.name,
        extra_price:
          dto.extra_price !== undefined ? dto.extra_price : undefined,
        is_active: dto.is_active,
      },
    });
  }

  async removeValue(dishId: string, groupId: string, valueId: string) {
    const valBigInt = BigInt(valueId);

    // Kiểm tra BR-33
    const usedCount = await this.prisma.order_item_options.count({
      where: { option_value_id: valBigInt },
    });
    if (usedCount > 0) {
      throw new BadRequestException(
        'Lựa chọn này đã được ghi nhận trong đơn hàng cũ (BR-33), không thể xóa cứng! Hãy chuyển is_active = false.',
      );
    }

    return this.prisma.option_values.delete({
      where: { id: valBigInt },
    });
  }
}
