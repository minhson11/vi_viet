import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @IsNotEmpty({ message: 'Tên biến thể không được để trống' })
  @IsString()
  @MaxLength(100, { message: 'Tên biến thể tối đa 100 ký tự' })
  name: string;

  @IsNotEmpty({ message: 'Giá biến thể không được để trống' })
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Giá biến thể không được âm' })
  price: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
