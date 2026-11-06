import { IsEnum, IsOptional, IsString } from 'class-validator';
import { payments_provider } from '@prisma/client';

export class CreatePaymentAttemptDto {
  @IsOptional()
  @IsEnum(payments_provider, {
    message: 'Cổng thanh toán phải là VNPAY hoặc COD',
  })
  provider?: payments_provider = payments_provider.VNPAY;

  @IsOptional()
  @IsString()
  gateway?: string;

  @IsOptional()
  @IsString()
  bank_code?: string;
}
