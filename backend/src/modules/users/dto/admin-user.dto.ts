import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../../../common/enums/role.enum.js';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  DEACTIVATED = 'DEACTIVATED',
}

export class AdminQueryUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái tài khoản không hợp lệ' })
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái tài khoản không hợp lệ' })
  status?: UserStatus;
}

export class AdminCreateUserDto {
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  full_name: string;

  @IsString({ message: 'Email phải là chuỗi ký tự' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phone?: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  password: string;

  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role: Role;
}
