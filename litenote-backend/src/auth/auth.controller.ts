import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

// 确保上传目录存在
const uploadDir = './uploads/avatars';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Multer 配置
const avatarStorage = diskStorage({
  destination: uploadDir,
  filename: (req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return callback(
      new BadRequestException('只支持 jpg、jpeg、png、gif、webp 格式的图片'),
      false,
    );
  }
  callback(null, true);
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册
   * POST /auth/register
   */
  @Public()
  @Post('register')
  @ApiOperation({
    summary: '用户注册',
    description: '创建新用户账号',
  })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);

    return {
      success: true,
      message: '注册成功',
      data: result,
    };
  }

  /**
   * 用户登录
   * POST /auth/login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登录',
    description: '使用用户名和密码登录',
  })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);

    return {
      success: true,
      message: '登录成功',
      data: result,
    };
  }

  /**
   * 获取当前用户信息
   * GET /auth/profile
   */
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取用户信息',
    description: '获取当前登录用户的详细信息',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@CurrentUser('id') userId: string) {
    const user = await this.authService.getProfile(userId);

    return {
      success: true,
      message: '获取用户信息成功',
      data: user,
    };
  }

  /**
   * 更新用户资料
   * PATCH /auth/profile
   */
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '更新用户资料',
    description: '更新当前用户的昵称、用户名、邮箱或头像',
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.authService.updateProfile(userId, dto);

    return {
      success: true,
      message: '资料更新成功',
      data: user,
    };
  }

  /**
   * 修改密码
   * PATCH /auth/password
   */
  @Patch('password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '修改密码',
    description: '修改当前用户的密码',
  })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 400, description: '当前密码错误或参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, dto);

    return {
      success: true,
      message: '密码修改成功',
    };
  }

  /**
   * 上传头像
   * POST /auth/avatar
   */
  @Post('avatar')
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarStorage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 最大 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '上传头像',
    description: '上传用户头像图片，支持 jpg、png、gif、webp 格式，最大 5MB',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: '头像图片文件',
        },
      },
      required: ['avatar'],
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  @ApiResponse({ status: 400, description: '文件格式不支持或文件过大' })
  @ApiResponse({ status: 401, description: '未授权' })
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }

    // 构建头像 URL
    const avatarUrl = `/uploads/avatars/${file.filename}`;

    // 更新用户头像
    const user = await this.authService.updateProfile(userId, {
      avatar: avatarUrl,
    });

    return {
      success: true,
      message: '头像上传成功',
      data: {
        avatar: avatarUrl,
        user,
      },
    };
  }
}
