import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { CreateAddressDto, UpdateAddressDto } from '../dto/address.dto.js';
import { addresses } from '@prisma/client';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeAddress(addr: addresses) {
    return {
      id: addr.id.toString(),
      user_id: addr.user_id.toString(),
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address_line: addr.address_line,
      delivery_note: addr.delivery_note,
      latitude: addr.latitude ? Number(addr.latitude) : null,
      longitude: addr.longitude ? Number(addr.longitude) : null,
      is_default: addr.is_default,
      created_at: addr.created_at,
      updated_at: addr.updated_at,
    };
  }

  // 1. Lấy danh sách địa chỉ của người dùng hiện tại (BR-01)
  async findAll(userId: string) {
    const list = await this.prisma.addresses.findMany({
      where: {
        user_id: BigInt(userId),
        deleted_at: null,
      },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    return list.map((a) => this.serializeAddress(a));
  }

  // 2. Lấy chi tiết một địa chỉ (BR-01)
  async findOne(userId: string, addressId: string) {
    const address = await this.prisma.addresses.findFirst({
      where: {
        id: BigInt(addressId),
        user_id: BigInt(userId),
        deleted_at: null,
      },
    });

    if (!address) {
      throw new NotFoundException(
        'Không tìm thấy địa chỉ hoặc bạn không có quyền truy cập.',
      );
    }

    return this.serializeAddress(address);
  }

  // 3. Thêm địa chỉ mới (Nếu là địa chỉ đầu tiên hoặc is_default=true -> tự động đặt mặc định)
  async create(userId: string, dto: CreateAddressDto) {
    const uId = BigInt(userId);

    const existingCount = await this.prisma.addresses.count({
      where: { user_id: uId, deleted_at: null },
    });

    const isDefault = existingCount === 0 ? true : Boolean(dto.is_default);

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.addresses.updateMany({
          where: { user_id: uId, deleted_at: null },
          data: { is_default: false },
        });
      }

      const created = await tx.addresses.create({
        data: {
          user_id: uId,
          recipient_name: dto.recipient_name.trim(),
          phone: dto.phone.trim(),
          address_line: dto.address_line.trim(),
          delivery_note: dto.delivery_note?.trim() || null,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          is_default: isDefault,
        },
      });

      return this.serializeAddress(created);
    });
  }

  // 4. Cập nhật địa chỉ (BR-01)
  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    await this.findOne(userId, addressId);
    const uId = BigInt(userId);
    const aId = BigInt(addressId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.is_default) {
        await tx.addresses.updateMany({
          where: { user_id: uId, deleted_at: null },
          data: { is_default: false },
        });
      }

      const updated = await tx.addresses.update({
        where: { id: aId },
        data: {
          ...(dto.recipient_name && {
            recipient_name: dto.recipient_name.trim(),
          }),
          ...(dto.phone && { phone: dto.phone.trim() }),
          ...(dto.address_line && { address_line: dto.address_line.trim() }),
          ...(dto.delivery_note !== undefined && {
            delivery_note: dto.delivery_note?.trim() || null,
          }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.is_default !== undefined && { is_default: dto.is_default }),
        },
      });

      return this.serializeAddress(updated);
    });
  }

  // 5. Đặt làm địa chỉ mặc định
  async setDefault(userId: string, addressId: string) {
    return this.update(userId, addressId, { is_default: true });
  }

  // 6. Xóa mềm địa chỉ (BR-01)
  async remove(userId: string, addressId: string) {
    await this.findOne(userId, addressId);
    const aId = BigInt(addressId);

    await this.prisma.addresses.update({
      where: { id: aId },
      data: {
        deleted_at: new Date(),
        is_default: false,
      },
    });

    return { message: 'Xóa địa chỉ thành công' };
  }
}
