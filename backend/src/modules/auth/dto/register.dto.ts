import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email!: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải chứa ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải bao gồm cả chữ cái và chữ số',
  })
  password!: string;

  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  full_name!: string;

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
