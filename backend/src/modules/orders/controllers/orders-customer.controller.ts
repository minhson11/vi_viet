import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from '../services/orders.service.js';
import { CheckoutDto } from '../dto/checkout.dto.js';
import { QueryOrdersDto } from '../dto/query-orders.dto.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';

@Controller('orders')
export class OrdersCustomerController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@CurrentUser('id') userId: string, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(userId, dto);
  }

  @Get()
  getMyOrders(
    @CurrentUser('id') userId: string,
    @Query() query: QueryOrdersDto,
  ) {
    return this.ordersService.getMyOrders(userId, query);
  }

  @Get(':id')
  getOrderDetail(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.getOrderDetail(userId, orderId, role);
  }

  @Post(':id/cancel')
  cancelMyOrder(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: {
      reason?: string;
      bank_name?: string;
      bank_account_number?: string;
      bank_account_name?: string;
    },
  ) {
    return this.ordersService.cancelMyOrder(userId, orderId, dto);
  }
}
