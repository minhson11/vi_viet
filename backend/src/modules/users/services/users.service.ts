import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../database/prisma.service.js';
import { UpdateProfileDto } from '../dto/update-profile.dto.js';
import { ChangePasswordDto } from '../../auth/dto/change-password.dto.js';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto.js';
import {
  AdminQueryUsersDto,
  AdminUpdateUserDto,
  AdminCreateUserDto,
} from '../dto/admin-user.dto.js';
import { users, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeUser(u: users) {
    return {
      id: u.id.toString(),
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      email_verified_at: u.email_verified_at,
      deactivated_at: u.deactivated_at,
      created_at: u.created_at,
      updated_at: u.updated_at,
    };
  }

  // 1. Xem hồ sơ cá nhân
  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    return this.serializeUser(user);
  }

  // 2. Cập nhật thông tin cá nhân
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.users.update({
      where: { id: BigInt(userId) },
      data: {
        ...(dto.full_name && { full_name: dto.full_name.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
      },
    });

    return {
      message: 'Cập nhật thông tin thành công',
      user: this.serializeUser(user),
    };
  }

  // 3. Đổi mật khẩu & Thu hồi mọi phiên đăng nhập cũ
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const uId = BigInt(userId);
    const user = await this.prisma.users.findUnique({
      where: { id: uId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    const isValid = await argon2.verify(
      user.password_hash,
      dto.current_password,
    );
    if (!isValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
    }

    const newPasswordHash = await argon2.hash(dto.new_password);

    await this.prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: uId },
        data: { password_hash: newPasswordHash },
      });

      // Vô hiệu hóa tất cả các phiên hiện có để đảm bảo an toàn
      await tx.auth_sessions.updateMany({
        where: { user_id: uId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    });

    return {
      message:
        'Đổi mật khẩu thành công. Vui lòng đăng nhập lại trên các thiết bị khác.',
    };
  }

  // 4. Lấy sở thích ăn uống
  async getPreferences(userId: string) {
    const pref = await this.prisma.user_preferences.findUnique({
      where: { user_id: BigInt(userId) },
    });

    if (!pref) {
      return {
        spicy_level: null,
        budget_per_meal: null,
        personalization_enabled: false,
        dietary_note: null,
      };
    }

    return {
      id: pref.id.toString(),
      spicy_level: pref.spicy_level,
      budget_per_meal: pref.budget_per_meal
        ? Number(pref.budget_per_meal)
        : null,
      personalization_enabled: pref.personalization_enabled,
      dietary_note: pref.dietary_note,
      consented_at: pref.consented_at,
    };
  }

  // 5. Cập nhật sở thích ăn uống
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const uId = BigInt(userId);

    const data: Prisma.user_preferencesUncheckedCreateInput = {
      user_id: uId,
      ...(dto.spicy_level !== undefined && { spicy_level: dto.spicy_level }),
      ...(dto.budget_per_meal !== undefined && {
        budget_per_meal: dto.budget_per_meal,
      }),
      ...(dto.dietary_note !== undefined && {
        dietary_note: dto.dietary_note?.trim() || null,
      }),
      ...(dto.personalization_enabled !== undefined && {
        personalization_enabled: dto.personalization_enabled,
        consented_at: dto.personalization_enabled ? new Date() : null,
      }),
    };

    const pref = await this.prisma.user_preferences.upsert({
      where: { user_id: uId },
      create: data,
      update: {
        ...(dto.spicy_level !== undefined && { spicy_level: dto.spicy_level }),
        ...(dto.budget_per_meal !== undefined && {
          budget_per_meal: dto.budget_per_meal,
        }),
        ...(dto.dietary_note !== undefined && {
          dietary_note: dto.dietary_note?.trim() || null,
        }),
        ...(dto.personalization_enabled !== undefined && {
          personalization_enabled: dto.personalization_enabled,
          consented_at: dto.personalization_enabled ? new Date() : null,
        }),
      },
    });

    return {
      message: 'Cập nhật sở thích thành công',
      preferences: {
        id: pref.id.toString(),
        spicy_level: pref.spicy_level,
        budget_per_meal: pref.budget_per_meal
          ? Number(pref.budget_per_meal)
          : null,
        personalization_enabled: pref.personalization_enabled,
        dietary_note: pref.dietary_note,
        consented_at: pref.consented_at,
      },
    };
  }

  // 6. Quản trị: Danh sách người dùng phân trang
  async findAllAdmin(query: AdminQueryUsersDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.usersWhereInput = {};

    if (query.role) {
      where.role = query.role as any;
    }
    if (query.status) {
      where.status = query.status as any;
    }
    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { full_name: { contains: s } },
        { email: { contains: s } },
        { phone: { contains: s } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.users.count({ where }),
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      items: items.map((u) => this.serializeUser(u)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 7. Quản trị: Cập nhật vai trò / khóa mở tài khoản (BR-02)
  async adminUpdateUser(
    adminId: string,
    targetUserId: string,
    dto: AdminUpdateUserDto,
  ) {
    if (adminId === targetUserId) {
      if (dto.status && dto.status !== 'ACTIVE') {
        throw new BadRequestException(
          'Bạn không thể tự khóa tài khoản của chính mình.',
        );
      }
      if (dto.role && dto.role !== 'ADMIN') {
        throw new BadRequestException(
          'Bạn không thể tự hạ quyền quản trị của chính mình.',
        );
      }
    }

    const targetUser = await this.prisma.users.findUnique({
      where: { id: BigInt(targetUserId) },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng cần cập nhật.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.users.update({
        where: { id: BigInt(targetUserId) },
        data: {
          ...(dto.role && { role: dto.role as any }),
          ...(dto.status && {
            status: dto.status as any,
            deactivated_at: dto.status === 'DEACTIVATED' ? new Date() : null,
          }),
        },
      });

      // BE-05.14: Revoke toàn bộ session khi khóa hoặc vô hiệu hóa tài khoản
      if (
        dto.status &&
        (dto.status === 'LOCKED' || dto.status === 'DEACTIVATED')
      ) {
        await tx.auth_sessions.updateMany({
          where: {
            user_id: BigInt(targetUserId),
            revoked_at: null,
          },
          data: {
            revoked_at: new Date(),
          },
        });
      }

      return u;
    });

    return {
      message: 'Cập nhật tài khoản thành công',
      user: this.serializeUser(updated),
    };
  }

  // 8. Quản lý danh sách món ăn yêu thích (BE-08.01, API-18, API-19, API-20)
  async getFavorites(userId: string) {
    const favs = await this.prisma.favorites.findMany({
      where: { user_id: BigInt(userId) },
      include: {
        dishes: {
          include: {
            categories: { select: { id: true, name: true } },
            dish_images: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return favs.map((f) => ({
      id: f.id.toString(),
      dish_id: f.dish_id.toString(),
      created_at: f.created_at,
      dish: f.dishes
        ? {
            id: f.dishes.id.toString(),
            name: f.dishes.name,
            slug: f.dishes.slug,
            description: f.dishes.description,
            availability: f.dishes.availability,
            category: f.dishes.categories
              ? {
                  id: f.dishes.categories.id.toString(),
                  name: f.dishes.categories.name,
                }
              : null,
            primary_image: f.dishes.dish_images?.[0]?.asset_path || null,
          }
        : null,
    }));
  }

  async addFavorite(userId: string, dishId: string): Promise<void> {
    const uId = BigInt(userId);
    const dId = BigInt(dishId);

    const dish = await this.prisma.dishes.findUnique({ where: { id: dId } });
    if (!dish || dish.deleted_at !== null) {
      throw new NotFoundException('Không tìm thấy món ăn.');
    }

    await this.prisma.favorites.upsert({
      where: {
        user_id_dish_id: {
          user_id: uId,
          dish_id: dId,
        },
      },
      update: { updated_at: new Date() },
      create: {
        user_id: uId,
        dish_id: dId,
      },
    });
  }

  async removeFavorite(userId: string, dishId: string): Promise<void> {
    const uId = BigInt(userId);
    const dId = BigInt(dishId);

    await this.prisma.favorites.deleteMany({
      where: {
        user_id: uId,
        dish_id: dId,
      },
    });
  }

  async adminCreateUser(dto: AdminCreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.users.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException(
        `Email "${email}" đã tồn tại trong hệ thống.`,
      );
    }

    const password_hash = await argon2.hash(dto.password);
    const user = await this.prisma.users.create({
      data: {
        full_name: dto.full_name.trim(),
        email,
        phone: dto.phone?.trim() || null,
        password_hash,
        role: dto.role as any,
        status: 'ACTIVE',
        email_verified_at: new Date(),
      },
    });

    return this.serializeUser(user);
  }

  // 10. Chân dung khách hàng 360 độ (API-70)
  async adminGetCustomerDetail(customerId: string) {
    const uId = BigInt(customerId);
    const user = await this.prisma.users.findUnique({
      where: { id: uId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy khách hàng.');
    }

    // Thống kê lịch sử đơn hàng trọn đời
    const totalOrdersCount = await this.prisma.orders.count({
      where: { user_id: uId },
    });

    const completedOrders = await this.prisma.orders.findMany({
      where: {
        user_id: uId,
        OR: [{ status: 'COMPLETED' }, { payment_status: 'PAID' }],
      },
      select: {
        total_amount: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const lifetimeSpend = completedOrders.reduce(
      (sum, ord) => sum + Number(ord.total_amount || 0),
      0,
    );
    const firstOrderAt = completedOrders[0]?.created_at || null;
    const lastOrderAt =
      completedOrders[completedOrders.length - 1]?.created_at || null;

    // Lấy sổ địa chỉ còn hiệu lực
    const addressList = await this.prisma.addresses.findMany({
      where: { user_id: uId, deleted_at: null },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    // Lấy sở thích khẩu vị
    const [preferences, tagPrefs, ingredientRestrs] = await Promise.all([
      this.prisma.user_preferences.findUnique({
        where: { user_id: uId },
      }),
      this.prisma.user_tag_preferences.findMany({
        where: { user_id: uId },
        include: { tags: true },
      }),
      this.prisma.user_ingredient_restrictions.findMany({
        where: { user_id: uId },
        include: { ingredients: true },
      }),
    ]);

    return {
      customer: this.serializeUser(user),
      statistics: {
        total_orders_count: totalOrdersCount,
        completed_orders_count: completedOrders.length,
        lifetime_spend: lifetimeSpend,
        first_order_at: firstOrderAt,
        last_order_at: lastOrderAt,
      },
      addresses: addressList.map((a) => ({
        id: a.id.toString(),
        recipient_name: a.recipient_name,
        phone: a.phone,
        address_line: a.address_line,
        delivery_note: a.delivery_note,
        is_default: a.is_default,
        created_at: a.created_at,
      })),
      preferences: preferences
        ? {
            spicy_level: preferences.spicy_level,
            budget_per_meal: Number(preferences.budget_per_meal || 0),
            dietary_note: preferences.dietary_note,
            tag_preferences: tagPrefs.map((tp) => ({
              tag_id: tp.tag_id.toString(),
              tag_name: tp.tags?.name || '',
              preference: tp.preference,
            })),
            ingredient_restrictions: ingredientRestrs.map((ir) => ({
              ingredient_id: ir.ingredient_id.toString(),
              ingredient_name: ir.ingredients?.name || '',
              reason: ir.reason,
            })),
          }
        : null,
    };
  }

  // 11. Danh sách đơn hàng của khách hàng (API-71)
  async adminGetCustomerOrders(
    customerId: string,
    query: { page?: number; limit?: number; status?: string },
  ) {
    const uId = BigInt(customerId);
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { user_id: uId };
    if (query.status) {
      where.status = query.status;
    }

    const [total, orders] = await Promise.all([
      this.prisma.orders.count({ where }),
      this.prisma.orders.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          order_items: true,
        },
      }),
    ]);

    return {
      items: orders.map((o) => ({
        id: o.id.toString(),
        order_code: o.order_code,
        status: o.status,
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        fulfillment_type: o.fulfillment_type,
        total_amount: Number(o.total_amount),
        delivery_fee: Number(o.delivery_fee),
        items_count: o.order_items.length,
        created_at: o.created_at,
        completed_at: o.completed_at,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}
