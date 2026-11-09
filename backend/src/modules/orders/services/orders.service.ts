import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service.js';
import { PromotionsService } from '../../promotions/services/promotions.service.js';
import { OrderStateMachineService } from './order-state-machine.service.js';
import { CheckoutDto } from '../dto/checkout.dto.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import { QueryOrdersDto } from '../dto/query-orders.dto.js';
import { OrderMapper } from '../application/mappers/order.mapper.js';
import { calculateCouponDiscount } from '../../promotions/domain/coupon-discount.policy.js';
import { StoreSettingsQueryService } from '../infrastructure/persistence/store-settings-query.service.js';
import { OrderExpirationService } from './order-expiration.service.js';
import { EventsService } from '../../events/events.service.js';
import {
  orders_status,
  orders_fulfillment_type,
  orders_payment_method,
  orders_payment_status,
  coupon_redemptions_status,
  dishes_availability,
  payments_status,
  refunds_status,
  Prisma,
} from '@prisma/client';

interface PreparedOption {
  dish_id: bigint;
  option_value_id: bigint;
  group_name: string;
  option_name: string;
  extra_price: number;
}

interface PreparedOrderItem {
  dish_id: bigint;
  variant_id: bigint;
  dish_name: string;
  variant_name: string;
  base_price: number;
  options_price: number;
  quantity: number;
  line_total: number;
  note: string | null;
  options: PreparedOption[];
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotionsService: PromotionsService,
    private readonly stateMachine: OrderStateMachineService,
    private readonly config: ConfigService,
    private readonly storeSettings: StoreSettingsQueryService,
    private readonly orderExpiration: OrderExpirationService,
    private readonly eventsService: EventsService,
  ) {}

  private generateOrderCode(): string {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const randomHex = randomBytes(3).toString('hex').toUpperCase();
    return `VV${yy}${mm}${dd}-${randomHex}`;
  }

  public serializeOrder(o: any) {
    return OrderMapper.toSerialized(o);
  }

  // ==========================================
  // KHÁCH HÀNG: ĐẶT HÀNG & QUẢN LÝ ĐƠN CÁ NHÂN
  // ==========================================

  // 1. Tạo đơn hàng (Chống đặt trùng checkout_key - BR-08, Snapshot - BR-07)
  async checkout(userId: string, dto: CheckoutDto) {
    const uId = BigInt(userId);

    // [BR-08] Kiểm tra đơn đã tạo với checkout_key này chưa
    const existingOrder = await this.prisma.orders.findUnique({
      where: { checkout_key: dto.checkout_key },
      include: {
        order_items: {
          include: { order_item_options: true },
        },
        order_events: true,
      },
    });

    if (existingOrder) {
      if (existingOrder.user_id !== uId) {
        throw new BadRequestException('checkout_key không hợp lệ.');
      }
      return this.serializeOrder(existingOrder);
    }

    if (
      dto.fulfillment_type === orders_fulfillment_type.DELIVERY &&
      (!dto.delivery_address || dto.delivery_address.trim().length === 0)
    ) {
      throw new BadRequestException('Vui lòng cung cấp địa chỉ giao hàng.');
    }

    const cart = await this.prisma.carts.findUnique({
      where: { user_id: uId },
      include: {
        cart_items: {
          include: {
            dish_variants: {
              include: {
                dishes: {
                  include: {
                    categories: { select: { is_active: true } },
                  },
                },
              },
            },
            cart_item_options: {
              include: {
                option_values: {
                  include: { option_groups: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cart_items.length === 0) {
      throw new BadRequestException('Giỏ hàng của bạn đang trống.');
    }

    // [BR-04, BR-06] Kiểm tra tính khả dụng và tính toán tiền món
    let subtotal = 0;
    const preparedItems: PreparedOrderItem[] = [];

    for (const item of cart.cart_items) {
      const variant = item.dish_variants;
      const dish = variant?.dishes;

      if (
        !dish ||
        dish.deleted_at !== null ||
        dish.availability !== dishes_availability.AVAILABLE ||
        dish.categories?.is_active === false
      ) {
        throw new BadRequestException(
          `Món "${dish?.name || 'Món ăn'}" hiện đã ngừng bán hoặc tạm ngưng phục vụ.`,
        );
      }

      if (!variant || !variant.is_active) {
        throw new BadRequestException(
          `Biến thể "${variant?.name || 'Biến thể'}" của món "${dish.name}" đã tạm ngưng phục vụ.`,
        );
      }

      let optionsPrice = 0;
      const preparedOptions: PreparedOption[] = [];

      for (const opt of item.cart_item_options) {
        const val = opt.option_values;
        if (!val || !val.is_active) {
          throw new BadRequestException(
            `Tùy chọn "${val?.name || 'Tùy chọn'}" của món "${dish.name}" đã tạm hết.`,
          );
        }
        const extraPrice = Number(val.extra_price);
        optionsPrice += extraPrice;

        preparedOptions.push({
          dish_id: dish.id,
          option_value_id: val.id,
          group_name: val.option_groups.name,
          option_name: val.name,
          extra_price: extraPrice,
        });
      }

      const basePrice = Number(variant.price);
      const lineTotal = (basePrice + optionsPrice) * item.quantity;
      subtotal += lineTotal;

      preparedItems.push({
        dish_id: dish.id,
        variant_id: variant.id,
        dish_name: dish.name,
        variant_name: variant.name,
        base_price: basePrice,
        options_price: optionsPrice,
        quantity: item.quantity,
        line_total: lineTotal,
        note: item.note,
        options: preparedOptions,
      });
    }

    // BE-04.15-19: Đọc cấu hình quán một lần trong phiên checkout (phí ship, timeout, nhận đơn)
    const settings = await this.storeSettings.getSettings();
    if (!settings.acceptingOrders) {
      throw new BadRequestException(
        'Quán hiện đang tạm ngừng nhận đơn hàng mới.',
      );
    }

    // [BR-05] Phí giao hàng tiêu chuẩn từ Store Settings hoặc miễn phí khi đạt ngưỡng
    let baseDeliveryFee = 0;
    if (dto.fulfillment_type === orders_fulfillment_type.DELIVERY) {
      const isFreeShip =
        settings.freeShippingThreshold > 0 &&
        subtotal >= settings.freeShippingThreshold;
      baseDeliveryFee = isFreeShip ? 0 : settings.defaultDeliveryFee;
    }

    // [BR-10, BR-11, BR-12, BR-13] Áp dụng mã ưu đãi nếu có
    let foodDiscount = 0;
    let shippingDiscount = 0;
    let couponId: bigint | null = null;
    let couponSnapshot: any = null;

    if (dto.coupon_code) {
      const validation = await this.promotionsService.validateCoupon(
        userId,
        dto.coupon_code,
        subtotal,
        baseDeliveryFee,
      );

      couponId = BigInt(validation.coupon.id);
      couponSnapshot = validation.coupon;

      if (validation.applied_to === 'FOOD') {
        foodDiscount = validation.discount_amount;
      } else {
        shippingDiscount = validation.discount_amount;
      }
    }

    let initialStatus: orders_status = orders_status.PENDING_CONFIRMATION;
    let paymentDeadline: Date | null = null;

    if (dto.payment_method === orders_payment_method.VNPAY) {
      initialStatus = orders_status.PENDING_PAYMENT;
      const timeoutMinutes = settings.paymentTimeoutMinutes;
      paymentDeadline = new Date(Date.now() + timeoutMinutes * 60 * 1000);
    }

    let createdOrder: any = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const orderCode = this.generateOrderCode();

      try {
        createdOrder = await this.prisma.$transaction(async (tx) => {
          // [BR-13 Concurrency TOCTOU Protection - Đảm bảo hạn mức coupon kiểm tra an toàn trong transaction]
          if (couponId) {
            await tx.$queryRaw`SELECT id FROM coupons WHERE id = ${couponId} FOR UPDATE`;

            const lockedCoupon = await tx.coupons.findUnique({
              where: { id: couponId },
            });
            const now = new Date();

            if (
              !lockedCoupon ||
              !lockedCoupon.is_active ||
              lockedCoupon.starts_at > now ||
              lockedCoupon.ends_at < now
            ) {
              throw new BadRequestException('Mã ưu đãi không còn hiệu lực.');
            }

            if (subtotal < Number(lockedCoupon.min_subtotal)) {
              throw new BadRequestException(
                'Đơn hàng không còn đáp ứng giá trị tối thiểu của mã ưu đãi.',
              );
            }

            if (lockedCoupon.total_limit !== null) {
              const totalRedeemed = await tx.coupon_redemptions.count({
                where: {
                  coupon_id: couponId,
                  status: {
                    in: [
                      coupon_redemptions_status.RESERVED,
                      coupon_redemptions_status.CONSUMED,
                    ],
                  },
                },
              });
              if (totalRedeemed >= lockedCoupon.total_limit) {
                throw new BadRequestException('Mã ưu đãi đã hết lượt sử dụng.');
              }
            }

            const userRedeemed = await tx.coupon_redemptions.count({
              where: {
                coupon_id: couponId,
                user_id: uId,
                status: {
                  in: [
                    coupon_redemptions_status.RESERVED,
                    coupon_redemptions_status.CONSUMED,
                  ],
                },
              },
            });
            if (userRedeemed >= lockedCoupon.per_user_limit) {
              throw new BadRequestException(
                'Bạn đã dùng hết số lượt cho phép của mã ưu đãi này.',
              );
            }

            const discountValue = Number(lockedCoupon.discount_value);
            const discountResult = calculateCouponDiscount(
              {
                type: lockedCoupon.discount_type as any,
                value: discountValue,
                maxDiscount:
                  lockedCoupon.max_discount === null
                    ? null
                    : Number(lockedCoupon.max_discount),
              },
              subtotal,
              baseDeliveryFee,
            );

            if (discountResult.appliedTo === 'FOOD') {
              foodDiscount = discountResult.amount;
              shippingDiscount = 0;
            } else {
              foodDiscount = 0;
              shippingDiscount = discountResult.amount;
            }

            couponSnapshot = {
              id: lockedCoupon.id.toString(),
              code: lockedCoupon.code,
              name: lockedCoupon.name,
              discount_type: lockedCoupon.discount_type,
              discount_value: discountValue,
              min_subtotal: Number(lockedCoupon.min_subtotal),
              max_discount:
                lockedCoupon.max_discount === null
                  ? null
                  : Number(lockedCoupon.max_discount),
              total_limit: lockedCoupon.total_limit,
              per_user_limit: lockedCoupon.per_user_limit,
            };
          }

          const lockedTotalAmount = Math.max(
            0,
            subtotal - foodDiscount + baseDeliveryFee - shippingDiscount,
          );

          const order = await tx.orders.create({
            data: {
              order_code: orderCode,
              checkout_key: dto.checkout_key,
              user_id: uId,
              fulfillment_type: dto.fulfillment_type,
              status: initialStatus,
              payment_method: dto.payment_method,
              payment_status: orders_payment_status.UNPAID,
              recipient_name: dto.recipient_name.trim(),
              recipient_phone: dto.recipient_phone.trim(),
              delivery_address: dto.delivery_address?.trim() || null,
              delivery_note: dto.delivery_note?.trim() || null,
              customer_note: dto.customer_note?.trim() || null,
              subtotal,
              food_discount: foodDiscount,
              delivery_fee: baseDeliveryFee,
              shipping_discount: shippingDiscount,
              total_amount: lockedTotalAmount,
              coupon_id: couponId,
              coupon_snapshot: couponSnapshot,
              payment_deadline: paymentDeadline,
              order_items: {
                create: preparedItems.map((pItem) => ({
                  dish_id: pItem.dish_id,
                  variant_id: pItem.variant_id,
                  dish_name: pItem.dish_name,
                  variant_name: pItem.variant_name,
                  base_price: pItem.base_price,
                  options_price: pItem.options_price,
                  quantity: pItem.quantity,
                  line_total: pItem.line_total,
                  note: pItem.note,
                  order_item_options: {
                    create: pItem.options.map((opt) => ({
                      option_value_id: opt.option_value_id,
                      group_name: opt.group_name,
                      option_name: opt.option_name,
                      extra_price: opt.extra_price,
                    })),
                  },
                })),
              },
              order_events: {
                create: {
                  actor_user_id: uId,
                  event_type: 'ORDER_CREATED',
                  to_status: initialStatus,
                  note: `Khách hàng đặt đơn qua ${dto.payment_method}`,
                },
              },
              ...(couponId
                ? {
                    coupon_redemptions: {
                      create: {
                        coupon_id: couponId,
                        user_id: uId,
                        status: coupon_redemptions_status.RESERVED,
                        discount_amount: foodDiscount + shippingDiscount,
                      },
                    },
                  }
                : {}),
            },
            include: {
              order_items: {
                include: { order_item_options: true },
              },
              order_events: {
                orderBy: { created_at: 'asc' },
              },
            },
          });

          const cartItemIds = cart.cart_items.map((ci) => ci.id);
          if (cartItemIds.length > 0) {
            await tx.cart_item_options.deleteMany({
              where: { cart_item_id: { in: cartItemIds } },
            });
            await tx.cart_items.deleteMany({
              where: { cart_id: cart.id },
            });
          }

          return order;
        });

        break;
      } catch (err: any) {
        if (err?.code === 'P2034' && attempts < maxAttempts) {
          continue;
        }
        if (
          err?.code === 'P2002' &&
          (err?.meta?.target?.includes('order_code') ||
            String(err?.message).includes('order_code')) &&
          attempts < maxAttempts
        ) {
          continue;
        }
        throw err;
      }
    }

    if (createdOrder) {
      this.eventsService.emitOrderUpdated({
        orderId: createdOrder.id.toString(),
        orderCode: createdOrder.order_code,
        status: createdOrder.status,
        paymentStatus: createdOrder.payment_status,
        userId: createdOrder.user_id.toString(),
        updatedAt: createdOrder.created_at.toISOString(),
      });
    }

    return this.serializeOrder(createdOrder);
  }

  // 2. Lấy danh sách đơn hàng của khách hàng
  async getMyOrders(userId: string, query: QueryOrdersDto) {
    // Quét và tự động hủy các đơn hết hạn thanh toán
    await this.orderExpiration.expireDueOrders().catch(() => 0);

    const uId = BigInt(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ordersWhereInput = { user_id: uId };
    if (query.status) where.status = query.status;
    if (query.fulfillment_type) where.fulfillment_type = query.fulfillment_type;

    const [total, orders] = await Promise.all([
      this.prisma.orders.count({ where }),
      this.prisma.orders.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          order_items: {
            include: { order_item_options: true, reviews: true },
          },
          order_events: {
            orderBy: { created_at: 'asc' },
          },
          payments: {
            include: {
              refunds: {
                orderBy: { created_at: 'desc' },
              },
            },
            orderBy: { created_at: 'desc' },
          },
        },
      }),
    ]);

    return {
      items: orders.map((o) => this.serializeOrder(o)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 3. Lấy chi tiết đơn hàng (Khách hàng hoặc Nhân viên)
  async getOrderDetail(userId: string, orderId: string, role?: string) {
    const isNumeric = /^\d+$/.test(orderId);
    let order = await this.prisma.orders.findFirst({
      where: isNumeric
        ? { OR: [{ id: BigInt(orderId) }, { order_code: orderId }] }
        : { order_code: orderId },
      include: {
        order_items: {
          include: { order_item_options: true, reviews: true },
        },
        order_events: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng ID ${orderId}.`);
    }

    // Lazy Expiration: Nếu đơn hàng đã quá hạn thanh toán mà chưa hủy, tiến hành hủy ngay lập tức
    if (
      order.status === orders_status.PENDING_PAYMENT &&
      order.payment_deadline &&
      order.payment_deadline <= new Date()
    ) {
      await this.orderExpiration.expireDueOrders().catch(() => 0);
      order = await this.prisma.orders.findUnique({
        where: { id: order.id },
        include: {
          order_items: {
            include: { order_item_options: true, reviews: true },
          },
          order_events: {
            orderBy: { created_at: 'asc' },
          },
          payments: {
            include: {
              refunds: {
                orderBy: { created_at: 'desc' },
              },
            },
            orderBy: { created_at: 'desc' },
          },
        },
      });
      if (!order) {
        throw new NotFoundException(`Không tìm thấy đơn hàng ID ${orderId}.`);
      }
    }

    if (
      role !== 'ADMIN' &&
      role !== 'OPERATOR' &&
      role !== 'KITCHEN' &&
      order.user_id !== BigInt(userId)
    ) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này.');
    }

    return this.serializeOrder(order);
  }

  // 4. Khách hàng hủy đơn (BR-21, BR-12)
  async cancelMyOrder(
    userId: string,
    orderId: string,
    dtoOrReason?:
      | string
      | {
          reason?: string;
          bank_name?: string;
          bank_account_number?: string;
          bank_account_name?: string;
        },
  ) {
    const reasonText =
      typeof dtoOrReason === 'string' ? dtoOrReason : dtoOrReason?.reason;
    const bankName =
      typeof dtoOrReason === 'object' ? dtoOrReason?.bank_name : undefined;
    const bankAccNum =
      typeof dtoOrReason === 'object'
        ? dtoOrReason?.bank_account_number
        : undefined;
    const bankAccName =
      typeof dtoOrReason === 'object'
        ? dtoOrReason?.bank_account_name
        : undefined;

    const uId = BigInt(userId);
    const isNumeric = /^\d+$/.test(orderId);

    const existing = await this.prisma.orders.findFirst({
      where: isNumeric
        ? { OR: [{ id: BigInt(orderId) }, { order_code: orderId }] }
        : { order_code: orderId },
      select: { id: true, user_id: true },
    });

    if (!existing || existing.user_id !== uId) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    const oId = existing.id;

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${oId} FOR UPDATE`;

      const order = await tx.orders.findUnique({ where: { id: oId } });
      if (!order || order.user_id !== uId) {
        throw new NotFoundException('Không tìm thấy đơn hàng.');
      }

      if (
        order.status !== orders_status.PENDING_PAYMENT &&
        order.status !== orders_status.PENDING_CONFIRMATION
      ) {
        throw new BadRequestException(
          'Đơn hàng đã được quán tiếp nhận/chế biến, không thể tự hủy qua ứng dụng.',
        );
      }

      const isPaid = order.payment_status === orders_payment_status.PAID;

      const updateResult = await tx.orders.updateMany({
        where: {
          id: oId,
          status: {
            in: [
              orders_status.PENDING_PAYMENT,
              orders_status.PENDING_CONFIRMATION,
            ],
          },
        },
        data: {
          status: orders_status.CANCELLED,
          cancelled_at: new Date(),
          cancel_reason: reasonText?.trim() || 'Khách hàng yêu cầu hủy đơn',
          payment_status: isPaid
            ? orders_payment_status.REFUND_PENDING
            : order.payment_status,
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException(
          'Đơn hàng không thể hủy do trạng thái đã được cập nhật bởi thao tác khác.',
        );
      }

      await tx.coupon_redemptions.updateMany({
        where: {
          order_id: oId,
          status: coupon_redemptions_status.RESERVED,
        },
        data: {
          status: coupon_redemptions_status.RELEASED,
          released_at: new Date(),
        },
      });

      // Tự động tạo yêu cầu hoàn tiền nếu khách đã thanh toán thành công
      if (isPaid) {
        const payment = await tx.payments.findFirst({
          where: { order_id: oId, status: payments_status.SUCCEEDED },
          orderBy: { id: 'desc' },
        });

        if (payment) {
          const existingRefund = await tx.refunds.findFirst({
            where: { payment_id: payment.id },
          });
          if (!existingRefund) {
            const randomHex = Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase();

            let refundReason =
              reasonText?.trim() || 'Khách hàng tự hủy đơn đã thanh toán';
            if (bankAccNum) {
              refundReason = `[Hoàn tiền STK] Ngân hàng: ${bankName || 'Chưa rõ'} | STK: ${bankAccNum} | Chủ TK: ${bankAccName || 'Chưa rõ'} | Lý do: ${reasonText || 'Khách hủy'}`;
            }

            await tx.refunds.create({
              data: {
                payment_id: payment.id,
                refund_reference: `VV-REF-${order.order_code}-${randomHex}`,
                amount: payment.amount,
                reason: refundReason,
                status: refunds_status.REQUESTED,
                requested_by: uId,
              },
            });
          }
        }
      }

      await tx.order_events.create({
        data: {
          order_id: oId,
          actor_user_id: uId,
          event_type: 'ORDER_CANCELLED',
          from_status: order.status,
          to_status: orders_status.CANCELLED,
          note: JSON.stringify({
            reason: reasonText?.trim() || 'Khách hàng tự hủy đơn',
            refundBank: bankAccNum
              ? {
                  bank_name: bankName,
                  bank_account_number: bankAccNum,
                  bank_account_name: bankAccName,
                }
              : null,
          }),
        },
      });
    });

    return this.getOrderDetail(userId, orderId);
  }

  // ==========================================
  // QUẢN TRỊ VIÊN & OPERATOR: TỔNG HỢP & CHUYỂN TRẠNG THÁI
  // ==========================================

  async findAllAdmin(query: QueryOrdersDto) {
    // Quét và tự động hủy các đơn hết hạn thanh toán
    await this.orderExpiration.expireDueOrders().catch(() => 0);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ordersWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.fulfillment_type) where.fulfillment_type = query.fulfillment_type;
    if (query.search) {
      where.OR = [
        { order_code: { contains: query.search } },
        { recipient_name: { contains: query.search } },
        { recipient_phone: { contains: query.search } },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.orders.count({ where }),
      this.prisma.orders.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          order_items: {
            include: { order_item_options: true, reviews: true },
          },
          order_events: {
            orderBy: { created_at: 'asc' },
          },
          payments: {
            include: {
              refunds: {
                orderBy: { created_at: 'desc' },
              },
            },
            orderBy: { created_at: 'desc' },
          },
        },
      }),
    ]);

    return {
      items: orders.map((o) => this.serializeOrder(o)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Cập nhật trạng thái thông qua OrderStateMachineService
  async updateOrderStatus(
    orderId: string,
    actorUserId: string,
    dto: UpdateOrderStatusDto,
  ) {
    await this.stateMachine.transitionStatus(orderId, actorUserId, dto);
    return this.getOrderDetail(actorUserId, orderId, 'ADMIN');
  }
}
