import { Injectable, Logger } from '@nestjs/common';
import {
  AIAdapter,
  AIAdapterConfig,
  BILL_PARSE_PROMPT,
  parseAIResponse,
} from './base.adapter';
import { ParsedBillDto } from '../dto/parse-bill.dto';
import {
  ChatMessage,
  ChatResponse,
  ToolDefinition,
  AdapterStreamEvent,
} from '../types/chat.types';
import { openaiCompatibleChat, openaiCompatibleChatStream } from './openai-compatible.helper';

/**
 * DeepSeek AI 适配器
 */
@Injectable()
export class DeepSeekAdapter implements AIAdapter {
  private readonly logger = new Logger(DeepSeekAdapter.name);
  readonly provider = 'deepseek';

  async chat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    config: AIAdapterConfig,
  ): Promise<ChatResponse> {
    const baseUrl = config.apiBaseUrl || 'https://api.deepseek.com';
    const url = `${baseUrl}/chat/completions`;
    return openaiCompatibleChat(
      messages,
      tools,
      config,
      url,
      this.logger,
      'DeepSeek',
    );
  }

  async *chatStream(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    config: AIAdapterConfig,
  ): AsyncGenerator<AdapterStreamEvent, void, undefined> {
    const baseUrl = config.apiBaseUrl || 'https://api.deepseek.com';
    const url = `${baseUrl}/chat/completions`;
    yield* openaiCompatibleChatStream(
      messages,
      tools,
      config,
      url,
      this.logger,
      'DeepSeek',
    );
  }

  // ========== 旧接口（向后兼容） ==========

  async parseBills(
    content: string,
    type: 'image' | 'text',
    config: AIAdapterConfig,
  ): Promise<ParsedBillDto[]> {
    if (type === 'image') {
      throw new Error('DeepSeek 不支持图片识别');
    }

    const baseUrl = config.apiBaseUrl || 'https://api.deepseek.com';
    const url = `${baseUrl}/chat/completions`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `${BILL_PARSE_PROMPT}\n${content}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `DeepSeek API 错误: ${response.status} - ${errorText}`,
        );
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || '';

      this.logger.debug(`DeepSeek 返回: ${responseText}`);
      return parseAIResponse(responseText);
    } catch (error) {
      this.logger.error(`DeepSeek 解析账单失败: ${error.message}`);
      throw error;
    }
  }

  async testConnection(config: AIAdapterConfig): Promise<boolean> {
    const baseUrl = config.apiBaseUrl || 'https://api.deepseek.com';
    const url = `${baseUrl}/chat/completions`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      return response.ok;
    } catch (error) {
      this.logger.error(`DeepSeek 连接测试失败: ${error.message}`);
      return false;
    }
  }
}
