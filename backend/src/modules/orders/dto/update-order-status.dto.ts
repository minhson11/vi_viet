import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { orders_status } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'Trạng thái mới không được để trống' })
  @IsEnum(orders_status, { message: 'Trạng thái đơn hàng không hợp lệ' })
  status: orders_status;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Ghi chú tối đa 1000 ký tự' })
  note?: string;

  @IsOptional()
  @IsString({ message: 'Lý do hủy phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Lý do hủy tối đa 500 ký tự' })
  cancel_reason?: string;
}
