import { describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service.js';

describe('UsersService - Favorites', () => {
  it('returns list of favorites with dish summary', async () => {
    const mockFav = {
      id: 10n,
      user_id: 1n,
      dish_id: 5n,
      created_at: new Date(),
      dishes: {
        id: 5n,
        name: 'Phở bò tái',
        slug: 'pho-bo-tai',
        description: 'Phở truyền thống',
        availability: 'AVAILABLE',
        categories: { id: 2n, name: 'Phở' },
        dish_images: [{ asset_path: 'https://img.com/pho.jpg' }],
      },
    };

    const prismaMock: any = {
      favorites: {
        findMany: vi.fn().mockResolvedValue([mockFav]),
      },
    };

    const service = new UsersService(prismaMock);
    const result = await service.getFavorites('1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('10');
    expect(result[0].dish?.name).toBe('Phở bò tái');
  });

  it('addFavorite upserts favorite record', async () => {
    const prismaMock: any = {
      dishes: {
        findUnique: vi.fn().mockResolvedValue({ id: 5n, deleted_at: null }),
      },
      favorites: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    };

    const service = new UsersService(prismaMock);
    await service.addFavorite('1', '5');

    expect(prismaMock.favorites.upsert).toHaveBeenCalled();
  });

  it('removeFavorite deletes record idempotently', async () => {
    const prismaMock: any = {
      favorites: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const service = new UsersService(prismaMock);
    await service.removeFavorite('1', '5');

    expect(prismaMock.favorites.deleteMany).toHaveBeenCalledWith({
      where: {
        user_id: 1n,
        dish_id: 5n,
      },
    });
  });
});
