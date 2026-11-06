import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsNotEmpty({ message: 'dish_id không được để trống' })
  @IsString({ message: 'dish_id phải là chuỗi' })
  dish_id: string;

  @IsNotEmpty({ message: 'variant_id không được để trống' })
  @IsString({ message: 'variant_id phải là chuỗi' })
  variant_id: string;

  @IsOptional()
  @IsArray({ message: 'option_value_ids phải là mảng chuỗi' })
  @IsString({ each: true, message: 'Mỗi option_value_id phải là chuỗi' })
  option_value_ids?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Max(99, { message: 'Số lượng tối đa mỗi món là 99' })
  quantity?: number = 1;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  note?: string;
}
