import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { dishes_ingredient_data_status } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service.js';
import { slugify } from '../../../common/utils/slug.util.js';
import { AssignTagsDto } from '../dto/assign-tags.dto.js';
import { AssignIngredientsDto } from '../dto/assign-ingredients.dto.js';
import { CreateIngredientDto } from '../dto/create-ingredient.dto.js';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto.js';

@Injectable()
export class IngredientsAndTagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllTags() {
    return this.prisma.tags.findMany({ orderBy: { name: 'asc' } });
  }

  async createTag(name: string, code?: string) {
    const tagCode = code ? code.toLowerCase().trim() : slugify(name);
    const existing = await this.prisma.tags.findUnique({
      where: { code: tagCode },
    });
    if (existing) {
      throw new ConflictException(`Tag với mã '${tagCode}' đã tồn tại.`);
    }
    return this.prisma.tags.create({
      data: { code: tagCode, name: name.trim() },
    });
  }

  async assignTagsToDish(dishId: string, dto: AssignTagsDto) {
    const dishBigInt = BigInt(dishId);
    const dish = await this.prisma.dishes.findUnique({
      where: { id: dishBigInt },
    });
    if (!dish || dish.deleted_at) {
      throw new NotFoundException(`Không tìm thấy món ăn ID: ${dishId}`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.dish_tags.deleteMany({ where: { dish_id: dishBigInt } });
      const uniqueTagIds = [...new Set(dto.tag_ids)];
      if (uniqueTagIds.length > 0) {
        await tx.dish_tags.createMany({
          data: uniqueTagIds.map((tagId) => ({
            dish_id: dishBigInt,
            tag_id: BigInt(tagId),
          })),
        });
      }
      return tx.dish_tags.findMany({
        where: { dish_id: dishBigInt },
        include: { tags: true },
      });
    });
  }

  async findAllIngredients() {
    return this.prisma.ingredients.findMany({ orderBy: { name: 'asc' } });
  }

  async createIngredient(dto: CreateIngredientDto) {
    const name = dto.name.trim();
    const code = dto.code?.trim() || slugify(name);
    const existing = await this.prisma.ingredients.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`Nguyên liệu với mã '${code}' đã tồn tại.`);
    }
    return this.prisma.ingredients.create({
      data: {
        name,
        code,
        is_allergen: dto.is_allergen ?? false,
      },
    });
  }

  async updateIngredient(id: string, dto: UpdateIngredientDto) {
    const ingredientId = BigInt(id);
    const existing = await this.prisma.ingredients.findUnique({
      where: { id: ingredientId },
    });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy nguyên liệu ID: ${id}`);
    }
    return this.prisma.ingredients.update({
      where: { id: ingredientId },
      data: {
        name: dto.name?.trim(),
        is_allergen: dto.is_allergen,
      },
    });
  }

  async assignIngredientsToDish(dishId: string, dto: AssignIngredientsDto) {
    const dishBigInt = BigInt(dishId);
    const seen = new Set<string>();
    const uniqueIngredients = dto.ingredients.filter((item) => {
      if (seen.has(item.ingredient_id)) return false;
      seen.add(item.ingredient_id);
      return true;
    });
    const ingredientIds = uniqueIngredients.map((item) =>
      BigInt(item.ingredient_id),
    );
    const requestedStatus =
      dto.ingredient_data_status as dishes_ingredient_data_status | undefined;
    const status =
      ingredientIds.length === 0
        ? dishes_ingredient_data_status.UNKNOWN
        : !requestedStatus ||
            requestedStatus === dishes_ingredient_data_status.UNKNOWN
          ? dishes_ingredient_data_status.PARTIAL
          : requestedStatus;

    return this.prisma.$transaction(async (tx) => {
      const dish = await tx.dishes.findUnique({ where: { id: dishBigInt } });
      if (!dish || dish.deleted_at) {
        throw new NotFoundException(`Không tìm thấy món ăn ID: ${dishId}`);
      }

      if (ingredientIds.length > 0) {
        const existingCount = await tx.ingredients.count({
          where: { id: { in: ingredientIds } },
        });
        if (existingCount !== ingredientIds.length) {
          throw new BadRequestException(
            'Danh sách chứa nguyên liệu không tồn tại.',
          );
        }
      }

      await tx.dish_ingredients.deleteMany({
        where: { dish_id: dishBigInt },
      });
      if (uniqueIngredients.length > 0) {
        await tx.dish_ingredients.createMany({
          data: uniqueIngredients.map((item) => ({
            dish_id: dishBigInt,
            ingredient_id: BigInt(item.ingredient_id),
            note: item.note?.trim() || null,
          })),
        });
      }
      await tx.dishes.update({
        where: { id: dishBigInt },
        data: { ingredient_data_status: status },
      });

      return tx.dish_ingredients.findMany({
        where: { dish_id: dishBigInt },
        include: { ingredients: true },
      });
    });
  }
}
