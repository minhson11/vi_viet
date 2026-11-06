import { Controller, Post, Get, Body } from '@nestjs/common';
import { PromotionsService } from '../services/promotions.service.js';
import { ValidateCouponDto } from '../dto/validate-coupon.dto.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';

@Controller('coupons')
export class PromotionsPublicController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('validate')
  validateCoupon(
    @CurrentUser('id') userId: string,
    @Body() dto: ValidateCouponDto,
  ) {
    return this.promotionsService.validateCoupon(
      userId,
      dto.code,
      dto.subtotal,
      dto.shipping_fee,
    );
  }

  @Get('available')
  getAvailableCoupons(@CurrentUser('id') userId: string) {
    return this.promotionsService.getAvailableCoupons(userId);
  }
}
