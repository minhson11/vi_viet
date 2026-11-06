import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DishImageKind } from './create-dish-image.dto.js';

export class UploadDishImageDto {
  @IsOptional()
  @IsEnum(DishImageKind, {
    message: 'Loại ảnh phải là COVER, GALLERY hoặc CUTOUT',
  })
  kind?: DishImageKind = DishImageKind.GALLERY;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt_text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number = 0;
}
