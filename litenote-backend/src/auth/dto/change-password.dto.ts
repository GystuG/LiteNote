import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: '当前密码',
    example: '123456',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  @MaxLength(100)
  currentPassword: string;

  @ApiProperty({
    description: '新密码',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: '新密码至少需要6个字符' })
  @MaxLength(100)
  newPassword: string;
}
