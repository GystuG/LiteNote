/**
 * AI 相关 API 服务
 */
import EventSource from 'react-native-sse';
import { httpService } from '../http';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/app';
import env from '../../config/env';
import type { ApiResponse } from '../../types/api';
import type {
  AIModelConfig,
  CreateAIConfigDto,
  UpdateAIConfigDto,
  ParseBillRequest,
  ParsedBill,
  TestConnectionResult,
  ChatRequest,
  ChatResponseData,
  ChatSession,
  ChatMessageData,
  StreamCallbacks,
} from '../../types/ai';

class AIService {
  // ========== 模型配置管理 ==========

  /**
   * 获取用户的模型配置列表
   */
  async getConfigs(): Promise<ApiResponse<AIModelConfig[]>> {
    return httpService.get('/ai/configs');
  }

  /**
   * 获取单个配置详情
   */
  async getConfig(id: number): Promise<ApiResponse<AIModelConfig>> {
    return httpService.get(`/ai/configs/${id}`);
  }

  /**
   * 创建模型配置
   */
  async createConfig(data: CreateAIConfigDto): Promise<ApiResponse<AIModelConfig>> {
    return httpService.post('/ai/configs', data);
  }

  /**
   * 更新模型配置
   */
  async updateConfig(id: number, data: UpdateAIConfigDto): Promise<ApiResponse<AIModelConfig>> {
    return httpService.patch(`/ai/configs/${id}`, data);
  }

  /**
   * 删除模型配置
   */
  async deleteConfig(id: number): Promise<ApiResponse> {
    return httpService.delete(`/ai/configs/${id}`);
  }

  /**
   * 设置默认配置
   */
  async setDefaultConfig(id: number): Promise<ApiResponse<AIModelConfig>> {
    return httpService.post(`/ai/configs/${id}/set-default`, {});
  }

  /**
   * 测试模型连接
   */
  async testConfig(id: number): Promise<ApiResponse<TestConnectionResult>> {
    return httpService.post(`/ai/configs/${id}/test`, {});
  }

  // ========== 账单解析 ==========

  /**
   * 解析账单
   */
  async parseBills(data: ParseBillRequest): Promise<ApiResponse<{ bills: ParsedBill[] }>> {
    return httpService.post('/ai/parse-bills', data);
  }

  // ========== 聊天会话 ==========

  /**
   * 发送聊天消息
   */
  async sendMessage(data: ChatRequest): Promise<ApiResponse<ChatResponseData>> {
    return httpService.post('/ai/chat/send', data, { timeout: 60000 });
  }

  /**
   * 获取会话列表
   */
  async getChatSessions(params?: { page?: number; limit?: number }): Promise<
    ApiResponse<ChatSession[]>
  > {
    return httpService.get('/ai/chat/sessions', { params });
  }

  /**
   * 获取会话详情（含消息历史）
   */
  async getChatSession(
    sessionId: number,
  ): Promise<ApiResponse<{ session: ChatSession; messages: ChatMessageData[] }>> {
    return httpService.get(`/ai/chat/sessions/${sessionId}`);
  }

  /**
   * 删除会话
   */
  async deleteChatSession(sessionId: number): Promise<ApiResponse> {
    return httpService.delete(`/ai/chat/sessions/${sessionId}`);
  }

  /**
   * 重命名会话
   */
  async renameChatSession(sessionId: number, title: string): Promise<ApiResponse> {
    return httpService.patch(`/ai/chat/sessions/${sessionId}`, { title });
  }

  /**
   * 置顶/取消置顶会话
   */
  async togglePinChatSession(sessionId: number): Promise<ApiResponse<{ isPinned: boolean }>> {
    return httpService.post(`/ai/chat/sessions/${sessionId}/toggle-pin`, {});
  }

  // ========== 流式聊天 ==========

  // ========== 语音识别 ==========

  /**
   * 语音转文字（ASR）
   */
  async transcribeAudio(
    audioBase64: string,
    mimeType?: string,
  ): Promise<ApiResponse<{ text: string }>> {
    return httpService.post('/ai/asr/transcribe', { audioBase64, mimeType }, { timeout: 30000 });
  }

  // ========== 流式聊天（SSE） ==========

  /**
   * 流式发送聊天消息 (SSE)
   * 返回 close 函数，调用可取消连接
   */
  streamMessage(
    data: ChatRequest,
    callbacks: StreamCallbacks,
  ): { close: () => void } {
    type SSEEvents =
      | 'session_created'
      | 'thinking'
      | 'thinking_delta'
      | 'text_delta'
      | 'tool_call_start'
      | 'tool_result'
      | 'done'
      | 'error';

    let es: EventSource<SSEEvents> | null = null;
    let closed = false;

    const setup = async () => {
      const token = await storage.getItem<string>(STORAGE_KEYS.USER_TOKEN);
      const baseUrl = (env.get('API_BASE_URL') as string).replace(/\/+$/, '');

      es = new EventSource<SSEEvents>(`${baseUrl}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(data),
      });

      es.addEventListener('session_created', (e) => {
        if (e.data && !closed) callbacks.onSessionCreated?.(JSON.parse(e.data));
      });
      es.addEventListener('thinking', (e) => {
        if (e.data && !closed) callbacks.onThinking?.(JSON.parse(e.data));
      });
      es.addEventListener('thinking_delta', (e) => {
        if (e.data && !closed) callbacks.onThinkingDelta?.(JSON.parse(e.data));
      });
      es.addEventListener('text_delta', (e) => {
        if (e.data && !closed) callbacks.onTextDelta?.(JSON.parse(e.data));
      });
      es.addEventListener('tool_call_start', (e) => {
        if (e.data && !closed) callbacks.onToolCallStart?.(JSON.parse(e.data));
      });
      es.addEventListener('tool_result', (e) => {
        if (e.data && !closed) callbacks.onToolResult?.(JSON.parse(e.data));
      });
      es.addEventListener('done', (e) => {
        if (e.data && !closed) callbacks.onDone?.(JSON.parse(e.data));
        es?.close();
      });
      es.addEventListener('error', (e) => {
        if (!closed) {
          callbacks.onError?.({ message: (e as any)?.message || '连接断开' });
        }
        es?.close();
      });
    };

    setup().catch((err) => {
      callbacks.onError?.({ message: err.message || '连接失败' });
    });

    return {
      close: () => {
        closed = true;
        es?.close();
      },
    };
  }
}

export const aiService = new AIService();
