import { IsEnum, IsNotEmpty } from 'class-validator';
import { DishAvailability } from './create-dish.dto.js';

export class UpdateDishAvailabilityDto {
  @IsNotEmpty({ message: 'Trạng thái mở bán không được để trống' })
  @IsEnum(DishAvailability, {
    message: 'Trạng thái phải là AVAILABLE, SOLD_OUT hoặc HIDDEN',
  })
  availability: DishAvailability;
}
