import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UploadHotUpdateDto {
  @ApiProperty({ description: 'Bundle 版本号（整数递增）', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bundleVersion: number;

  @ApiProperty({
    description: '目标原生版本号',
    example: '0.0.29',
  })
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: '版本号格式必须为 x.y.z' })
  targetVersion: string;

  @ApiProperty({
    description: '最低兼容原生版本码',
    example: 29,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minNativeCode: number;

  @ApiPropertyOptional({
    description: '最高兼容原生版本码',
    example: 99,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  maxNativeCode?: number;

  @ApiPropertyOptional({
    description: 'Bundle 类型: full | business',
    default: 'business',
  })
  @IsString()
  @IsOptional()
  bundleType?: string;

  @ApiProperty({ description: '文件 SHA256 哈希', example: 'abc123...' })
  @IsString()
  fileHash: string;

  @ApiProperty({ description: '更新日志', example: '修复首页显示问题' })
  @IsString()
  updateLog: string;

  @ApiPropertyOptional({ description: '是否强制更新', default: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  forceUpdate?: boolean;

  @ApiPropertyOptional({ description: '平台', default: 'android' })
  @IsString()
  @IsOptional()
  platform?: string;
}

export class CheckHotUpdateDto {
  @ApiProperty({ description: '原生版本号', example: '0.0.29' })
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: '版本号格式必须为 x.y.z' })
  nativeVersion: string;

  @ApiProperty({ description: '当前 bundle 版本号', example: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bundleVersion: number;

  @ApiPropertyOptional({ description: '平台', default: 'android' })
  @IsString()
  @IsOptional()
  platform?: string;
}
