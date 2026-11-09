import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'khachhang@example.com', description: 'Email tài khoản cần khôi phục mật khẩu' })
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email: string;
}
