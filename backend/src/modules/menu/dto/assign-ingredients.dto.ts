import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { DishIngredientDataStatus } from './create-dish.dto.js';

export class DishIngredientItemDto {
  @Type(() => String)
  @IsString()
  @Matches(/^[1-9]\d*$/, { message: 'ingredient_id phải là số nguyên dương' })
  ingredient_id: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AssignIngredientsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DishIngredientItemDto)
  ingredients: DishIngredientItemDto[];

  @IsOptional()
  @IsEnum(DishIngredientDataStatus)
  ingredient_data_status?: DishIngredientDataStatus;
}
