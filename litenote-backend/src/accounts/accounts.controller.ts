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
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: '创建账户' })
  @ApiResponse({ status: 201, description: '账户创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return this.accountsService.create(userId, createAccountDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有账户' })
  @ApiResponse({ status: 200, description: '返回账户列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  findAll(@CurrentUser('id') userId: string) {
    return this.accountsService.findAll(userId);
  }

  @Get('balance')
  @ApiOperation({ summary: '获取总资产统计' })
  @ApiResponse({ status: 200, description: '返回资产统计' })
  @ApiResponse({ status: 401, description: '未授权' })
  getTotalBalance(@CurrentUser('id') userId: string) {
    return this.accountsService.getTotalBalance(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个账户' })
  @ApiResponse({ status: 200, description: '返回账户详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.accountsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新账户' })
  @ApiResponse({ status: 200, description: '账户更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, userId, updateAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除账户' })
  @ApiResponse({ status: 200, description: '账户删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.accountsService.remove(id, userId);
  }
}
