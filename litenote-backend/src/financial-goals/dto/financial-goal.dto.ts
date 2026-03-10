import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFinancialGoalDto {
  @ApiProperty({ description: '目标名称', example: '攒首付' })
  @IsString()
  name: string;

  @ApiProperty({ description: '目标金额', example: 50000 })
  @IsNumber()
  @Min(0.01)
  targetAmount: number;

  @ApiPropertyOptional({ description: '当前已存金额', example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @ApiPropertyOptional({
    description: '截止日期',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ description: 'emoji图标', example: '🏠' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '颜色', example: '#22C55E' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateFinancialGoalDto {
  @ApiPropertyOptional({ description: '目标名称', example: '攒首付' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '目标金额', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  targetAmount?: number;

  @ApiPropertyOptional({ description: '当前已存金额', example: 15000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @ApiPropertyOptional({
    description: '截止日期',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ description: 'emoji图标', example: '🏠' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '颜色', example: '#22C55E' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: '是否已完成', example: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
