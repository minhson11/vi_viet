import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export enum RefundCommandType {
  START_PROCESSING = 'START_PROCESSING',
  TRIGGER_VNPAY_REFUND = 'TRIGGER_VNPAY_REFUND',
  CONFIRM_MANUAL_SUCCESS = 'CONFIRM_MANUAL_SUCCESS',
  MARK_FAILED = 'MARK_FAILED',
}

export class RefundCommandDto {
  @IsNotEmpty({ message: 'Vui lòng cung cấp loại lệnh hoàn tiền' })
  @IsEnum(RefundCommandType, { message: 'Loại lệnh hoàn tiền không hợp lệ' })
  type: RefundCommandType;

  @IsNotEmpty({ message: 'Vui lòng cung cấp commandKey chống trùng lặp' })
  @IsString({ message: 'commandKey phải là chuỗi' })
  commandKey: string;

  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi' })
  @MaxLength(500, { message: 'Lý do tối đa 500 ký tự' })
  reason?: string;

  @IsOptional()
  @IsString({ message: 'Mã tham chiếu đối soát phải là chuỗi' })
  @MaxLength(150, { message: 'Mã tham chiếu tối đa 150 ký tự' })
  providerReference?: string;
}
