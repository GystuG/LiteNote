import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsEmail,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: '用户昵称',
    example: '小明',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({
    description: '用户名',
    example: 'xiaoming',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: '用户名至少需要3个字符' })
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'xiaoming@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiPropertyOptional({
    description: '头像URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}
