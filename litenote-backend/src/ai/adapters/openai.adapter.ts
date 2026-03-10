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
 * OpenAI API 适配器
 */
@Injectable()
export class OpenAIAdapter implements AIAdapter {
  private readonly logger = new Logger(OpenAIAdapter.name);
  readonly provider = 'openai';

  async chat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    config: AIAdapterConfig,
  ): Promise<ChatResponse> {
    const baseUrl = config.apiBaseUrl || 'https://api.openai.com';
    const url = `${baseUrl}/v1/chat/completions`;
    return openaiCompatibleChat(
      messages,
      tools,
      config,
      url,
      this.logger,
      'OpenAI',
    );
  }

  async *chatStream(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    config: AIAdapterConfig,
  ): AsyncGenerator<AdapterStreamEvent, void, undefined> {
    const baseUrl = config.apiBaseUrl || 'https://api.openai.com';
    const url = `${baseUrl}/v1/chat/completions`;
    yield* openaiCompatibleChatStream(
      messages,
      tools,
      config,
      url,
      this.logger,
      'OpenAI',
    );
  }

  // ========== 旧接口（向后兼容） ==========

  async parseBills(
    content: string,
    type: 'image' | 'text',
    config: AIAdapterConfig,
  ): Promise<ParsedBillDto[]> {
    const baseUrl = config.apiBaseUrl || 'https://api.openai.com';
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
        this.logger.error(
          `OpenAI API 错误: ${response.status} - ${errorText}`,
        );
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || '';

      this.logger.debug(`OpenAI 返回: ${responseText}`);
      return parseAIResponse(responseText);
    } catch (error) {
      this.logger.error(`OpenAI 解析账单失败: ${error.message}`);
      throw error;
    }
  }

  async testConnection(config: AIAdapterConfig): Promise<boolean> {
    const baseUrl = config.apiBaseUrl || 'https://api.openai.com';
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
      this.logger.error(`OpenAI 连接测试失败: ${error.message}`);
      return false;
    }
  }
}
