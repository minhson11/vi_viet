import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsObject,
  IsArray,
} from 'class-validator';

export class FlavorProfileDto {
  @IsString()
  top: string;

  @IsString()
  heart: string;

  @IsString()
  base: string;
}

export class MainDishDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @IsString()
  image: string;
}

export class SatelliteDishDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @IsString()
  image: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsObject()
  flavors?: FlavorProfileDto;
}

export class CreateStorySectionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  badgeTag?: string;

  @IsOptional()
  @IsString()
  headlineTitle?: string;

  @IsOptional()
  @IsString()
  headlineHighlight?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  themeColor?: 'primary' | 'secondary' | 'gold';

  @IsOptional()
  @IsString()
  animationType?: 'roll' | '3dflip' | 'spiral';

  @IsOptional()
  @IsString()
  badgeTop?: string;

  @IsOptional()
  @IsString()
  badgeBottom?: string;

  @IsOptional()
  @IsObject()
  flavors?: FlavorProfileDto;

  @IsOptional()
  @IsObject()
  mainDish?: MainDishDto;

  @IsOptional()
  @IsArray()
  satelliteDishes?: SatelliteDishDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
