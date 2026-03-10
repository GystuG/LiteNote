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
 * 通义千问 AI 适配器
 */
@Injectable()
export class QwenAdapter implements AIAdapter {
  private readonly logger = new Logger(QwenAdapter.name);
  readonly provider = 'qwen';

  async chat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    config: AIAdapterConfig,
  ): Promise<ChatResponse> {
    const baseUrl =
      config.apiBaseUrl || 'https://dashscope.aliyuncs.com/compatible-mode';
    const url = `${baseUrl}/v1/chat/completions`;
    return openaiCompatibleChat(
      messages,
      tools,
      config,
      url,
      this.logger,
      '通义千问',
    );
  }

  async *chatStream(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    config: AIAdapterConfig,
  ): AsyncGenerator<AdapterStreamEvent, void, undefined> {
    const baseUrl =
      config.apiBaseUrl || 'https://dashscope.aliyuncs.com/compatible-mode';
    const url = `${baseUrl}/v1/chat/completions`;
    yield* openaiCompatibleChatStream(
      messages,
      tools,
      config,
      url,
      this.logger,
      '通义千问',
    );
  }

  // ========== 旧接口（向后兼容） ==========

  async parseBills(
    content: string,
    type: 'image' | 'text',
    config: AIAdapterConfig,
  ): Promise<ParsedBillDto[]> {
    const baseUrl =
      config.apiBaseUrl || 'https://dashscope.aliyuncs.com/compatible-mode';
    const url = `${baseUrl}/v1/chat/completions`;

    const messageContent: any[] = [];

    if (type === 'image') {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: content.startsWith('data:')
            ? content
            : `data:image/jpeg;base64,${content}`,
        },
      });
      messageContent.push({
        type: 'text',
        text: BILL_PARSE_PROMPT,
      });
    } else {
      messageContent.push({
        type: 'text',
        text: `${BILL_PARSE_PROMPT}\n${content}`,
      });
    }

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
              content: messageContent,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`通义千问 API 错误: ${response.status} - ${errorText}`);
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || '';

      this.logger.debug(`通义千问 返回: ${responseText}`);
      return parseAIResponse(responseText);
    } catch (error) {
      this.logger.error(`通义千问 解析账单失败: ${error.message}`);
      throw error;
    }
  }

  async testConnection(config: AIAdapterConfig): Promise<boolean> {
    const baseUrl =
      config.apiBaseUrl || 'https://dashscope.aliyuncs.com/compatible-mode';
    const url = `${baseUrl}/v1/chat/completions`;

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
      this.logger.error(`通义千问 连接测试失败: ${error.message}`);
      return false;
    }
  }
}
