import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryReportDto {
  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z', description: 'Ngày bắt đầu tính báo cáo' })
  @IsOptional()
  @IsDateString({}, { message: 'Từ ngày (from) phải có định dạng ISO 8601 hợp lệ.' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-30T23:59:59.999Z', description: 'Ngày kết thúc tính báo cáo' })
  @IsOptional()
  @IsDateString({}, { message: 'Đến ngày (to) phải có định dạng ISO 8601 hợp lệ.' })
  to?: string;
}
