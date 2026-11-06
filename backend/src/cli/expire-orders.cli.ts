import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { OrderExpirationService } from '../modules/orders/services/order-expiration.service.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const expiration = app.get(OrderExpirationService);
    const expiredCount = await expiration.expireDueOrders();
    console.log(
      `[ExpireOrdersCLI] Đã xử lý hết hạn thành công cho ${expiredCount} đơn hàng quá hạn.`,
    );
  } catch (error) {
    console.error('[ExpireOrdersCLI] Lỗi khi xử lý đơn hết hạn:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
