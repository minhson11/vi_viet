import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsInt,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { coupons_discount_type } from '@prisma/client';

export class CreateCouponDto {
  @IsNotEmpty({ message: 'Mã ưu đãi không được để trống' })
  @IsString({ message: 'Mã ưu đãi phải là chuỗi ký tự' })
  @MaxLength(40, { message: 'Mã ưu đãi tối đa 40 ký tự' })
  code: string;

  @IsNotEmpty({ message: 'Tên chương trình ưu đãi không được để trống' })
  @IsString({ message: 'Tên chương trình ưu đãi phải là chuỗi ký tự' })
  @MaxLength(160, { message: 'Tên ưu đãi tối đa 160 ký tự' })
  name: string;

  @IsNotEmpty({ message: 'Loại giảm giá không được để trống' })
  @IsEnum(coupons_discount_type, {
    message: 'Loại giảm giá phải là FIXED, PERCENT hoặc FREE_SHIPPING',
  })
  discount_type: coupons_discount_type;

  @Type(() => Number)
  @IsNumber({}, { message: 'Giá trị giảm phải là số' })
  @Min(0, { message: 'Giá trị giảm không được âm' })
  discount_value: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Đơn hàng tối thiểu phải là số' })
  @Min(0, { message: 'Đơn hàng tối thiểu không được âm' })
  min_subtotal?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Mức giảm tối đa phải là số' })
  @Min(0, { message: 'Mức giảm tối đa không được âm' })
  max_discount?: number;

  @IsNotEmpty({ message: 'Thời gian bắt đầu không được để trống' })
  @IsDateString({}, { message: 'Thời gian bắt đầu phải là định dạng ISO date' })
  starts_at: string;

  @IsNotEmpty({ message: 'Thời gian kết thúc không được để trống' })
  @IsDateString(
    {},
    { message: 'Thời gian kết thúc phải là định dạng ISO date' },
  )
  ends_at: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Tổng lượt dùng phải là số nguyên' })
  @Min(1, { message: 'Tổng lượt dùng tối thiểu là 1' })
  total_limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Lượt dùng mỗi khách phải là số nguyên' })
  @Min(1, { message: 'Lượt dùng mỗi khách tối thiểu là 1' })
  per_user_limit?: number = 1;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
  is_active?: boolean = true;
}
