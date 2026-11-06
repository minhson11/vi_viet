import { Module } from '@nestjs/common';
import { ReviewsService } from './services/reviews.service.js';
import { ReviewsCustomerController } from './controllers/reviews-customer.controller.js';
import { ReviewsPublicController } from './controllers/reviews-public.controller.js';
import { ReviewsAdminController } from './controllers/reviews-admin.controller.js';

@Module({
  controllers: [
    ReviewsCustomerController,
    ReviewsPublicController,
    ReviewsAdminController,
  ],
  providers: [ReviewsService],
})
export class ReviewsModule {}
