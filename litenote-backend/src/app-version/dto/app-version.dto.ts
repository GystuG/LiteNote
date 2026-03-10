import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAppVersionDto {
  @ApiProperty({ description: '版本号', example: '1.2.3' })
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: '版本号格式必须为 x.y.z' })
  version: string;

  @ApiProperty({ description: '更新日志', example: '修复 bug 和性能优化' })
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

export class CheckUpdateDto {
  @ApiProperty({ description: '当前版本号', example: '1.2.3' })
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: '版本号格式必须为 x.y.z' })
  currentVersion: string;

  @ApiPropertyOptional({ description: '平台', default: 'android' })
  @IsString()
  @IsOptional()
  platform?: string;
}

export class AppVersionResponseDto {
  @ApiProperty({ description: '版本ID' })
  id: number;

  @ApiProperty({ description: '版本号' })
  version: string;

  @ApiProperty({ description: 'Android versionCode' })
  versionCode: number;

  @ApiProperty({ description: '下载链接' })
  downloadUrl: string;

  @ApiProperty({ description: '更新日志' })
  updateLog: string;

  @ApiProperty({ description: '是否强制更新' })
  forceUpdate: boolean;

  @ApiProperty({ description: '平台' })
  platform: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}

export class CheckUpdateResponseDto {
  @ApiProperty({ description: '是否有新版本' })
  hasUpdate: boolean;

  @ApiPropertyOptional({ description: '最新版本信息' })
  latestVersion?: AppVersionResponseDto;
}
