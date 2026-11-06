import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service.js';
import { QueryReviewsDto } from '../dto/query-reviews.dto.js';
import { ModerateReviewDto } from '../dto/moderate-review.dto.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';

@Controller('admin/reviews')
@Roles(Role.ADMIN)
export class ReviewsAdminController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // API-72: Admin tra cứu danh sách đánh giá
  @Get()
  findAll(@Query() query: QueryReviewsDto) {
    return this.reviewsService.adminFindAll(query);
  }

  // API-73: Admin phản hồi hoặc ẩn đánh giá (BR-25)
  @Patch(':id')
  moderateReview(
    @CurrentUser('id') adminId: string,
    @Param('id') reviewId: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.adminModerateReview(adminId, reviewId, dto);
  }
}
