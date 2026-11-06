import { vi } from 'vitest';
import { MenuImportService } from './menu-import.service.js';

describe('MenuImportService', () => {
  it('imports all menu entities through one transaction', async () => {
    const tx = {
      categories: {
        create: vi.fn().mockResolvedValue({ id: 1n }),
        update: vi.fn(),
      },
      ingredients: {
        create: vi.fn().mockResolvedValue({ id: 2n }),
        update: vi.fn(),
      },
      tags: {
        create: vi.fn().mockResolvedValue({ id: 3n }),
        update: vi.fn(),
      },
      dishes: { create: vi.fn().mockResolvedValue({ id: 10n }), update: vi.fn() },
      dish_variants: { create: vi.fn(), update: vi.fn() },
      dish_ingredients: { deleteMany: vi.fn(), createMany: vi.fn() },
      dish_tags: { deleteMany: vi.fn(), createMany: vi.fn() },
      dish_images: {
        updateMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      option_groups: {
        create: vi.fn().mockResolvedValue({ id: 20n }),
        update: vi.fn(),
      },
      option_values: { create: vi.fn(), update: vi.fn() },
    };
    const prisma = {
      categories: { findMany: vi.fn().mockResolvedValue([]) },
      dishes: { findMany: vi.fn().mockResolvedValue([]) },
      ingredients: { findMany: vi.fn().mockResolvedValue([]) },
      tags: { findMany: vi.fn().mockResolvedValue([]) },
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new MenuImportService(prisma as never);

    const result = await service.import(await service.createTemplate());

    expect(result).toEqual({
      success: true,
      imported: 1,
      created: 1,
      updated: 0,
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(tx.categories.create).toHaveBeenCalledOnce();
    expect(tx.ingredients.create).toHaveBeenCalledOnce();
    expect(tx.tags.create).toHaveBeenCalledOnce();
    expect(tx.dishes.create).toHaveBeenCalledOnce();
    expect(tx.dish_variants.create).toHaveBeenCalledTimes(2);
    expect(tx.dish_images.create).toHaveBeenCalledOnce();
    expect(tx.option_groups.create).toHaveBeenCalledOnce();
    expect(tx.option_values.create).toHaveBeenCalledOnce();
  });
});
