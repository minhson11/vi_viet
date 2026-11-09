import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';
import { ReportsService } from '../services/reports.service.js';
import { QueryReportDto } from '../dto/query-report.dto.js';
import { QueryTopDishesDto } from '../dto/query-top-dishes.dto.js';

@ApiTags('Báo cáo & Thống kê kinh doanh (Admin)')
@ApiBearerAuth('JWT-auth')
@Roles(Role.ADMIN)
@Controller('admin/reports')
export class ReportsAdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({
    summary:
      'Báo cáo tổng hợp doanh thu, đơn hàng và phương thức thanh toán (API-79)',
  })
  async getSummary(@Query() query: QueryReportDto) {
    return this.reportsService.getSummary(query);
  }

  @Get('top-dishes')
  @ApiOperation({
    summary: 'Thống kê danh sách món ăn bán chạy nhất theo kỳ (API-80)',
  })
  async getTopDishes(@Query() query: QueryTopDishesDto) {
    return this.reportsService.getTopDishes(query);
  }
}
