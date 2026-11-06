import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DishImageKind {
  COVER = 'COVER',
  GALLERY = 'GALLERY',
  CUTOUT = 'CUTOUT',
}

export class CreateDishImageDto {
  @IsNotEmpty({ message: 'Đường dẫn ảnh không được để trống' })
  @IsString()
  @MaxLength(500)
  asset_path: string;

  @IsOptional()
  @IsEnum(DishImageKind, {
    message: 'Loại ảnh phải là COVER, GALLERY hoặc CUTOUT',
  })
  kind?: DishImageKind = DishImageKind.GALLERY;

  @IsNotEmpty({ message: 'alt_text hỗ trợ tiếp cận không được để trống' })
  @IsString()
  @MaxLength(255)
  alt_text: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number = 0;
}
