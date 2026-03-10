import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export class CreateCategoryDto {
  @ApiProperty({
    description: '分类名称',
    example: '餐饮',
    minLength: 1,
    maxLength: 50,
  })
  @IsString({ message: '分类名称必须是字符串' })
  @MinLength(1, { message: '分类名称不能为空' })
  @MaxLength(50, { message: '分类名称不能超过50个字符' })
  name: string;

  @ApiProperty({
    description: '分类类型',
    example: 'expense',
    enum: CategoryType,
  })
  @IsEnum(CategoryType, { message: '类型必须是income或expense' })
  type: CategoryType;

  @ApiProperty({
    description: '分类图标',
    example: '🍽️',
    required: false,
    maxLength: 10,
  })
  @IsOptional()
  @IsString({ message: '图标必须是字符串' })
  @MaxLength(10, { message: '图标不能超过10个字符' })
  icon?: string;

  @ApiProperty({
    description: '分类颜色',
    example: '#FF5722',
    required: false,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: '颜色必须是字符串' })
  @MaxLength(20, { message: '颜色值不能超过20个字符' })
  color?: string;

  @ApiProperty({
    description: '排序序号',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '排序必须是数字' })
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @ApiProperty({
    description: '分类名称',
    example: '餐饮',
    required: false,
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: '分类名称必须是字符串' })
  @MinLength(1, { message: '分类名称不能为空' })
  @MaxLength(50, { message: '分类名称不能超过50个字符' })
  name?: string;

  @ApiProperty({
    description: '分类类型',
    example: 'expense',
    enum: CategoryType,
    required: false,
  })
  @IsOptional()
  @IsEnum(CategoryType, { message: '类型必须是income或expense' })
  type?: CategoryType;

  @ApiProperty({
    description: '分类图标',
    example: '🍽️',
    required: false,
    maxLength: 10,
  })
  @IsOptional()
  @IsString({ message: '图标必须是字符串' })
  @MaxLength(10, { message: '图标不能超过10个字符' })
  icon?: string;

  @ApiProperty({
    description: '分类颜色',
    example: '#FF5722',
    required: false,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: '颜色必须是字符串' })
  @MaxLength(20, { message: '颜色值不能超过20个字符' })
  color?: string;

  @ApiProperty({
    description: '排序序号',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '排序必须是数字' })
  sortOrder?: number;
}
