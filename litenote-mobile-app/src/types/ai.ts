/**
 * AI 相关类型定义
 */

// 支持的 AI 服务商
export type AIProvider = 'claude' | 'openai' | 'deepseek' | 'qwen';

// AI 模型配置
export interface AIModelConfig {
  id: number;
  name: string;
  provider: AIProvider;
  model: string;
  apiKey?: string;
  apiBaseUrl?: string;
  isDefault: boolean;
  supportsVision: boolean;
  createdAt: string;
  updatedAt: string;
}

// 创建 AI 配置请求
export interface CreateAIConfigDto {
  name: string;
  provider: AIProvider;
  apiKey: string;
  apiBaseUrl?: string;
  model: string;
  supportsVision?: boolean;
  isDefault?: boolean;
}

// 更新 AI 配置请求
export interface UpdateAIConfigDto {
  name?: string;
  provider?: AIProvider;
  apiKey?: string;
  apiBaseUrl?: string;
  model?: string;
  supportsVision?: boolean;
  isDefault?: boolean;
}

// 解析账单请求
export interface ParseBillRequest {
  type: 'image' | 'text';
  content: string;
  configId?: number;
}

// 解析后的账单
export interface ParsedBill {
  amount: number;
  type: 'income' | 'expense';
  categoryName: string;
  description: string;
  date: string;
}

// 测试连接结果
export interface TestConnectionResult {
  success: boolean;
  message: string;
}

// ========== 聊天会话相关类型 ==========

// 聊天会话
export interface ChatSession {
  id: number;
  userId: string;
  title: string | null;
  aiConfigId: number | null;
  isActive: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

// 聊天消息（服务端）
export interface ChatMessageData {
  id: number;
  sessionId: number;
  seqNum: number;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  toolCalls: ToolCallData[] | null;
  toolCallId: string | null;
  toolName: string | null;
  toolResult: ToolResultData | null;
  imageUrl: string | null;
  createdAt: string;
}

// 工具调用
export interface ToolCallData {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

// 工具执行结果
export interface ToolResultData {
  success: boolean;
  data: any;
  message: string;
}

// 聊天请求
export interface ChatRequest {
  content: string;
  sessionId?: number;
  configId?: number;
  imageBase64List?: string[];
}

// 聊天响应
export interface ChatResponseData {
  sessionId: number;
  content: string;
  toolResults: Array<{
    toolCallId: string;
    toolName: string;
    result: ToolResultData;
  }>;
}

// ========== SSE 流式回调 ==========

export interface StreamCallbacks {
  onSessionCreated?: (data: { sessionId: number }) => void;
  onThinking?: (data: { round: number }) => void;
  onThinkingDelta?: (data: { content: string }) => void;
  onTextDelta?: (data: { content: string }) => void;
  onToolCallStart?: (data: { toolCallId: string; toolName: string }) => void;
  onToolResult?: (data: {
    toolCallId: string;
    toolName: string;
    result: ToolResultData;
  }) => void;
  onDone?: (data: { sessionId: number; thinkingTimeMs: number }) => void;
  onError?: (data: { message: string }) => void;
}

// 服务商预设配置
export interface ProviderPreset {
  name: string;
  defaultUrl: string;
  models: string[];
  supportsVision: boolean;
}

// 服务商预设
export const AI_PROVIDERS: Record<AIProvider, ProviderPreset> = {
  claude: {
    name: 'Claude',
    defaultUrl: 'https://api.anthropic.com',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    supportsVision: true,
  },
  openai: {
    name: 'OpenAI',
    defaultUrl: 'https://api.openai.com',
    models: ['gpt-5.2', 'gpt-5.2-chat-latest', 'gpt-5', 'gpt-5.1'],
    supportsVision: true,
  },
  deepseek: {
    name: 'DeepSeek',
    defaultUrl: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-coder'],
    supportsVision: false,
  },
  qwen: {
    name: '通义千问',
    defaultUrl: 'https://dashscope.aliyuncs.com',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-vl-plus'],
    supportsVision: true,
  },
};

// getProviderIcon 已移除，请使用 ProviderIcon 组件代替
// import { ProviderIcon } from '../components/icons/AIProviderIcons';
