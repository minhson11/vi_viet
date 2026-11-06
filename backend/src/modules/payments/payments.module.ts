import { Module } from '@nestjs/common';
import { VnpayService } from './services/vnpay.service.js';
import { PaymentsService } from './services/payments.service.js';
import { RefundsService } from './services/refunds.service.js';
import { PaymentsCustomerController } from './controllers/payments-customer.controller.js';
import { PaymentsWebhookController } from './controllers/payments-webhook.controller.js';
import { PaymentsAdminController } from './controllers/payments-admin.controller.js';

@Module({
  controllers: [
    PaymentsCustomerController,
    PaymentsWebhookController,
    PaymentsAdminController,
  ],
  providers: [VnpayService, PaymentsService, RefundsService],
})
export class PaymentsModule {}
