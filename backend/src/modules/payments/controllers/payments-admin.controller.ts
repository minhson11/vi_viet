import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service.js';
import { RefundsService } from '../services/refunds.service.js';
import { QueryPaymentsDto } from '../dto/query-payments.dto.js';
import { CreateRefundDto } from '../dto/create-refund.dto.js';
import { RefundCommandDto } from '../dto/refund-command.dto.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';

@Controller('admin')
export class PaymentsAdminController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly refundsService: RefundsService,
  ) {}

  // API-46: Quản trị viên xem danh sách các giao dịch thanh toán
  @Get('payments')
  @Roles(Role.ADMIN, Role.OPERATOR)
  findAllPayments(@Query() query: QueryPaymentsDto) {
    return this.paymentsService.findAllAdmin(query);
  }

  // API-47: Quản trị viên đối soát giao dịch
  @Post('payments/:id/reconcile')
  @Roles(Role.ADMIN)
  reconcilePayment(
    @CurrentUser('id') adminId: string,
    @Param('id') paymentId: string,
    @Body('commandKey') commandKey: string,
    @Body('reason') reason?: string,
  ) {
    return this.paymentsService.reconcilePayment(
      adminId,
      paymentId,
      commandKey,
      reason,
    );
  }

  // API-48: Quản trị viên tạo yêu cầu hoàn tiền cho một giao dịch (BR-19)
  @Post('payments/:id/refunds')
  @Roles(Role.ADMIN)
  createRefund(
    @CurrentUser('id') adminId: string,
    @Param('id') paymentId: string,
    @Body() dto: CreateRefundDto,
  ) {
    return this.refundsService.createRefund(adminId, paymentId, dto);
  }

  // API-49: Quản trị viên thực thi lệnh hoàn tiền (BR-20)
  @Post('refunds/:id/commands')
  @Roles(Role.ADMIN)
  executeRefundCommand(
    @CurrentUser('id') adminId: string,
    @Param('id') refundId: string,
    @Body() dto: RefundCommandDto,
  ) {
    return this.refundsService.executeRefundCommand(adminId, refundId, dto);
  }
}
