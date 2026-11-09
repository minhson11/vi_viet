import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTopDishesDto {
  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z', description: 'Ngày bắt đầu tính' })
  @IsOptional()
  @IsDateString({}, { message: 'Từ ngày (from) phải có định dạng ISO 8601 hợp lệ.' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-30T23:59:59.999Z', description: 'Ngày kết thúc tính' })
  @IsOptional()
  @IsDateString({}, { message: 'Đến ngày (to) phải có định dạng ISO 8601 hợp lệ.' })
  to?: string;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Số lượng món hiển thị (1 - 50)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Giới hạn số lượng (limit) phải là số nguyên.' })
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
