import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PromotionsService } from '../services/promotions.service.js';
import { CreateCouponDto } from '../dto/create-coupon.dto.js';
import { UpdateCouponDto } from '../dto/update-coupon.dto.js';
import { QueryCouponsDto } from '../dto/query-coupons.dto.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';

@Controller('admin/coupons')
export class PromotionsAdminController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPERATOR)
  findAll(@Query() query: QueryCouponsDto) {
    return this.promotionsService.findAllAdmin(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOneAdmin(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCouponDto) {
    return this.promotionsService.createCoupon(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.promotionsService.updateCoupon(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  toggleStatus(@Param('id') id: string, @Body('is_active') isActive: boolean) {
    return this.promotionsService.toggleStatus(id, Boolean(isActive));
  }
}
