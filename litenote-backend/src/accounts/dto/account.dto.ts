import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsIn,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ description: '账户名称', example: '招商银行储蓄卡' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '账户类型',
    enum: ['bank_card', 'e_wallet', 'credit_card', 'cash'],
    example: 'bank_card',
  })
  @IsString()
  @IsIn(['bank_card', 'e_wallet', 'credit_card', 'cash'])
  type: string;

  @ApiPropertyOptional({ description: '初始余额', example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;

  @ApiPropertyOptional({ description: '账户图标', example: '💳' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '账户颜色', example: '#0052FF' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: '是否为默认账户', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ description: '账户名称', example: '招商银行储蓄卡' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '账户类型',
    enum: ['bank_card', 'e_wallet', 'credit_card', 'cash'],
    example: 'bank_card',
  })
  @IsOptional()
  @IsString()
  @IsIn(['bank_card', 'e_wallet', 'credit_card', 'cash'])
  type?: string;

  @ApiPropertyOptional({ description: '账户余额', example: 10000 })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiPropertyOptional({ description: '账户图标', example: '💳' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '账户颜色', example: '#0052FF' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: '是否为默认账户', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: '排序序号', example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
