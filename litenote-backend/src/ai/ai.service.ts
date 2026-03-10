import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AIConfigService } from './ai-config.service';
import { ParseBillDto, ParsedBillDto } from './dto/parse-bill.dto';
import {
  AIAdapter,
  ClaudeAdapter,
  OpenAIAdapter,
  DeepSeekAdapter,
  QwenAdapter,
} from './adapters';

/**
 * AI 服务 - 处理账单解析等 AI 功能
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly adapters: Map<string, AIAdapter>;

  constructor(
    private readonly configService: AIConfigService,
    private readonly claudeAdapter: ClaudeAdapter,
    private readonly openaiAdapter: OpenAIAdapter,
    private readonly deepseekAdapter: DeepSeekAdapter,
    private readonly qwenAdapter: QwenAdapter,
  ) {
    // 注册适配器
    this.adapters = new Map<string, AIAdapter>([
      ['claude', this.claudeAdapter],
      ['openai', this.openaiAdapter],
      ['deepseek', this.deepseekAdapter],
      ['qwen', this.qwenAdapter],
    ]);
  }

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

    // 获取适配器
    const adapter = this.adapters.get(config.provider);
    if (!adapter) {
      throw new BadRequestException(`不支持的 AI 服务商: ${config.provider}`);
    }

    try {
      this.logger.log(
        `开始解析账单 - 用户: ${userId}, 模型: ${config.model}, 类型: ${dto.type}`,
      );

      const bills = await adapter.parseBills(dto.content, dto.type, {
        apiKey: config.apiKey,
        apiBaseUrl: config.apiBaseUrl,
        model: config.model,
      });

      this.logger.log(`解析完成 - 识别到 ${bills.length} 条账单`);
      return bills;
    } catch (error) {
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

    const adapter = this.adapters.get(config.provider);
    if (!adapter) {
      return { success: false, message: `不支持的 AI 服务商: ${config.provider}` };
    }

    try {
      const success = await adapter.testConnection({
        apiKey: config.apiKey,
        apiBaseUrl: config.apiBaseUrl,
        model: config.model,
      });

      return {
        success,
        message: success ? '连接成功' : '连接失败，请检查 API Key 和模型名称',
      };
    } catch (error) {
      return { success: false, message: `连接测试失败: ${error.message}` };
    }
  }
}
