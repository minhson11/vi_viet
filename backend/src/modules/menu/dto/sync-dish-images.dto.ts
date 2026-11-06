import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DishImageKind } from './create-dish-image.dto.js';

export class SyncDishImageItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  asset_path: string;

  @IsOptional()
  @IsEnum(DishImageKind)
  kind?: DishImageKind;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsString()
  alt_text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;
}

export class SyncDishImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncDishImageItemDto)
  images: SyncDishImageItemDto[];
}
