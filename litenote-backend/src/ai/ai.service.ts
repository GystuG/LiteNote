import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { generateText } from 'ai';
import { AIConfigService } from './ai-config.service';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { ParseBillDto, ParsedBillDto } from './dto/parse-bill.dto';
import { BILL_PARSE_PROMPT, parseAIResponse } from './utils/bill-parser';

/**
 * AI 服务 - 处理账单解析等 AI 功能
 * 使用 Vercel AI SDK 替代手写 adapter 层
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly configService: AIConfigService,
    private readonly providerFactory: AIProviderFactory,
  ) {}

  /**
   * 解析账单
   */
  async parseBills(
    userId: string,
    dto: ParseBillDto,
  ): Promise<ParsedBillDto[]> {
    // 获取模型配置
    let config;
    if (dto.configId) {
      config = await this.configService.getFullConfig(userId, dto.configId);
    } else {
      config = await this.configService.findDefault(userId);
      if (!config) {
        throw new BadRequestException('请先配置 AI 模型');
      }
    }

    // 检查是否支持图片
    if (dto.type === 'image' && !config.supportsVision) {
      throw new BadRequestException('当前模型不支持图片识别');
    }

    try {
      this.logger.log(
        `开始解析账单 - 用户: ${userId}, 模型: ${config.model}, 类型: ${dto.type}`,
      );

      const model = this.providerFactory.createModel(config);

      // 构建消息内容
      const userContent =
        dto.type === 'image'
          ? [
              { type: 'text' as const, text: BILL_PARSE_PROMPT },
              {
                type: 'image' as const,
                image: dto.content.startsWith('data:')
                  ? dto.content
                  : `data:image/jpeg;base64,${dto.content}`,
              },
            ]
          : `${BILL_PARSE_PROMPT}\n${dto.content}`;

      const result = await generateText({
        model,
        messages: [{ role: 'user', content: userContent }],
        maxOutputTokens: 1024,
      });

      const bills = parseAIResponse(result.text);

      this.logger.log(`解析完成 - 识别到 ${bills.length} 条账单`);
      return bills;
    } catch (error: any) {
      this.logger.error(`解析账单失败: ${error.message}`);
      throw new BadRequestException(`账单解析失败: ${error.message}`);
    }
  }

  /**
   * 测试模型连接
   */
  async testConnection(
    userId: string,
    configId: number,
  ): Promise<{ success: boolean; message: string }> {
    const config = await this.configService.getFullConfig(userId, configId);

    try {
      const model = this.providerFactory.createModel(config);

      await generateText({
        model,
        prompt: 'Hello',
        maxOutputTokens: 10,
      });

      return { success: true, message: '连接成功' };
    } catch (error: any) {
      return {
        success: false,
        message: `连接测试失败: ${error.message}`,
      };
    }
  }
}
