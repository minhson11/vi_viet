import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { user_interactions_event_type } from '@prisma/client';

export class TrackInteractionDto {
  @ApiProperty({
    description: 'ID của món ăn tương tác',
    example: '12',
  })
  @IsString()
  @IsNotEmpty()
  dishId!: string;

  @ApiPropertyOptional({
    description: 'ID của recommendation_items nếu tương tác bắt nguồn từ mục gợi ý',
    example: '105',
  })
  @IsOptional()
  @IsString()
  recommendationId?: string;

  @ApiProperty({
    description: 'Loại sự kiện tương tác',
    enum: user_interactions_event_type,
    example: user_interactions_event_type.CLICK_RECOMMENDATION,
  })
  @IsEnum(user_interactions_event_type)
  eventType!: user_interactions_event_type;

  @ApiProperty({
    description: 'Khóa duy nhất của sự kiện phía client (chống double click / replay)',
    example: 'evt_view_dish_12_1715420192',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  eventKey!: string;

  @ApiPropertyOptional({
    description: 'Thời điểm xảy ra sự kiện ISO timestamp',
    example: '2026-11-09T07:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  occurredAt?: string;
}
