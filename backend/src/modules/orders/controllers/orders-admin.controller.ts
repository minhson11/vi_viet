import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from '../services/orders.service.js';
import { QueryOrdersDto } from '../dto/query-orders.dto.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';

@Controller('admin/orders')
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPERATOR)
  findAll(@Query() query: QueryOrdersDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  findOne(@Param('id') orderId: string, @CurrentUser('id') userId: string) {
    return this.ordersService.getOrderDetail(userId, orderId, 'ADMIN');
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.OPERATOR)
  updateStatus(
    @Param('id') orderId: string,
    @CurrentUser('id') actorUserId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, actorUserId, dto);
  }
}
