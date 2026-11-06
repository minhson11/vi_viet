import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRefundDto {
  @IsNotEmpty({ message: 'Vui lòng cung cấp số tiền hoàn' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Số tiền hoàn phải là số hợp lệ' })
  @Min(1, { message: 'Số tiền hoàn tối thiểu là 1đ' })
  amount: number;

  @IsNotEmpty({ message: 'Vui lòng cung cấp lý do hoàn tiền' })
  @IsString({ message: 'Lý do hoàn tiền phải là chuỗi' })
  @MaxLength(500, { message: 'Lý do hoàn tối đa 500 ký tự' })
  reason: string;
}
