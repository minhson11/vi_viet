import { Controller, Get, Post, Param } from '@nestjs/common';
import { KitchenService } from '../services/kitchen.service.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';

@Controller('kitchen')
@Roles(Role.KITCHEN, Role.ADMIN)
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('queue')
  getKitchenQueue() {
    return this.kitchenService.getKitchenQueue();
  }

  @Post('orders/:id/start')
  startCooking(
    @Param('id') orderId: string,
    @CurrentUser('id') kitchenUserId: string,
  ) {
    return this.kitchenService.startCooking(orderId, kitchenUserId);
  }

  @Post('orders/:id/finish')
  finishCooking(
    @Param('id') orderId: string,
    @CurrentUser('id') kitchenUserId: string,
  ) {
    return this.kitchenService.finishCooking(orderId, kitchenUserId);
  }
}
