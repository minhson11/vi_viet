import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetConversationQueryDto {
  @ApiPropertyOptional({
    description: 'Phân trang: lấy tin nhắn trước id này',
  })
  @IsOptional()
  @IsString()
  beforeId?: string;

  @ApiPropertyOptional({
    description: 'Số lượng tin nhắn cần lấy (1 - 50, mặc định 20)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
