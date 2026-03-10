import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  MaxLength,
} from 'class-validator';

// 支持的 AI 服务商
export const AI_PROVIDERS = ['claude', 'openai', 'deepseek', 'qwen'] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];

/**
 * 创建 AI 模型配置 DTO
 */
export class CreateAIConfigDto {
  @ApiProperty({ description: '显示名称', example: '我的 Claude' })
  @IsString()
  @IsNotEmpty({ message: '名称不能为空' })
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '服务商',
    enum: AI_PROVIDERS,
    example: 'claude',
  })
  @IsString()
  @IsNotEmpty({ message: '服务商不能为空' })
  @IsIn(AI_PROVIDERS, { message: '不支持的服务商' })
  provider: AIProvider;

  @ApiProperty({ description: 'API Key', example: 'sk-ant-xxxxx' })
  @IsString()
  @IsNotEmpty({ message: 'API Key 不能为空' })
  apiKey: string;

  @ApiPropertyOptional({
    description: '自定义 API 地址',
    example: 'https://api.anthropic.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  apiBaseUrl?: string;

  @ApiProperty({
    description: '模型名称',
    example: 'claude-sonnet-4-20250514',
  })
  @IsString()
  @IsNotEmpty({ message: '模型名称不能为空' })
  @MaxLength(100)
  model: string;

  @ApiPropertyOptional({ description: '是否支持图片识别', default: false })
  @IsOptional()
  @IsBoolean()
  supportsVision?: boolean;

  @ApiPropertyOptional({ description: '是否设为默认', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/**
 * 更新 AI 模型配置 DTO
 */
export class UpdateAIConfigDto extends PartialType(CreateAIConfigDto) {}

/**
 * AI 模型配置响应 DTO（不包含敏感信息）
 */
export class AIConfigResponseDto {
  @ApiProperty({ description: '配置ID' })
  id: number;

  @ApiProperty({ description: '显示名称' })
  name: string;

  @ApiProperty({ description: '服务商', enum: AI_PROVIDERS })
  provider: AIProvider;

  @ApiProperty({ description: '模型名称' })
  model: string;

  @ApiPropertyOptional({ description: '自定义 API 地址' })
  apiBaseUrl?: string;

  @ApiProperty({ description: '是否默认' })
  isDefault: boolean;

  @ApiProperty({ description: '是否支持图片识别' })
  supportsVision: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

/**
 * AI 模型配置详情响应 DTO（包含 API Key，用于编辑）
 */
export class AIConfigDetailResponseDto extends AIConfigResponseDto {
  @ApiProperty({ description: 'API Key' })
  apiKey: string;
}
