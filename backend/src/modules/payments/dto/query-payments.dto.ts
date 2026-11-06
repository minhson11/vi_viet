import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { payments_status } from '@prisma/client';

export class QueryPaymentsDto {
  @IsOptional()
  @IsEnum(payments_status, { message: 'Trạng thái thanh toán không hợp lệ' })
  status?: payments_status;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  merchant_reference?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang tối thiểu là 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Max(100, { message: 'Số lượng tối đa là 100' })
  limit?: number = 20;
}
