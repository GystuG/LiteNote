import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AsrService } from './services/asr.service';
import { AsrRequestDto } from './dto/asr.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ai-asr')
@ApiBearerAuth('JWT-auth')
@Controller('ai/asr')
export class AsrController {
  constructor(private readonly asrService: AsrService) {}

  @ApiOperation({
    summary: '语音转文字',
    description: '将 Base64 编码的音频数据转写为文本',
  })
  @ApiResponse({ status: 200, description: '转写成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 500, description: '转写失败' })
  @Post('transcribe')
  async transcribe(
    @CurrentUser('id') userId: string,
    @Body() dto: AsrRequestDto,
  ) {
    try {
      const text = await this.asrService.transcribe(
        dto.audioBase64,
        dto.mimeType || 'audio/aac',
      );

      return {
        success: true,
        data: { text },
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '语音识别失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
