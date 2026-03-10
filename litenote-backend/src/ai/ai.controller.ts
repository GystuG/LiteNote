import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AIService } from './ai.service';
import { ParseBillDto } from './dto/parse-bill.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ai')
@ApiBearerAuth('JWT-auth')
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /**
   * 解析账单
   */
  @ApiOperation({
    summary: '解析账单',
    description: '使用 AI 从图片或文本中解析账单信息',
  })
  @ApiResponse({ status: 200, description: '解析成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Post('parse-bills')
  async parseBills(
    @CurrentUser('id') userId: string,
    @Body() dto: ParseBillDto,
  ) {
    try {
      const bills = await this.aiService.parseBills(userId, dto);
      return {
        success: true,
        message: '解析成功',
        data: { bills },
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message || '解析账单失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
