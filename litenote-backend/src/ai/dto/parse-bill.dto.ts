import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
} from 'class-validator';

// 输入类型
export const INPUT_TYPES = ['image', 'text'] as const;
export type InputType = (typeof INPUT_TYPES)[number];

/**
 * 解析账单请求 DTO
 */
export class ParseBillDto {
  @ApiProperty({
    description: '输入类型',
    enum: INPUT_TYPES,
    example: 'text',
  })
  @IsString()
  @IsNotEmpty({ message: '输入类型不能为空' })
  @IsIn(INPUT_TYPES, { message: '输入类型必须是 image 或 text' })
  type: InputType;

  @ApiProperty({
    description: '输入内容（Base64 图片或文字内容）',
    example: '今天买了一杯星巴克咖啡 25.6 元',
  })
  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiPropertyOptional({
    description: '模型配置 ID，不传则使用默认模型',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  configId?: number;
}

/**
 * 解析后的账单数据
 */
export class ParsedBillDto {
  @ApiProperty({ description: '金额', example: 25.6 })
  amount: number;

  @ApiProperty({
    description: '类型',
    enum: ['income', 'expense'],
    example: 'expense',
  })
  type: 'income' | 'expense';

  @ApiProperty({ description: '分类名称', example: '餐饮' })
  categoryName: string;

  @ApiProperty({ description: '描述', example: '星巴克咖啡' })
  description: string;

  @ApiProperty({ description: '日期', example: '2026-01-25' })
  date: string;
}

/**
 * 解析账单响应 DTO
 */
export class ParseBillResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '解析结果', type: [ParsedBillDto] })
  bills: ParsedBillDto[];
}
