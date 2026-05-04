import { Injectable, BadRequestException } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

/**
 * AI 配置接口（与数据库 ai_model_configs 字段对应）
 */
export interface AIModelConfig {
  provider: string;
  apiKey: string;
  apiBaseUrl?: string | null;
  model: string;
}

/**
 * AI Provider 工厂
 * 根据用户的 AI 配置动态创建 Vercel AI SDK provider model 实例
 */
@Injectable()
export class AIProviderFactory {
  /**
   * 根据配置创建对应的 AI model 实例
   * 每次请求动态创建（因为 apiKey/baseURL 是用户级别的）
   */
  createModel(config: AIModelConfig) {
    switch (config.provider) {
      case 'claude': {
        const anthropic = createAnthropic({
          apiKey: config.apiKey,
          baseURL: config.apiBaseUrl || undefined,
        });
        return anthropic(config.model);
      }

      case 'openai': {
        const openai = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.apiBaseUrl
            ? `${config.apiBaseUrl}/v1`
            : undefined,
        });
        // 使用 .chat() 强制走 Chat Completions API（兼容性更好）
        return openai.chat(config.model);
      }

      case 'deepseek': {
        const deepseek = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.apiBaseUrl || 'https://api.deepseek.com',
        });
        // DeepSeek 不支持 Responses API，必须用 .chat()
        return deepseek.chat(config.model);
      }

      case 'qwen': {
        const qwen = createOpenAI({
          apiKey: config.apiKey,
          baseURL:
            config.apiBaseUrl ||
            'https://dashscope.aliyuncs.com/compatible-mode/v1',
        });
        // Qwen 不支持 Responses API，必须用 .chat()
        return qwen.chat(config.model);
      }

      default:
        throw new BadRequestException(
          `不支持的 AI 服务商: ${config.provider}`,
        );
    }
  }
}
