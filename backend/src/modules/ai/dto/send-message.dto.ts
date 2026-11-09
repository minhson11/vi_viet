import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Nội dung tin nhắn gửi tới AI tư vấn ẩm thực (1 - 2000 ký tự)',
    example: 'Gợi ý cho tôi bữa trưa 3 người, có 1 người ăn cay nhẹ, ngân sách khoảng 250k',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({
    description: 'Khóa idempotency đảm bảo không gửi trùng lặp yêu cầu',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestKey?: string;
}
