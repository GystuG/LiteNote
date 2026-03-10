import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({ description: '预算名称', example: '餐饮预算' })
  @IsString()
  name: string;

  @ApiProperty({ description: '预算金额', example: 3000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: '预算周期',
    enum: ['monthly', 'yearly'],
    example: 'monthly',
  })
  @IsString()
  @IsIn(['monthly', 'yearly'])
  period: string;

  @ApiPropertyOptional({ description: '关联分类ID', example: 1 })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: '超支提醒百分比', example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  alertAt?: number;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional({ description: '预算名称', example: '餐饮预算' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '预算金额', example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: '预算周期',
    enum: ['monthly', 'yearly'],
    example: 'monthly',
  })
  @IsOptional()
  @IsString()
  @IsIn(['monthly', 'yearly'])
  period?: string;

  @ApiPropertyOptional({ description: '关联分类ID', example: 1 })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: '超支提醒百分比', example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  alertAt?: number;

  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
