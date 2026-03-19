import {
  Controller,
  Get,
  Post,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';
import { HotUpdateService } from './hot-update.service';
import { UploadHotUpdateDto } from './dto/hot-update.dto';
import { join } from 'path';
import { existsSync, mkdirSync, renameSync, statSync } from 'fs';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';

// Bundle 存储目录
const BUNDLE_DIR = join(process.cwd(), 'public', 'downloads', 'bundles');

// 确保目录存在
if (!existsSync(BUNDLE_DIR)) {
  mkdirSync(BUNDLE_DIR, { recursive: true });
}

@ApiTags('hot-update')
@Public()
@Controller('hot-update')
export class HotUpdateController {
  constructor(private readonly hotUpdateService: HotUpdateService) {}

  /**
   * 检查热更新
   */
  @ApiOperation({ summary: '检查热更新' })
  @ApiQuery({ name: 'nativeVersion', description: '原生版本号', example: '0.0.29' })
  @ApiQuery({ name: 'bundleVersion', description: '当前 bundle 版本', example: '0' })
  @ApiQuery({ name: 'platform', description: '平台', required: false })
  @ApiResponse({ status: 200, description: '检查成功' })
  @Get('check')
  async checkUpdate(
    @Query('nativeVersion') nativeVersion: string,
    @Query('bundleVersion') bundleVersion: string,
    @Query('platform') platform?: string,
  ) {
    try {
      const result = await this.hotUpdateService.checkUpdate(
        nativeVersion,
        parseInt(bundleVersion, 10) || 0,
        platform || 'android',
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: true, data: { hasUpdate: false } };
    }
  }

  /**
   * 上传 bundle zip
   */
  @ApiOperation({ summary: '上传热更新 bundle' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        bundleVersion: { type: 'number', example: 1 },
        targetVersion: { type: 'string', example: '0.0.29' },
        minNativeCode: { type: 'number', example: 29 },
        maxNativeCode: { type: 'number' },
        bundleType: { type: 'string', default: 'business' },
        fileHash: { type: 'string' },
        updateLog: { type: 'string' },
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
        destination: BUNDLE_DIR,
        filename: (req, file, cb) => {
          cb(null, `bundle-temp-${Date.now()}.zip`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.endsWith('.zip')) {
          cb(new Error('只允许上传 ZIP 文件'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadHotUpdateDto,
    @Req() req: Request,
  ) {
    try {
      if (!file) {
        throw new Error('请上传 bundle ZIP 文件');
      }

      const bundleType = dto.bundleType || 'business';
      const newFilename = `${bundleType}-v${dto.bundleVersion}.zip`;
      const newPath = join(BUNDLE_DIR, newFilename);
      renameSync(file.path, newPath);

      const fileSize = statSync(newPath).size;

      // 构建下载 URL
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = process.env.API_BASE_URL || `${protocol}://${host}`;
      const downloadUrl = `${baseUrl}/downloads/bundles/${newFilename}`;

      // 创建记录
      const record = await this.hotUpdateService.create(dto, downloadUrl, fileSize);

      return {
        success: true,
        message: '热更新版本创建成功',
        data: record,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取所有热更新版本
   */
  @ApiOperation({ summary: '获取所有热更新版本' })
  @Get('list')
  async findAll(@Query('platform') platform?: string) {
    const result = await this.hotUpdateService.findAll(platform);
    return { success: true, data: result };
  }

  /**
   * 停用版本（回滚）
   */
  @ApiOperation({ summary: '停用热更新版本' })
  @Patch(':id/deactivate')
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.hotUpdateService.deactivate(id);
      return { success: true, message: '已停用', data: result };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 删除版本
   */
  @ApiOperation({ summary: '删除热更新版本' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.hotUpdateService.remove(id);
      return { success: true, message: '删除成功' };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
