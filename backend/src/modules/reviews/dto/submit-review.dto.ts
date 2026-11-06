import {
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitReviewDto {
  @IsNotEmpty({ message: 'Vui lòng đánh giá số sao (1-5 sao)' })
  @Type(() => Number)
  @IsInt({ message: 'Số sao phải là số nguyên' })
  @Min(1, { message: 'Số sao tối thiểu là 1' })
  @Max(5, { message: 'Số sao tối đa là 5' })
  rating: number;

  @IsOptional()
  @IsString({ message: 'Nội dung nhận xét phải là chuỗi' })
  @MaxLength(2000, { message: 'Nội dung nhận xét tối đa 2000 ký tự' })
  content?: string;
}
