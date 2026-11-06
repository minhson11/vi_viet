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

export class CreateOptionGroupDto {
  @IsNotEmpty({ message: 'Tên nhóm tùy chọn không được để trống' })
  @IsString()
  @MaxLength(100, { message: 'Tên nhóm tối đa 100 ký tự' })
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'min_select tối thiểu là 0' })
  min_select?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'max_select tối thiểu là 1' })
  max_select?: number = 1;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

export class UpdateOptionGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_select?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_select?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
