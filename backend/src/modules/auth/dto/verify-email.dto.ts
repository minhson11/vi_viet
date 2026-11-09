import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Mã xác thực email' })
  @IsString({ message: 'Mã xác thực phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Mã xác thực không được để trống.' })
  token: string;
}
