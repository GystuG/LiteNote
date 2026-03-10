import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FinancialGoalsService } from './financial-goals.service';
import {
  CreateFinancialGoalDto,
  UpdateFinancialGoalDto,
} from './dto/financial-goal.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('financial-goals')
@ApiBearerAuth('JWT-auth')
@Controller('financial-goals')
export class FinancialGoalsController {
  private readonly logger = new Logger(FinancialGoalsController.name);

  constructor(
    private readonly financialGoalsService: FinancialGoalsService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建财务目标' })
  @ApiResponse({ status: 201, description: '财务目标创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFinancialGoalDto,
  ) {
    this.logger.log(`POST /financial-goals userId=${userId} body=${JSON.stringify(dto)}`);
    const result = await this.financialGoalsService.create(userId, dto);
    this.logger.log(`POST /financial-goals result=${JSON.stringify(result)}`);
    return result;
  }

  @Get()
  @ApiOperation({ summary: '获取所有财务目标' })
  @ApiResponse({ status: 200, description: '返回财务目标列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  findAll(@CurrentUser('id') userId: string) {
    this.logger.log(`GET /financial-goals userId=${userId}`);
    return this.financialGoalsService.findAll(userId);
  }

  @Get('progress')
  @ApiOperation({ summary: '获取财务目标进度' })
  @ApiResponse({ status: 200, description: '返回带进度百分比的目标列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  getProgress(@CurrentUser('id') userId: string) {
    this.logger.log(`GET /financial-goals/progress userId=${userId}`);
    return this.financialGoalsService.getProgress(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个财务目标' })
  @ApiResponse({ status: 200, description: '返回财务目标详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financialGoalsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新财务目标' })
  @ApiResponse({ status: 200, description: '财务目标更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinancialGoalDto,
  ) {
    return this.financialGoalsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除财务目标' })
  @ApiResponse({ status: 200, description: '财务目标删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financialGoalsService.remove(id, userId);
  }
}
