import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsInt({ message: 'Mức độ cay phải là số nguyên' })
  @Min(0, { message: 'Mức độ cay tối thiểu là 0 (Không cay)' })
  @Max(3, { message: 'Mức độ cay tối đa là 3 (Cay nhiều)' })
  spicy_level?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Ngân sách mỗi bữa phải là số' })
  @Min(0, { message: 'Ngân sách không được âm' })
  budget_per_meal?: number;

  @IsOptional()
  @IsBoolean({ message: 'personalization_enabled phải là boolean' })
  personalization_enabled?: boolean;

  @IsOptional()
  @IsString({ message: 'Ghi chú ăn kiêng phải là chuỗi' })
  dietary_note?: string;
}
