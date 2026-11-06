import { Controller, Post, Get, Param, Body, Req } from '@nestjs/common';
import { type Request } from 'express';
import { PaymentsService } from '../services/payments.service.js';
import { CreatePaymentAttemptDto } from '../dto/create-payment-attempt.dto.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';

@Controller('orders')
export class PaymentsCustomerController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // API-42: Khách hàng tạo hoặc tái sử dụng lần thử thanh toán
  @Post(':id/payment-attempts')
  createPaymentAttempt(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: CreatePaymentAttemptDto,
    @Req() req: Request,
  ) {
    const ipAddr = req.ip || req.socket.remoteAddress || '127.0.0.1';

    return this.paymentsService.createPaymentAttempt(
      userId,
      orderId,
      ipAddr,
      dto,
    );
  }

  // API-43: Lấy danh sách các lần thử thanh toán của một đơn hàng
  @Get(':id/payments')
  getOrderPayments(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') orderId: string,
  ) {
    return this.paymentsService.getPaymentsByOrder(userId, orderId, role);
  }
}
