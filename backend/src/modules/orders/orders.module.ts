import { Module } from '@nestjs/common';
import { OrdersService } from './services/orders.service.js';
import { OrderStateMachineService } from './services/order-state-machine.service.js';
import { KitchenService } from './services/kitchen.service.js';
import { OrdersCustomerController } from './controllers/orders-customer.controller.js';
import { OrdersAdminController } from './controllers/orders-admin.controller.js';
import { KitchenController } from './controllers/kitchen.controller.js';
import { PromotionsModule } from '../promotions/promotions.module.js';
import { PaymentExpirationJob } from './infrastructure/jobs/payment-expiration.job.js';
import { StoreSettingsQueryService } from './infrastructure/persistence/store-settings-query.service.js';
import { OrderExpirationService } from './services/order-expiration.service.js';

@Module({
  imports: [PromotionsModule],
  controllers: [
    OrdersCustomerController,
    OrdersAdminController,
    KitchenController,
  ],
  providers: [
    OrdersService,
    OrderStateMachineService,
    KitchenService,
    OrderExpirationService,
    PaymentExpirationJob,
    StoreSettingsQueryService,
  ],
  exports: [OrderExpirationService],
})
export class OrdersModule {}
