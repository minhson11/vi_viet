import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddToCartDto } from './add-to-cart.dto.js';

export class MergeCartDto {
  @IsArray({ message: 'Danh sách món cần hợp nhất phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => AddToCartDto)
  items: AddToCartDto[];
}
