import { CreateStorySectionDto } from './create-story-section.dto.js';
import { IsArray, ValidateNested, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStorySectionDto extends CreateStorySectionDto {}

export class ReorderStorySectionItemDto {
  @IsString()
  id: string;

  @Type(() => Number)
  @IsInt()
  sort_order: number;
}

export class ReorderStorySectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderStorySectionItemDto)
  items: ReorderStorySectionItemDto[];
}
