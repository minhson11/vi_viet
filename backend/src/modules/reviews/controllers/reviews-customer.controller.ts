import { Controller, Put, Param, Body } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service.js';
import { SubmitReviewDto } from '../dto/submit-review.dto.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';

@Controller('order-items')
export class ReviewsCustomerController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // API-85: Khách hàng đánh giá món ăn sau khi đơn hoàn thành (BR-24, AC-16)
  @Put(':id/review')
  submitReview(
    @CurrentUser('id') userId: string,
    @Param('id') orderItemId: string,
    @Body() dto: SubmitReviewDto,
  ) {
    return this.reviewsService.submitReview(userId, orderItemId, dto);
  }
}
