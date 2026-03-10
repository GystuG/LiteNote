import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('budgets')
@ApiBearerAuth('JWT-auth')
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: '创建预算' })
  @ApiResponse({ status: 201, description: '预算创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createBudgetDto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(userId, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有预算' })
  @ApiResponse({ status: 200, description: '返回预算列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  findAll(@CurrentUser('id') userId: string) {
    return this.budgetsService.findAll(userId);
  }

  @Get('progress')
  @ApiOperation({ summary: '获取预算执行进度' })
  @ApiResponse({ status: 200, description: '返回预算进度列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  getProgress(@CurrentUser('id') userId: string) {
    return this.budgetsService.getBudgetProgress(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个预算' })
  @ApiResponse({ status: 200, description: '返回预算详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.budgetsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新预算' })
  @ApiResponse({ status: 200, description: '预算更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, userId, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除预算' })
  @ApiResponse({ status: 200, description: '预算删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.budgetsService.remove(id, userId);
  }
}
