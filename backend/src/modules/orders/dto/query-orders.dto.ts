import { IsOptional, IsInt, Min, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { orders_status, orders_fulfillment_type } from '@prisma/client';

export class QueryOrdersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(orders_status)
  status?: orders_status;

  @IsOptional()
  @IsEnum(orders_fulfillment_type)
  fulfillment_type?: orders_fulfillment_type;

  @IsOptional()
  @IsString()
  search?: string;
}
