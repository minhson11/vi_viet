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

export class CreateOptionValueDto {
  @IsNotEmpty({ message: 'Tên lựa chọn không được để trống' })
  @IsString()
  @MaxLength(100, { message: 'Tên lựa chọn tối đa 100 ký tự' })
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Phụ thu không được âm' })
  extra_price?: number = 0;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

export class UpdateOptionValueDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  extra_price?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
