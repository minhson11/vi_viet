import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';
import { UsersService } from '../services/users.service.js';
import { QueryCustomerOrdersDto } from '../dto/admin-customer.dto.js';

@ApiTags('Quản trị khách hàng 360 độ (Admin)')
@ApiBearerAuth('JWT-auth')
@Roles(Role.ADMIN)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({
    summary:
      'Chân dung khách hàng 360 độ, tổng chi tiêu và địa chỉ (API-70)',
  })
  async getCustomerDetail(@Param('id') customerId: string) {
    return this.usersService.adminGetCustomerDetail(customerId);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Lịch sử toàn bộ đơn hàng của khách hàng (API-71)' })
  async getCustomerOrders(
    @Param('id') customerId: string,
    @Query() query: QueryCustomerOrdersDto,
  ) {
    return this.usersService.adminGetCustomerOrders(customerId, query);
  }
}
