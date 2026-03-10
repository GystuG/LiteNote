/**
 * AI 聊天系统统一类型定义
 * Provider 无关的消息、工具调用、响应格式
 */

// ========== 内容块类型（多模态支持） ==========

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  data: string; // Base64 数据
  mediaType: string; // e.g., 'image/jpeg'
}

export type ContentBlock = TextContent | ImageContent;

// ========== 统一消息格式 ==========

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | ContentBlock[];

  // assistant 消息中的工具调用
  toolCalls?: ToolCall[];

  // tool 角色消息的工具结果
  toolCallId?: string;
  toolName?: string;
  toolResult?: any;
}

// ========== 工具调用 ==========

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

// ========== 工具定义 ==========

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// ========== AI 适配器响应 ==========

export interface ChatResponse {
  /** AI 返回的文本内容（纯工具调用时可为 null） */
  content: string | null;

  /** AI 请求执行的工具调用列表 */
  toolCalls: ToolCall[];

  /** 停止原因 */
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';

  /** Token 用量（可选，用于日志） */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ========== 流式事件（Adapter 级，从 AI 服务商返回）==========

export type AdapterStreamEventType =
  | 'text_delta'
  | 'thinking_delta'
  | 'tool_call_start'
  | 'tool_call_delta'
  | 'tool_call_end'
  | 'done';

export interface AdapterStreamEvent {
  type: AdapterStreamEventType;
  /** text_delta: 增量文本 */
  content?: string;
  /** tool_call_*: 工具调用 ID */
  toolCallId?: string;
  /** tool_call_start: 工具名称 */
  toolCallName?: string;
  /** tool_call_delta: 增量 JSON 参数片段 */
  argumentsDelta?: string;
  /** done: 停止原因 */
  stopReason?: 'end_turn' | 'tool_use' | 'max_tokens';
  /** done: Token 用量 */
  usage?: { inputTokens: number; outputTokens: number };
}

// ========== 流式事件（面向客户端 SSE）==========

export type StreamEventType =
  | 'session_created'
  | 'thinking'
  | 'thinking_delta'
  | 'text_delta'
  | 'tool_call_start'
  | 'tool_result'
  | 'done'
  | 'error';

export interface StreamEvent {
  event: StreamEventType;
  data: Record<string, any>;
}
