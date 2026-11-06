import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderExpirationService } from '../../services/order-expiration.service.js';

@Injectable()
export class PaymentExpirationJob
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(PaymentExpirationJob.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly expiration: OrderExpirationService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    if (
      this.config.get<string>('NODE_ENV') === 'test' ||
      this.config.get<string>('PAYMENT_EXPIRATION_JOB_ENABLED', 'true') ===
        'false'
    ) {
      return;
    }

    const configuredInterval = this.config.get<number>(
      'PAYMENT_EXPIRATION_INTERVAL_MS',
      30_000,
    );
    const interval = Math.max(10_000, Number(configuredInterval) || 30_000);

    this.logger.log(
      `Payment expiration job active: running every ${interval / 1000}s`,
    );

    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), interval);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async runOnce(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const expired = await this.expiration.expireDueOrders();
      if (expired > 0) {
        this.logger.log(`Expired ${expired} unpaid order(s).`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Payment expiration job failed: ${message}`);
    } finally {
      this.running = false;
    }
  }
}
