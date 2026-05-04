import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';

/**
 * 聊天请求 DTO
 */
export class ChatRequestDto {
  @ApiProperty({
    description: '消息内容',
    example: '今天午餐花了35元',
  })
  @IsString()
  @IsNotEmpty({ message: '消息内容不能为空' })
  content: string;

  @ApiPropertyOptional({
    description: '会话ID，不传则创建新会话',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  sessionId?: number;

  @ApiPropertyOptional({
    description: 'AI配置ID，仅创建新会话时使用',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  configId?: number;

  @ApiPropertyOptional({
    description: 'Base64编码的图片',
  })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional({
    description: 'Base64编码的图片列表（多图）',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageBase64List?: string[];
}

/**
 * 重命名会话 DTO
 */
export class RenameSessionDto {
  @ApiProperty({
    description: '新的会话标题',
    example: '午餐记账',
  })
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;
}

