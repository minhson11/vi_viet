import { Controller, Get, Req, Res } from '@nestjs/common';
import { type Request, type Response } from 'express';
import { PaymentsService } from '../services/payments.service.js';
import { Public } from '../../../common/decorators/public.decorator.js';

@Controller('payments/vnpay')
export class PaymentsWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // API-44: Return URL - Trình duyệt của khách được VNPay chuyển hướng về sau khi thanh toán
  @Public()
  @Get('return')
  async handleReturn(@Req() req: Request, @Res() res: Response) {
    const result = await this.paymentsService.handleVnpayReturn(
      req.query as Record<string, any>,
    );
    // Chuyển hướng 303 See Other về giao diện Frontend
    return res.redirect(303, result.redirectUrl);
  }

  // API-45: IPN Webhook - Server VNPay gọi trực tiếp ngầm (Server-to-Server) để xác nhận giao dịch
  @Public()
  @Get('ipn')
  async handleIpn(@Req() req: Request, @Res() res: Response) {
    const result = await this.paymentsService.handleVnpayIpn(
      req.query as Record<string, any>,
    );
    // Trả JSON nguyên bản { RspCode: '00', Message: '...' } không qua envelope
    return res.status(200).json(result);
  }
}
