import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignTagsDto {
  @IsNotEmpty({ message: 'Danh sách tag_ids không được rỗng' })
  @IsArray({ message: 'tag_ids phải là một mảng' })
  @IsString({ each: true, message: 'Mỗi tag_id phải là chuỗi' })
  tag_ids: string[];
}
