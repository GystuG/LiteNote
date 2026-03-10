import { Logger } from '@nestjs/common';
import {
  ChatMessage,
  ChatResponse,
  ToolCall,
  ToolDefinition,
  ContentBlock,
  AdapterStreamEvent,
} from '../types/chat.types';
import { AIAdapterConfig } from './base.adapter';
import { parseSSEResponse } from './sse-parser';

/**
 * OpenAI 兼容格式的 chat 实现
 * 被 OpenAI、DeepSeek、Qwen 适配器共享
 */
export async function openaiCompatibleChat(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  config: AIAdapterConfig,
  apiUrl: string,
  logger: Logger,
  providerName: string,
): Promise<ChatResponse> {
  // 转换消息为 OpenAI 格式
  const openaiMessages = translateMessagesToOpenAI(messages);

  // DeepSeek R1 (reasoner) 要求所有 assistant 消息都包含 reasoning_content
  if (config.model?.includes('reasoner')) {
    patchReasoningContent(openaiMessages);
  }

  // 构建 tools 参数
  const openaiTools =
    tools.length > 0
      ? tools.map((t) => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }))
      : undefined;

  try {
    logger.log(`调用 ${providerName} Chat API: ${config.model}`);

    const body: any = {
      model: config.model,
      max_tokens: 4096,
      messages: openaiMessages,
    };
    if (openaiTools) {
      body.tools = openaiTools;
      body.parallel_tool_calls = false;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`${providerName} API 错误: ${response.status} - ${errorText}`);
      throw new Error(`${providerName} API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return parseOpenAIResponse(data);
  } catch (error) {
    logger.error(`${providerName} chat 失败: ${error.message}`);
    throw error;
  }
}

/**
 * 将统一消息转换为 OpenAI 兼容格式
 */
function translateMessagesToOpenAI(messages: ChatMessage[]): any[] {
  const result: any[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      result.push({
        role: 'system',
        content: typeof msg.content === 'string' ? msg.content : '',
      });
    } else if (msg.role === 'user') {
      result.push({
        role: 'user',
        content: buildOpenAIUserContent(msg),
      });
    } else if (msg.role === 'assistant') {
      const assistantMsg: any = {
        role: 'assistant',
        content:
          typeof msg.content === 'string' ? msg.content : msg.content || null,
      };
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        assistantMsg.tool_calls = msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        }));
      }
      result.push(assistantMsg);
    } else if (msg.role === 'tool') {
      result.push({
        role: 'tool',
        tool_call_id: msg.toolCallId,
        content: JSON.stringify(msg.toolResult),
      });
    }
  }

  return result;
}

/**
 * 构建 OpenAI 格式的用户消息内容
 */
function buildOpenAIUserContent(msg: ChatMessage): any {
  if (typeof msg.content === 'string') {
    return msg.content;
  }
  if (Array.isArray(msg.content)) {
    return (msg.content as ContentBlock[]).map((block) => {
      if (block.type === 'text') {
        return { type: 'text', text: block.text };
      }
      if (block.type === 'image') {
        const dataUrl = block.data.startsWith('data:')
          ? block.data
          : `data:${block.mediaType};base64,${block.data}`;
        return {
          type: 'image_url',
          image_url: { url: dataUrl },
        };
      }
      return block;
    });
  }
  return msg.content || '';
}

/**
 * OpenAI 兼容格式的流式 chat 实现
 * 被 OpenAI、DeepSeek、Qwen 适配器共享
 */
export async function* openaiCompatibleChatStream(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  config: AIAdapterConfig,
  apiUrl: string,
  logger: Logger,
  providerName: string,
): AsyncGenerator<AdapterStreamEvent, void, undefined> {
  const openaiMessages = translateMessagesToOpenAI(messages);

  // DeepSeek R1 (reasoner) 要求所有 assistant 消息都包含 reasoning_content
  if (config.model?.includes('reasoner')) {
    patchReasoningContent(openaiMessages);
  }

  const openaiTools =
    tools.length > 0
      ? tools.map((t) => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }))
      : undefined;

  logger.log(`调用 ${providerName} Chat Stream API: ${config.model}`);

  const body: any = {
    model: config.model,
    max_tokens: 4096,
    messages: openaiMessages,
    stream: true,
  };
  if (openaiTools) {
    body.tools = openaiTools;
    body.parallel_tool_calls = false;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`${providerName} Stream API 错误: ${response.status} - ${errorText}`);
    throw new Error(`${providerName} API 请求失败: ${response.status} - ${errorText}`);
  }

  // 跟踪工具调用状态：index → { id, name }
  const toolCallMap = new Map<number, { id: string; name: string }>();

  for await (const sse of parseSSEResponse(response)) {
    if (!sse.data || sse.data.trim() === '[DONE]') continue;

    let parsed: any;
    try {
      parsed = JSON.parse(sse.data);
    } catch {
      continue;
    }

    const choice = parsed.choices?.[0];
    if (!choice) continue;

    const delta = choice.delta;

    // 调试: 记录首个包含非 content 字段的 delta（帮助诊断思维链字段名）
    if (delta && !delta.content && !delta.tool_calls && Object.keys(delta).length > 0) {
      logger.debug(`${providerName} delta keys: ${Object.keys(delta).join(', ')}`);
    }

    // 文本增量
    if (delta?.content) {
      yield { type: 'text_delta', content: delta.content };
    }

    // 思维链增量（DeepSeek R1 等模型的 reasoning_content）
    if (delta?.reasoning_content) {
      yield { type: 'thinking_delta', content: delta.reasoning_content };
    }

    // 兼容：部分模型使用 reasoning 字段
    if (!delta?.reasoning_content && delta?.reasoning) {
      yield { type: 'thinking_delta', content: delta.reasoning };
    }

    // 工具调用增量
    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        if (tc.id && !toolCallMap.has(idx)) {
          // 首次出现的工具调用 index — 注册它
          const toolName = tc.function?.name || '';
          toolCallMap.set(idx, { id: tc.id, name: toolName });
          if (toolName) {
            yield {
              type: 'tool_call_start',
              toolCallId: tc.id,
              toolCallName: toolName,
            };
          }
        } else if (tc.function?.name) {
          // 工具名在后续 chunk 到达 — 补全并通知前端
          const existing = toolCallMap.get(idx);
          if (existing && !existing.name) {
            existing.name = tc.function.name;
            yield {
              type: 'tool_call_start',
              toolCallId: existing.id,
              toolCallName: tc.function.name,
            };
          }
        }
        // 始终处理参数增量（不被 tc.id 检查阻断）
        if (tc.function?.arguments) {
          const existing = toolCallMap.get(idx);
          if (existing) {
            yield {
              type: 'tool_call_delta',
              toolCallId: existing.id,
              argumentsDelta: tc.function.arguments,
            };
          }
        }
      }
    }

    // 结束原因
    if (choice.finish_reason) {
      // 先发送所有未关闭的 tool_call_end
      for (const [, info] of toolCallMap) {
        yield { type: 'tool_call_end', toolCallId: info.id };
      }
      toolCallMap.clear();

      let stopReason: AdapterStreamEvent['stopReason'] = 'end_turn';
      if (
        choice.finish_reason === 'tool_calls' ||
        choice.finish_reason === 'function_call'
      ) {
        stopReason = 'tool_use';
      } else if (choice.finish_reason === 'length') {
        stopReason = 'max_tokens';
      }

      yield {
        type: 'done',
        stopReason,
        usage: parsed.usage
          ? {
              inputTokens: parsed.usage.prompt_tokens ?? 0,
              outputTokens: parsed.usage.completion_tokens ?? 0,
            }
          : undefined,
      };
    }
  }
}

/**
 * DeepSeek R1 要求 assistant 消息必须包含 reasoning_content 字段
 * 对缺少该字段的历史消息补上空字符串
 */
function patchReasoningContent(messages: any[]): void {
  for (const msg of messages) {
    if (msg.role === 'assistant' && !('reasoning_content' in msg)) {
      msg.reasoning_content = '';
    }
  }
}

/**
 * 解析 OpenAI 兼容格式响应
 */
function parseOpenAIResponse(data: any): ChatResponse {
  const choice = data.choices?.[0];
  if (!choice) {
    return { content: null, toolCalls: [], stopReason: 'end_turn' };
  }

  const message = choice.message;
  const content = message?.content || null;
  const toolCalls: ToolCall[] = [];

  if (message?.tool_calls) {
    for (const tc of message.tool_calls) {
      let args: Record<string, any> = {};
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        args = {};
      }
      toolCalls.push({
        id: tc.id,
        name: tc.function.name,
        arguments: args,
      });
    }
  }

  let stopReason: ChatResponse['stopReason'] = 'end_turn';
  if (
    choice.finish_reason === 'tool_calls' ||
    choice.finish_reason === 'function_call'
  ) {
    stopReason = 'tool_use';
  } else if (choice.finish_reason === 'length') {
    stopReason = 'max_tokens';
  }

  return {
    content,
    toolCalls,
    stopReason,
    usage: data.usage
      ? {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
        }
      : undefined,
  };
}
