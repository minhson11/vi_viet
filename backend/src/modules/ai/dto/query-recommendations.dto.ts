import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryRecommendationsDto {
  @ApiPropertyOptional({
    description: 'Số lượng món đề xuất cần lấy (1 - 12, mặc định 6)',
    default: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number = 6;
}
