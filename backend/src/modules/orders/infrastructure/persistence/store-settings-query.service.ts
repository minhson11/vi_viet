import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../database/prisma.service.js';

@Injectable()
export class StoreSettingsQueryService {
  private readonly logger = new Logger(StoreSettingsQueryService.name);
  private cachedSettings: {
    data: {
      paymentTimeoutMinutes: number;
      defaultDeliveryFee: number;
      freeShippingThreshold: number;
      acceptingOrders: boolean;
    };
    expiresAt: number;
  } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  public invalidateCache(): void {
    this.cachedSettings = null;
  }

  async getSettings() {
    const now = Date.now();
    if (this.cachedSettings && now < this.cachedSettings.expiresAt) {
      return this.cachedSettings.data;
    }

    const fallbackTimeout =
      Number(this.config.get<string>('PAYMENT_TIMEOUT_MINUTES', '15')) || 15;
    const fallbackDeliveryFee =
      Number(this.config.get<string>('DEFAULT_DELIVERY_FEE', '20000')) || 20000;

    try {
      const settings = await this.prisma.store_settings.findFirst();
      if (!settings) {
        const result = {
          paymentTimeoutMinutes: fallbackTimeout,
          defaultDeliveryFee: fallbackDeliveryFee,
          freeShippingThreshold: 300000,
          acceptingOrders: true,
        };
        this.cachedSettings = { data: result, expiresAt: now + 60_000 };
        return result;
      }

      let deliveryFee = fallbackDeliveryFee;
      let freeShippingThreshold = 300000;
      if (
        settings.delivery_rules &&
        typeof settings.delivery_rules === 'object'
      ) {
        const rules = settings.delivery_rules as Record<string, unknown>;
        if (typeof rules.base_fee === 'number') {
          deliveryFee = rules.base_fee;
        } else if (typeof rules.default_fee === 'number') {
          deliveryFee = rules.default_fee;
        }
        if (typeof rules.free_shipping_threshold === 'number') {
          freeShippingThreshold = rules.free_shipping_threshold;
        }
      }

      const result = {
        paymentTimeoutMinutes:
          settings.payment_timeout_minutes || fallbackTimeout,
        defaultDeliveryFee: deliveryFee,
        freeShippingThreshold,
        acceptingOrders: settings.accepting_orders,
      };
      this.cachedSettings = { data: result, expiresAt: now + 60_000 };
      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Could not read store settings from DB, using fallback: ${errorMsg}`,
      );
      return {
        paymentTimeoutMinutes: fallbackTimeout,
        defaultDeliveryFee: fallbackDeliveryFee,
        freeShippingThreshold: 300000,
        acceptingOrders: true,
      };
    }
  }
}
