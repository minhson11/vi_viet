import {
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DishIngredientDataStatus,
  DishAvailability,
} from './create-dish.dto.js';

export class UpdateDishDto {
  @IsOptional()
  @IsString({ message: 'category_id phải là chuỗi ID' })
  category_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160, { message: 'Tên món tối đa 160 ký tự' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180, { message: 'Slug món tối đa 180 ký tự' })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  story?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3, { message: 'Mức cay tối đa là 3' })
  spicy_level?: number;

  @IsOptional()
  @IsEnum(DishIngredientDataStatus, {
    message: 'Trạng thái dữ liệu thành phần không hợp lệ',
  })
  ingredient_data_status?: DishIngredientDataStatus;

  @IsOptional()
  @IsEnum(DishAvailability, { message: 'Trạng thái mở bán không hợp lệ' })
  availability?: DishAvailability;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;
}
