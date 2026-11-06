import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DishIngredientDataStatus {
  UNKNOWN = 'UNKNOWN',
  PARTIAL = 'PARTIAL',
  VERIFIED = 'VERIFIED',
}

export enum DishAvailability {
  AVAILABLE = 'AVAILABLE',
  SOLD_OUT = 'SOLD_OUT',
  HIDDEN = 'HIDDEN',
}

export class DefaultVariantDto {
  @IsNotEmpty({ message: 'Tên biến thể mặc định không được để trống' })
  @IsString()
  @MaxLength(100)
  name: string = 'Tiêu chuẩn';

  @IsNotEmpty({ message: 'Giá biến thể mặc định không được để trống' })
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Giá biến thể không được âm' })
  price: number;
}

export class CreateDishDto {
  @IsNotEmpty({ message: 'category_id không được để trống' })
  @IsString({ message: 'category_id phải là chuỗi ID' })
  category_id: string;

  @IsNotEmpty({ message: 'Tên món ăn không được để trống' })
  @IsString()
  @MaxLength(160, { message: 'Tên món tối đa 160 ký tự' })
  name: string;

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
  ingredient_data_status?: DishIngredientDataStatus =
    DishIngredientDataStatus.UNKNOWN;

  @IsOptional()
  @IsEnum(DishAvailability, { message: 'Trạng thái mở bán không hợp lệ' })
  availability?: DishAvailability = DishAvailability.AVAILABLE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number = 0;

  @IsNotEmpty({
    message: 'Món ăn mở bán cần ít nhất một biến thể mặc định ban đầu (BR-03)',
  })
  @ValidateNested()
  @Type(() => DefaultVariantDto)
  default_variant: DefaultVariantDto;
}
