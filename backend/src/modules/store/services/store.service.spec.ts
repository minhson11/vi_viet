import { describe, expect, it, vi } from 'vitest';
import { StoreService } from './store.service.js';

describe('StoreService', () => {
  it('returns formatted store settings when existing record is found', async () => {
    const mockRecord = {
      id: 1n,
      name: 'Vị Việt Quán',
      address: '123 Đường Ẩm Thực',
      phone: '0901234567',
      opening_hours: { monday: '08:00 - 22:00' },
      delivery_rules: { base_fee: 25000 },
      accepting_orders: true,
      payment_timeout_minutes: 20,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const prismaMock: any = {
      store_settings: {
        findFirst: vi.fn().mockResolvedValue(mockRecord),
      },
    };

    const service = new StoreService(prismaMock);
    const result = await service.getStore();

    expect(result.name).toBe('Vị Việt Quán');
    expect(result.payment_timeout_minutes).toBe(20);
    expect(result.id).toBe('1');
  });

  it('updates store settings and returns updated serialized data', async () => {
    const current = {
      id: 1n,
      name: 'Cũ',
      address: '123 Cũ',
      phone: '0900000000',
      opening_hours: {},
      delivery_rules: {},
      accepting_orders: true,
      payment_timeout_minutes: 15,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const updated = {
      ...current,
      name: 'Mới',
      payment_timeout_minutes: 30,
    };

    const prismaMock: any = {
      store_settings: {
        findFirst: vi.fn().mockResolvedValue(current),
        update: vi.fn().mockResolvedValue(updated),
      },
    };

    const service = new StoreService(prismaMock);
    const result = await service.updateStore({
      name: 'Mới',
      payment_timeout_minutes: 30,
    });

    expect(prismaMock.store_settings.update).toHaveBeenCalled();
    expect(result.name).toBe('Mới');
    expect(result.payment_timeout_minutes).toBe(30);
  });
});
