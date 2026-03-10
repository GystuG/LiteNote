import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AppVersionService } from './app-version.service';
import { CreateAppVersionDto } from './dto/app-version.dto';
import { join } from 'path';
import { existsSync, mkdirSync, renameSync } from 'fs';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';

// APK 存储目录
const UPLOAD_DIR = join(process.cwd(), 'public', 'downloads');

// 确保目录存在
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('app-version')
@Public()
@Controller('app-version')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  /**
   * 检查更新
   * GET /app-version/check?currentVersion=1.0.0&platform=android
   */
  @ApiOperation({ summary: '检查更新', description: '检查是否有新版本可用' })
  @ApiResponse({ status: 200, description: '检查成功' })
  @Get('check')
  async checkUpdate(
    @Query('currentVersion') currentVersion: string,
    @Query('platform') platform?: string,
  ) {
    try {
      const result = await this.appVersionService.checkUpdate(
        currentVersion,
        platform || 'android',
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: true, data: { hasUpdate: false } };
    }
  }

  /**
   * 获取最新版本
   * GET /app-version/latest
   */
  @ApiOperation({ summary: '获取最新版本' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get('latest')
  async getLatest(@Query('platform') platform?: string) {
    try {
      const result = await this.appVersionService.getLatest(platform);
      return { success: true, data: result };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * 上传 APK 并创建版本
   * POST /app-version/upload
   */
  @ApiOperation({ summary: '上传 APK 并创建版本' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        version: { type: 'string', example: '1.2.3' },
        updateLog: { type: 'string', example: '修复 bug' },
        forceUpdate: { type: 'boolean' },
        platform: { type: 'string', default: 'android' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => {
          // 先用临时文件名，后面再重命名
          cb(null, `app-temp-${Date.now()}.apk`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.endsWith('.apk')) {
          cb(new Error('只允许上传 APK 文件'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAppVersionDto,
    @Req() req: Request,
  ) {
    try {
      if (!file) {
        throw new Error('请上传 APK 文件');
      }

      // 重命名文件为正确的版本号
      const newFilename = `app-v${dto.version}.apk`;
      const newPath = join(UPLOAD_DIR, newFilename);
      renameSync(file.path, newPath);

      // 从请求中获取实际的 host
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = process.env.API_BASE_URL || `${protocol}://${host}`;
      const downloadUrl = `${baseUrl}/downloads/${newFilename}`;

      const result = await this.appVersionService.create(dto, downloadUrl);

      return {
        success: true,
        message: '版本创建成功',
        data: result,
        downloadUrl,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取所有版本
   * GET /app-version
   */
  @ApiOperation({ summary: '获取所有版本' })
  @Get()
  async findAll(@Query('platform') platform?: string) {
    const result = await this.appVersionService.findAll(platform);
    return { success: true, data: result };
  }

  /**
   * 删除版本
   * DELETE /app-version/:id
   */
  @ApiOperation({ summary: '删除版本' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.appVersionService.remove(id);
      return { success: true, message: '删除成功' };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
