import { IsString, MaxLength, MinLength } from 'class-validator';

export class FirebaseLoginDto {
  @IsString()
  @MinLength(50)
  @MaxLength(10000)
  idToken!: string;
}
