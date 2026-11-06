import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateCouponDto {
  @IsNotEmpty({ message: 'Mã ưu đãi không được để trống' })
  @IsString({ message: 'Mã ưu đãi phải là chuỗi ký tự' })
  code: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Tổng tiền món phải là số' })
  @Min(0, { message: 'Tổng tiền món không được âm' })
  subtotal: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Phí giao hàng phải là số' })
  @Min(0, { message: 'Phí giao hàng không được âm' })
  shipping_fee?: number = 0;
}
