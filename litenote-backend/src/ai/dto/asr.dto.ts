import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * ASR 转写请求 DTO
 */
export class AsrRequestDto {
  @ApiProperty({
    description: 'Base64 编码的音频数据',
  })
  @IsString()
  @IsNotEmpty({ message: '音频数据不能为空' })
  audioBase64: string;

  @ApiPropertyOptional({
    description: '音频 MIME 类型',
    example: 'audio/aac',
    default: 'audio/aac',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;
}
