/**
 * AI 聊天系统类型定义
 * 仅保留面向客户端 SSE 的事件类型（adapter 层类型已被 AI SDK 替代）
 */

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
