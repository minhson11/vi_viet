import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Mã xác thực từ email khôi phục' })
  @IsString({ message: 'Mã xác thực phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Mã xác thực không được để trống.' })
  token: string;

  @ApiProperty({ example: 'MatKhauMoi@2026', description: 'Mật khẩu mới (tối thiểu 10 ký tự)' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự.' })
  @MinLength(10, { message: 'Mật khẩu mới phải có ít nhất 10 ký tự.' })
  @MaxLength(128, { message: 'Mật khẩu mới không được vượt quá 128 ký tự.' })
  new_password: string;
}
