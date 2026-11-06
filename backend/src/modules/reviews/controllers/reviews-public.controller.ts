import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service.js';
import { Public } from '../../../common/decorators/public.decorator.js';

@Controller('dishes')
export class ReviewsPublicController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // API-25: Public xem danh sách đánh giá công khai của một món ăn
  @Public()
  @Get(':id/reviews')
  getDishReviews(
    @Param('id') dishId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.reviewsService.getDishReviews(dishId, pageNum, limitNum);
  }
}
