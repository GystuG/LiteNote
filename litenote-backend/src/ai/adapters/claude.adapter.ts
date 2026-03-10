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
  ToolCall,
  ToolDefinition,
  ContentBlock,
  AdapterStreamEvent,
} from '../types/chat.types';
import { parseSSEResponse } from './sse-parser';

/**
 * Claude AI 适配器
 */
@Injectable()
export class ClaudeAdapter implements AIAdapter {
  private readonly logger = new Logger(ClaudeAdapter.name);
  readonly provider = 'claude';

  async chat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    config: AIAdapterConfig,
  ): Promise<ChatResponse> {
    const baseUrl = config.apiBaseUrl || 'https://api.anthropic.com';
    const url = `${baseUrl}/v1/messages`;

    // 提取 system 消息
    const systemMessages = messages.filter((m) => m.role === 'system');
    const systemPrompt = systemMessages
      .map((m) => (typeof m.content === 'string' ? m.content : ''))
      .join('\n\n');

    // 转换非 system 消息为 Claude 格式
    const claudeMessages = this.translateMessages(
      messages.filter((m) => m.role !== 'system'),
    );

    // 构建 Claude tools 格式
    const claudeTools =
      tools.length > 0
        ? tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters,
          }))
        : undefined;

    try {
      this.logger.log(`调用 Claude Chat API: ${config.model}`);

      const body: any = {
        model: config.model,
        max_tokens: 4096,
        messages: claudeMessages,
      };
      if (systemPrompt) {
        body.system = systemPrompt;
      }
      if (claudeTools) {
        body.tools = claudeTools;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Claude API 错误: ${response.status} - ${errorText}`,
        );
        throw new Error(`Claude API 请求失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      this.logger.error(`Claude chat 失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 将统一消息格式转换为 Claude API 格式
   */
  private translateMessages(messages: ChatMessage[]): any[] {
    const result: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        const content = this.buildUserContent(msg);
        result.push({ role: 'user', content });
      } else if (msg.role === 'assistant') {
        const content: any[] = [];
        if (msg.content) {
          content.push({
            type: 'text',
            text:
              typeof msg.content === 'string'
                ? msg.content
                : msg.content
                    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
                    .map((b) => b.text)
                    .join(''),
          });
        }
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.arguments,
            });
          }
        }
        if (content.length > 0) {
          result.push({ role: 'assistant', content });
        }
      } else if (msg.role === 'tool') {
        // Claude: tool results 作为 user 消息中的 tool_result block
        result.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.toolCallId,
              content: JSON.stringify(msg.toolResult),
            },
          ],
        });
      }
    }

    return result;
  }

  /**
   * 构建用户消息内容
   */
  private buildUserContent(msg: ChatMessage): any {
    if (typeof msg.content === 'string') {
      return msg.content;
    }
    if (Array.isArray(msg.content)) {
      return (msg.content as ContentBlock[]).map((block) => {
        if (block.type === 'text') {
          return { type: 'text', text: block.text };
        }
        if (block.type === 'image') {
          return {
            type: 'image',
            source: {
              type: 'base64',
              media_type: block.mediaType,
              data: block.data,
            },
          };
        }
        return block;
      });
    }
    return msg.content || '';
  }

  /**
   * 解析 Claude API 响应
   */
  private parseResponse(data: any): ChatResponse {
    let content: string | null = null;
    const toolCalls: ToolCall[] = [];

    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') {
          content = (content || '') + block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input,
          });
        }
      }
    }

    let stopReason: ChatResponse['stopReason'] = 'end_turn';
    if (data.stop_reason === 'tool_use') {
      stopReason = 'tool_use';
    } else if (data.stop_reason === 'max_tokens') {
      stopReason = 'max_tokens';
    }

    return {
      content,
      toolCalls,
      stopReason,
      usage: data.usage
        ? {
            inputTokens: data.usage.input_tokens,
            outputTokens: data.usage.output_tokens,
          }
        : undefined,
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    config: AIAdapterConfig,
  ): AsyncGenerator<AdapterStreamEvent, void, undefined> {
    const baseUrl = config.apiBaseUrl || 'https://api.anthropic.com';
    const url = `${baseUrl}/v1/messages`;

    const systemMessages = messages.filter((m) => m.role === 'system');
    const systemPrompt = systemMessages
      .map((m) => (typeof m.content === 'string' ? m.content : ''))
      .join('\n\n');

    const claudeMessages = this.translateMessages(
      messages.filter((m) => m.role !== 'system'),
    );

    const claudeTools =
      tools.length > 0
        ? tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters,
          }))
        : undefined;

    this.logger.log(`调用 Claude Chat Stream API: ${config.model}`);

    const body: any = {
      model: config.model,
      max_tokens: 4096,
      messages: claudeMessages,
      stream: true,
    };
    if (systemPrompt) {
      body.system = systemPrompt;
    }
    if (claudeTools) {
      body.tools = claudeTools;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Claude Stream API 错误: ${response.status} - ${errorText}`);
      throw new Error(`Claude API 请求失败: ${response.status} - ${errorText}`);
    }

    // 跟踪当前 content block 类型
    let currentBlockType: 'text' | 'tool_use' | null = null;
    let currentToolId = '';
    let currentToolName = '';

    for await (const sse of parseSSEResponse(response)) {
      if (!sse.data || sse.data === '[DONE]') continue;

      let parsed: any;
      try {
        parsed = JSON.parse(sse.data);
      } catch {
        continue;
      }

      const eventType = sse.event || parsed.type;

      if (eventType === 'content_block_start') {
        const block = parsed.content_block;
        if (block?.type === 'tool_use') {
          currentBlockType = 'tool_use';
          currentToolId = block.id;
          currentToolName = block.name;
          yield {
            type: 'tool_call_start',
            toolCallId: block.id,
            toolCallName: block.name,
          };
        } else if (block?.type === 'text') {
          currentBlockType = 'text';
        }
      } else if (eventType === 'content_block_delta') {
        const delta = parsed.delta;
        if (delta?.type === 'text_delta' && delta.text) {
          yield { type: 'text_delta', content: delta.text };
        } else if (delta?.type === 'input_json_delta' && delta.partial_json) {
          yield {
            type: 'tool_call_delta',
            toolCallId: currentToolId,
            argumentsDelta: delta.partial_json,
          };
        }
      } else if (eventType === 'content_block_stop') {
        if (currentBlockType === 'tool_use') {
          yield { type: 'tool_call_end', toolCallId: currentToolId };
        }
        currentBlockType = null;
      } else if (eventType === 'message_delta') {
        const delta = parsed.delta;
        let stopReason: AdapterStreamEvent['stopReason'] = 'end_turn';
        if (delta?.stop_reason === 'tool_use') stopReason = 'tool_use';
        else if (delta?.stop_reason === 'max_tokens') stopReason = 'max_tokens';

        yield {
          type: 'done',
          stopReason,
          usage: parsed.usage
            ? {
                inputTokens: parsed.usage.input_tokens ?? 0,
                outputTokens: parsed.usage.output_tokens ?? 0,
              }
            : undefined,
        };
      }
    }
  }

  // ========== 旧接口（向后兼容） ==========

  async parseBills(
    content: string,
    type: 'image' | 'text',
    config: AIAdapterConfig,
  ): Promise<ParsedBillDto[]> {
    const baseUrl = config.apiBaseUrl || 'https://api.anthropic.com';
    const url = `${baseUrl}/v1/messages`;

    const messageContent: any[] = [];

    if (type === 'image') {
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: this.getMediaType(content),
          data: this.extractBase64Data(content),
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
      this.logger.log(`调用 Claude API: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
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

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/html')) {
        const htmlText = await response.text();
        this.logger.error(
          `Claude API 返回了 HTML: ${htmlText.substring(0, 200)}`,
        );
        throw new Error(
          'API 地址配置错误，返回了 HTML 页面。请检查 apiBaseUrl 是否正确',
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Claude API 错误: ${response.status} - ${errorText}`,
        );
        throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const textContent = data.content?.find((c: any) => c.type === 'text');
      const responseText = textContent?.text || '';

      this.logger.debug(`Claude 返回: ${responseText}`);
      return parseAIResponse(responseText);
    } catch (error) {
      this.logger.error(`Claude 解析账单失败: ${error.message}`);
      throw error;
    }
  }

  async testConnection(config: AIAdapterConfig): Promise<boolean> {
    const baseUrl = config.apiBaseUrl || 'https://api.anthropic.com';
    const url = `${baseUrl}/v1/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      return response.ok;
    } catch (error) {
      this.logger.error(`Claude 连接测试失败: ${error.message}`);
      return false;
    }
  }

  private getMediaType(base64Data: string): string {
    if (base64Data.startsWith('data:image/png')) return 'image/png';
    if (base64Data.startsWith('data:image/gif')) return 'image/gif';
    if (base64Data.startsWith('data:image/webp')) return 'image/webp';
    return 'image/jpeg';
  }

  private extractBase64Data(base64Data: string): string {
    const match = base64Data.match(/^data:image\/\w+;base64,(.+)$/);
    return match ? match[1] : base64Data;
  }
}
