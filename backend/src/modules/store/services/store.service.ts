import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { UpdateStoreDto } from '../dto/update-store.dto.js';
import { Prisma } from '@prisma/client';

export interface StoreResponse {
  id: string;
  name: string;
  address: string;
  phone: string;
  opening_hours: unknown;
  delivery_rules: unknown;
  accepting_orders: boolean;
  payment_timeout_minutes: number;
  created_at: Date;
  updated_at: Date;
}

const DEFAULT_SETTINGS = {
  name: 'Ẩm thực truyền thống Vị Việt',
  address: '123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh',
  phone: '0901234567',
  opening_hours: {
    monday_friday: '07:00 - 22:00',
    saturday_sunday: '06:30 - 23:00',
  },
  delivery_rules: {
    base_fee: 20000,
    free_shipping_threshold: 300000,
    max_distance_km: 15,
  },
  accepting_orders: true,
  payment_timeout_minutes: 15,
};

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  private serialize(s: any): StoreResponse {
    return {
      id: s.id.toString(),
      name: s.name,
      address: s.address,
      phone: s.phone,
      opening_hours: s.opening_hours,
      delivery_rules: s.delivery_rules,
      accepting_orders: s.accepting_orders,
      payment_timeout_minutes: s.payment_timeout_minutes,
      created_at: s.created_at,
      updated_at: s.updated_at,
    };
  }

  async getStore(): Promise<StoreResponse> {
    const existing = await this.prisma.store_settings.findFirst();
    if (existing) {
      return this.serialize(existing);
    }

    // Tự động khởi tạo cấu hình mặc định nếu chưa có bản ghi
    const created = await this.prisma.store_settings.create({
      data: {
        id: 1n,
        name: DEFAULT_SETTINGS.name,
        address: DEFAULT_SETTINGS.address,
        phone: DEFAULT_SETTINGS.phone,
        opening_hours: DEFAULT_SETTINGS.opening_hours as Prisma.InputJsonValue,
        delivery_rules:
          DEFAULT_SETTINGS.delivery_rules as Prisma.InputJsonValue,
        accepting_orders: DEFAULT_SETTINGS.accepting_orders,
        payment_timeout_minutes: DEFAULT_SETTINGS.payment_timeout_minutes,
      },
    });

    return this.serialize(created);
  }

  async updateStore(dto: UpdateStoreDto): Promise<StoreResponse> {
    const current = await this.prisma.store_settings.findFirst();

    if (!current) {
      const created = await this.prisma.store_settings.create({
        data: {
          id: 1n,
          name: dto.name || DEFAULT_SETTINGS.name,
          address: dto.address || DEFAULT_SETTINGS.address,
          phone: dto.phone || DEFAULT_SETTINGS.phone,
          opening_hours: (dto.opening_hours ||
            DEFAULT_SETTINGS.opening_hours) as Prisma.InputJsonValue,
          delivery_rules: (dto.delivery_rules ||
            DEFAULT_SETTINGS.delivery_rules) as Prisma.InputJsonValue,
          accepting_orders:
            dto.accepting_orders ?? DEFAULT_SETTINGS.accepting_orders,
          payment_timeout_minutes:
            dto.payment_timeout_minutes ??
            DEFAULT_SETTINGS.payment_timeout_minutes,
        },
      });
      return this.serialize(created);
    }

    const data: Prisma.store_settingsUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.opening_hours !== undefined)
      data.opening_hours = dto.opening_hours as Prisma.InputJsonValue;
    if (dto.delivery_rules !== undefined)
      data.delivery_rules = dto.delivery_rules as Prisma.InputJsonValue;
    if (dto.accepting_orders !== undefined)
      data.accepting_orders = dto.accepting_orders;
    if (dto.payment_timeout_minutes !== undefined)
      data.payment_timeout_minutes = dto.payment_timeout_minutes;
    data.updated_at = new Date();

    const updated = await this.prisma.store_settings.update({
      where: { id: current.id },
      data,
    });

    return this.serialize(updated);
  }
}
