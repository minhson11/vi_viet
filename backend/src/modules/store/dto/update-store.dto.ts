import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  opening_hours?: Record<string, unknown>;

  @IsOptional()
  delivery_rules?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  accepting_orders?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  payment_timeout_minutes?: number;
}
