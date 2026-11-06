import { IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { reviews_visibility } from '@prisma/client';

export class ModerateReviewDto {
  @IsOptional()
  @IsString({ message: 'Phản hồi phải là chuỗi' })
  @MaxLength(2000, { message: 'Phản hồi từ quán tối đa 2000 ký tự' })
  reply?: string;

  @IsOptional()
  @IsEnum(reviews_visibility, { message: 'Trạng thái hiển thị không hợp lệ' })
  visibility?: reviews_visibility;

  @IsOptional()
  @IsString({ message: 'Lý do kiểm duyệt phải là chuỗi' })
  @MaxLength(500, { message: 'Lý do kiểm duyệt tối đa 500 ký tự' })
  moderationReason?: string;
}
