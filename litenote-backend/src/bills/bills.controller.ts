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
import { BillsService } from './bills.service';
import { CreateBillDto, UpdateBillDto, BillQueryDto } from './dto/bill.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('bills')
@ApiBearerAuth('JWT-auth')
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  /**
   * 创建账单
   * POST /bills
   */
  @ApiOperation({
    summary: '创建账单',
    description: '创建一个新的收入或支出账单',
  })
  @ApiResponse({ status: 201, description: '账单创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createBillDto: CreateBillDto,
  ) {
    try {
      // 创建包含userId的完整DTO
      const billData = { ...createBillDto, userId };
      const result = await this.billsService.create(userId, billData);

      return {
        success: true,
        message: '账单创建成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '创建账单失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取账单列表
   * GET /bills
   */
  @ApiOperation({
    summary: '获取账单列表',
    description: '分页获取用户的账单列表，支持筛选和排序',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: BillQueryDto,
  ) {
    try {
      const result = await this.billsService.findAll(userId, query);

      return {
        success: true,
        message: '获取账单列表成功',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取账单列表失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取账单统计信息
   * GET /bills/statistics
   */
  @ApiOperation({
    summary: '获取账单统计',
    description: '获取用户的收支统计信息',
  })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
  @ApiQuery({ name: 'granularity', required: false, enum: ['daily', 'monthly'], description: '数据粒度：daily 返回每日趋势，monthly 返回每月趋势。未传则自动判断（≤90天返回daily，>90天返回monthly）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Get('statistics')
  async getStatistics(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: 'daily' | 'monthly',
  ) {
    const logger = new (require('@nestjs/common').Logger)('BillsController');
    logger.log(`[getStatistics] 收到请求 - startDate: ${startDate}, endDate: ${endDate}, granularity: ${granularity}`);

    try {
      const result = await this.billsService.getStatistics(
        userId,
        startDate,
        endDate,
        granularity,
      );

      logger.log(`[getStatistics] 请求成功`);
      return {
        success: true,
        message: '获取统计信息成功',
        data: result,
      };
    } catch (error) {
      logger.error(`[getStatistics] 请求失败 - ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取统计信息失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取单个账单详情
   * GET /bills/:id
   */
  @ApiOperation({
    summary: '获取账单详情',
    description: '根据ID获取单个账单的详细信息',
  })
  @ApiParam({ name: 'id', description: '账单ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '账单不存在' })
  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const result = await this.billsService.findOne(userId, id);

      return {
        success: true,
        message: '获取账单详情成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '获取账单详情失败',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * 更新账单
   * PATCH /bills/:id
   */
  @ApiOperation({ summary: '更新账单', description: '根据ID更新账单信息' })
  @ApiParam({ name: 'id', description: '账单ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '账单不存在' })
  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBillDto: UpdateBillDto,
  ) {
    try {
      const result = await this.billsService.update(userId, id, updateBillDto);

      return {
        success: true,
        message: '账单更新成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '更新账单失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 删除账单
   * DELETE /bills/:id
   */
  @ApiOperation({ summary: '删除账单', description: '根据ID删除账单' })
  @ApiParam({ name: 'id', description: '账单ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '账单不存在' })
  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      await this.billsService.remove(userId, id);

      return {
        success: true,
        message: '账单删除成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '删除账单失败',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
