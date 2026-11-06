import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { orders_fulfillment_type, orders_payment_method } from '@prisma/client';

export class CheckoutDto {
  @IsNotEmpty({ message: 'checkout_key không được để trống' })
  @IsString({ message: 'checkout_key phải là chuỗi' })
  @MaxLength(64, { message: 'checkout_key tối đa 64 ký tự' })
  checkout_key: string;

  @IsNotEmpty({ message: 'Hình thức nhận hàng không được để trống' })
  @IsEnum(orders_fulfillment_type, {
    message: 'Hình thức nhận hàng phải là DELIVERY hoặc PICKUP',
  })
  fulfillment_type: orders_fulfillment_type;

  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsEnum(orders_payment_method, {
    message: 'Phương thức thanh toán phải là COD hoặc VNPAY',
  })
  payment_method: orders_payment_method;

  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString({ message: 'Tên người nhận phải là chuỗi ký tự' })
  @MaxLength(120, { message: 'Tên người nhận tối đa 120 ký tự' })
  recipient_name: string;

  @IsNotEmpty({ message: 'Số điện thoại người nhận không được để trống' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Matches(/^[0-9+]{9,15}$/, { message: 'Số điện thoại không hợp lệ' })
  recipient_phone: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ giao hàng phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Địa chỉ giao hàng tối đa 500 ký tự' })
  delivery_address?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú giao hàng phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Ghi chú giao hàng tối đa 500 ký tự' })
  delivery_note?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú cho quán phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  customer_note?: string;

  @IsOptional()
  @IsString({ message: 'Mã ưu đãi phải là chuỗi ký tự' })
  @MaxLength(40, { message: 'Mã ưu đãi tối đa 40 ký tự' })
  coupon_code?: string;
}
