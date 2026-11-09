import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({
    description: 'Tiêu đề cuộc trò chuyện (tuỳ chọn)',
    example: 'Tư vấn món ăn thanh đạm trưa nay',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
