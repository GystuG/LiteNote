import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * 创建分类
   * POST /categories
   */
  @ApiOperation({
    summary: '创建分类',
    description: '创建一个新的收入或支出分类',
  })
  @ApiResponse({ status: 201, description: '分类创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    try {
      const result = await this.categoriesService.create(
        userId,
        createCategoryDto,
      );

      return {
        success: true,
        message: '分类创建成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '创建分类失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取分类列表
   * GET /categories
   */
  @ApiOperation({
    summary: '获取分类列表',
    description: '获取用户的分类列表，可按类型筛选',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '分类类型：income或expense',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
  ) {
    try {
      const result = await this.categoriesService.findAll(userId, type);

      return {
        success: true,
        message: '获取分类列表成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取分类列表失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 初始化系统默认分类
   * POST /categories/init-defaults
   */
  @Public()
  @ApiOperation({
    summary: '初始化默认分类',
    description: '初始化系统预设的默认分类',
  })
  @ApiResponse({ status: 201, description: '初始化成功' })
  @ApiResponse({ status: 400, description: '初始化失败' })
  @Post('init-defaults')
  async initDefaults() {
    try {
      await this.categoriesService.initDefaultCategories();

      return {
        success: true,
        message: '系统默认分类初始化成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '初始化默认分类失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取单个分类详情
   * GET /categories/:id
   */
  @ApiOperation({
    summary: '获取分类详情',
    description: '根据ID获取单个分类的详细信息',
  })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const result = await this.categoriesService.findOne(userId, id);

      return {
        success: true,
        message: '获取分类详情成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取分类详情失败',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * 更新分类
   * PATCH /categories/:id
   */
  @ApiOperation({ summary: '更新分类', description: '根据ID更新分类信息' })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    try {
      const result = await this.categoriesService.update(
        userId,
        id,
        updateCategoryDto,
      );

      return {
        success: true,
        message: '分类更新成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '更新分类失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 删除分类
   * DELETE /categories/:id
   */
  @ApiOperation({ summary: '删除分类', description: '根据ID删除分类' })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      await this.categoriesService.remove(userId, id);

      return {
        success: true,
        message: '分类删除成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '删除分类失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
