import { IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi' })
  full_name?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/[\s.-]/g, '');
    return cleaned === '' ? undefined : cleaned;
  })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Matches(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, {
    message:
      'Số điện thoại không đúng định dạng (VD: 0901234567 hoặc +84901234567)',
  })
  phone?: string;
}
