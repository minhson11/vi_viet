import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'code chỉ gồm chữ thường, số và dấu gạch ngang',
  })
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsBoolean()
  is_allergen?: boolean = false;
}
