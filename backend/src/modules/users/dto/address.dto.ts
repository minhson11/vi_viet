import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAddressDto {
  @IsString({ message: 'Tên người nhận phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  recipient_name!: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[0-9+]{9,15}$/, { message: 'Số điện thoại không hợp lệ' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone!: string;

  @IsString({ message: 'Địa chỉ chi tiết phải là chuỗi' })
  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  address_line!: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú giao hàng phải là chuỗi' })
  delivery_note?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Vĩ độ phải là số' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Kinh độ phải là số' })
  longitude?: number;

  @IsOptional()
  @IsBoolean({ message: 'Địa chỉ mặc định phải là boolean' })
  is_default?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString({ message: 'Tên người nhận phải là chuỗi' })
  recipient_name?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[0-9+]{9,15}$/, { message: 'Số điện thoại không hợp lệ' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ chi tiết phải là chuỗi' })
  address_line?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú giao hàng phải là chuỗi' })
  delivery_note?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Vĩ độ phải là số' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Kinh độ phải là số' })
  longitude?: number;

  @IsOptional()
  @IsBoolean({ message: 'Địa chỉ mặc định phải là boolean' })
  is_default?: boolean;
}
