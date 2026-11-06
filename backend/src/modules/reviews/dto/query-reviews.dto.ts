import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { reviews_visibility } from '@prisma/client';

export class QueryReviewsDto {
  @IsOptional()
  @IsEnum(reviews_visibility, { message: 'Trạng thái hiển thị không hợp lệ' })
  visibility?: reviews_visibility;

  @IsOptional()
  @IsString()
  dish_id?: string;

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
