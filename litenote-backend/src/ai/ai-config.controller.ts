import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AIConfigService } from './ai-config.service';
import { AIService } from './ai.service';
import { CreateAIConfigDto, UpdateAIConfigDto } from './dto/ai-config.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ai/configs')
@ApiBearerAuth('JWT-auth')
@Controller('ai/configs')
export class AIConfigController {
  constructor(
    private readonly configService: AIConfigService,
    private readonly aiService: AIService,
  ) {}

  /**
   * 获取用户的 AI 模型配置列表
   */
  @ApiOperation({
    summary: '获取模型配置列表',
    description: '获取当前用户的所有 AI 模型配置',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    try {
      const configs = await this.configService.findAll(userId);
      return {
        success: true,
        message: '获取配置列表成功',
        data: configs,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message || '获取配置列表失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取单个配置详情
   */
  @ApiOperation({
    summary: '获取配置详情',
    description: '根据 ID 获取单个 AI 模型配置详情',
  })
  @ApiParam({ name: 'id', description: '配置ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const config = await this.configService.findOneDetail(userId, id);
      return {
        success: true,
        message: '获取配置详情成功',
        data: config,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message || '获取配置详情失败' },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 创建 AI 模型配置
   */
  @ApiOperation({
    summary: '创建模型配置',
    description: '创建一个新的 AI 模型配置',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAIConfigDto,
  ) {
    try {
      const config = await this.configService.create(userId, dto);
      return {
        success: true,
        message: '创建配置成功',
        data: config,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message || '创建配置失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 更新 AI 模型配置
   */
  @ApiOperation({
    summary: '更新模型配置',
    description: '根据 ID 更新 AI 模型配置',
  })
  @ApiParam({ name: 'id', description: '配置ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAIConfigDto,
  ) {
    try {
      const config = await this.configService.update(userId, id, dto);
      return {
        success: true,
        message: '更新配置成功',
        data: config,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message || '更新配置失败' },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 删除 AI 模型配置
   */
  @ApiOperation({
    summary: '删除模型配置',
    description: '根据 ID 删除 AI 模型配置',
  })
  @ApiParam({ name: 'id', description: '配置ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      await this.configService.remove(userId, id);
      return {
        success: true,
        message: '删除配置成功',
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message || '删除配置失败' },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 设置默认配置
   */
  @ApiOperation({
    summary: '设置默认配置',
    description: '将指定配置设置为默认',
  })
  @ApiParam({ name: 'id', description: '配置ID' })
  @ApiResponse({ status: 200, description: '设置成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  @Post(':id/set-default')
  async setDefault(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const config = await this.configService.setDefault(userId, id);
      return {
        success: true,
        message: '设置默认配置成功',
        data: config,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message || '设置默认配置失败' },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 测试连接
   */
  @ApiOperation({
    summary: '测试连接',
    description: '测试 AI 模型配置是否可用',
  })
  @ApiParam({ name: 'id', description: '配置ID' })
  @ApiResponse({ status: 200, description: '测试完成' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  @Post(':id/test')
  async testConnection(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const result = await this.aiService.testConnection(userId, id);
      return {
        success: true,
        message: '测试完成',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message || '测试连接失败' },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
