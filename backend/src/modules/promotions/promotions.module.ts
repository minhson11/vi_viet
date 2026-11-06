import { Module } from '@nestjs/common';
import { PromotionsService } from './services/promotions.service.js';
import { PromotionsPublicController } from './controllers/promotions-public.controller.js';
import { PromotionsAdminController } from './controllers/promotions-admin.controller.js';

@Module({
  controllers: [PromotionsPublicController, PromotionsAdminController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
