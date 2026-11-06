import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DishIngredientDataStatus } from '../dto/create-dish.dto.js';
import { IngredientsAndTagsService } from './ingredients-tags.service.js';

function createHarness(existingIngredientCount: number) {
  const tx = {
    dishes: {
      findUnique: vi.fn().mockResolvedValue({ id: 10n, deleted_at: null }),
      update: vi.fn().mockResolvedValue({}),
    },
    ingredients: {
      count: vi.fn().mockResolvedValue(existingIngredientCount),
    },
    dish_ingredients: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  const prisma = {
    $transaction: vi.fn((callback) => callback(tx)),
  };
  return {
    tx,
    service: new IngredientsAndTagsService(prisma as never),
  };
}

describe('IngredientsAndTagsService.assignIngredientsToDish', () => {
  it('deduplicates ingredients and updates links with status atomically', async () => {
    const { service, tx } = createHarness(1);

    await service.assignIngredientsToDish('10', {
      ingredient_data_status: DishIngredientDataStatus.VERIFIED,
      ingredients: [
        { ingredient_id: '2', note: ' thái mỏng ' },
        { ingredient_id: '2', note: 'ignored duplicate' },
      ],
    });

    expect(tx.dish_ingredients.createMany).toHaveBeenCalledWith({
      data: [{ dish_id: 10n, ingredient_id: 2n, note: 'thái mỏng' }],
    });
    expect(tx.dishes.update).toHaveBeenCalledWith({
      where: { id: 10n },
      data: { ingredient_data_status: 'VERIFIED' },
    });
  });

  it('rejects unknown ingredients before replacing existing links', async () => {
    const { service, tx } = createHarness(0);

    await expect(
      service.assignIngredientsToDish('10', {
        ingredients: [{ ingredient_id: '99' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.dish_ingredients.deleteMany).not.toHaveBeenCalled();
  });

  it('accepts an empty list to clear links and resets status', async () => {
    const { service, tx } = createHarness(0);

    await service.assignIngredientsToDish('10', { ingredients: [] });

    expect(tx.dish_ingredients.deleteMany).toHaveBeenCalled();
    expect(tx.dish_ingredients.createMany).not.toHaveBeenCalled();
    expect(tx.dishes.update).toHaveBeenCalledWith({
      where: { id: 10n },
      data: { ingredient_data_status: 'UNKNOWN' },
    });
  });
});
