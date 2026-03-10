import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AIConfigService } from '../ai-config.service';
import { SessionService } from './session.service';
import { ToolExecutorService } from './tool-executor.service';
import { CategoriesService } from '../../categories/categories.service';
import {
  AIAdapter,
  ClaudeAdapter,
  OpenAIAdapter,
  DeepSeekAdapter,
  QwenAdapter,
} from '../adapters';
import { ChatMessage, ContentBlock, StreamEvent } from '../types/chat.types';
import { TOOL_DEFINITIONS } from '../tools/tool-definitions';
import { ChatRequestDto, ChatResponseDto, ToolResultDto } from '../dto/chat.dto';

/** 触发摘要压缩的消息数阈值 */
const MESSAGE_THRESHOLD = 20;
/** 发送给 AI 的最大上下文消息数 */
const MAX_CONTEXT_MESSAGES = 30;
/** 工具调用最大循环次数 */
const MAX_TOOL_ROUNDS = 5;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly adapters: Map<string, AIAdapter>;

  constructor(
    private readonly configService: AIConfigService,
    private readonly sessionService: SessionService,
    private readonly toolExecutor: ToolExecutorService,
    private readonly categoriesService: CategoriesService,
    private readonly claudeAdapter: ClaudeAdapter,
    private readonly openaiAdapter: OpenAIAdapter,
    private readonly deepseekAdapter: DeepSeekAdapter,
    private readonly qwenAdapter: QwenAdapter,
  ) {
    this.adapters = new Map<string, AIAdapter>([
      ['claude', this.claudeAdapter],
      ['openai', this.openaiAdapter],
      ['deepseek', this.deepseekAdapter],
      ['qwen', this.qwenAdapter],
    ]);
  }

  /**
   * 核心聊天方法
   */
  async chat(userId: string, dto: ChatRequestDto): Promise<ChatResponseDto> {
    // 1. 获取或创建会话
    let sessionId = dto.sessionId;
    let isNewSession = false;
    if (!sessionId) {
      const session = await this.sessionService.createSession(
        userId,
        dto.configId,
      );
      sessionId = session.id;
      isNewSession = true;
    } else {
      // 校验会话归属
      await this.sessionService.getSession(userId, sessionId);
    }

    // 2. 获取 AI 配置 + 适配器
    const { adapter, config } = await this.getAdapterAndConfig(
      userId,
      dto.configId,
      sessionId,
    );

    // 3. 保存用户消息
    const userSeqNum = await this.sessionService.getNextSeqNum(sessionId);
    const userMessageData: any = {
      role: 'user',
      content: dto.content,
    };
    const images = dto.imageBase64List?.length
      ? dto.imageBase64List
      : dto.imageBase64
        ? [dto.imageBase64]
        : [];
    if (images.length > 0) {
      userMessageData.imageUrl = JSON.stringify(images);
    }
    await this.sessionService.saveMessage(sessionId, userSeqNum, userMessageData);

    // 4. 首条消息时自动生成标题（异步，不阻塞）
    if (isNewSession) {
      this.generateTitle(sessionId, dto.content, adapter, config).catch(
        (err) => this.logger.warn(`生成标题失败: ${err.message}`),
      );
    }

    // 5. 构建上下文
    const contextMessages = await this.buildContextMessages(
      userId,
      sessionId,
    );

    // 6. 工具循环
    const allToolResults: ToolResultDto[] = [];
    let assistantContent = '';
    let messages = [...contextMessages];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      this.logger.log(`工具循环第 ${round + 1} 轮 - session ${sessionId}`);

      const response = await adapter.chat(messages, TOOL_DEFINITIONS, {
        apiKey: config.apiKey,
        apiBaseUrl: config.apiBaseUrl,
        model: config.model,
      });

      if (response.usage) {
        this.logger.debug(
          `Token 用量: input=${response.usage.inputTokens}, output=${response.usage.outputTokens}`,
        );
      }

      if (response.stopReason === 'tool_use' && response.toolCalls.length > 0) {
        // 保存 assistant 消息（含 toolCalls）
        const assistantSeq = await this.sessionService.getNextSeqNum(sessionId);
        await this.sessionService.saveMessage(sessionId, assistantSeq, {
          role: 'assistant',
          content: response.content || undefined,
          toolCalls: response.toolCalls,
        });

        // 追加 assistant 消息到上下文
        messages.push({
          role: 'assistant',
          content: response.content || undefined,
          toolCalls: response.toolCalls,
        });

        // 执行每个工具调用
        for (const toolCall of response.toolCalls) {
          const toolResult = await this.toolExecutor.executeTool(
            userId,
            toolCall.name,
            toolCall.arguments,
          );

          // 保存 tool 消息
          const toolSeq = await this.sessionService.getNextSeqNum(sessionId);
          await this.sessionService.saveMessage(sessionId, toolSeq, {
            role: 'tool',
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            toolResult: toolResult,
          });

          // 追加到上下文
          messages.push({
            role: 'tool',
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            toolResult: toolResult,
          });

          // 收集工具结果
          allToolResults.push({
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            result: toolResult,
          });
        }

        // 继续循环，让 AI 处理工具结果
        continue;
      }

      // end_turn 或 max_tokens：保存最终 assistant 消息并退出
      assistantContent = response.content || '';
      const finalSeq = await this.sessionService.getNextSeqNum(sessionId);
      await this.sessionService.saveMessage(sessionId, finalSeq, {
        role: 'assistant',
        content: assistantContent,
      });
      break;
    }

    // 7. 异步检查是否需要摘要压缩
    this.checkAndCompress(userId, sessionId, adapter, config).catch((err) =>
      this.logger.warn(`摘要压缩失败: ${err.message}`),
    );

    // 8. 返回结果
    return {
      sessionId,
      content: assistantContent,
      toolResults: allToolResults,
    };
  }

  /**
   * 流式聊天方法 — 逐步 yield StreamEvent
   */
  async *chatStream(
    userId: string,
    dto: ChatRequestDto,
  ): AsyncGenerator<StreamEvent, void, undefined> {
    const startTime = Date.now();

    // 1. 获取或创建会话
    let sessionId = dto.sessionId;
    let isNewSession = false;
    let session: any;
    if (!sessionId) {
      session = await this.sessionService.createSession(
        userId,
        dto.configId,
      );
      sessionId = session.id;
      isNewSession = true;
    } else {
      session = await this.sessionService.getSession(userId, sessionId);
    }

    // ★ 立即通知前端，消除"连接中..."等待
    yield { event: 'session_created', data: { sessionId } };
    yield { event: 'thinking', data: { round: 1 } };

    // 2. 并行: 获取 AI 配置 + 消息序号
    const [{ adapter, config }, userSeqNum] = await Promise.all([
      this.getAdapterAndConfig(userId, dto.configId, session),
      this.sessionService.getNextSeqNum(sessionId),
    ]);

    // 3. 构建用户消息数据
    const userMessageData: any = {
      role: 'user',
      content: dto.content,
    };
    const images = dto.imageBase64List?.length
      ? dto.imageBase64List
      : dto.imageBase64
        ? [dto.imageBase64]
        : [];
    if (images.length > 0) {
      userMessageData.imageUrl = JSON.stringify(images);
    }

    // 4. 保存用户消息（必须在构建上下文之前完成，否则上下文中缺少当前消息）
    await this.sessionService.saveMessage(sessionId, userSeqNum, userMessageData);

    // 5. 构建上下文（此时用户消息已入库，会被包含在上下文中）
    const contextMessages = await this.buildContextMessages(userId, sessionId, session);

    // 5. 流式工具循环
    let messages = [...contextMessages];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      this.logger.log(`流式工具循环第 ${round + 1} 轮 - session ${sessionId}`);

      // 第 1 轮已在上面提前发送 thinking，第 2 轮起在此发送
      if (round > 0) {
        yield { event: 'thinking', data: { round: round + 1 } };
      }

      // 调用适配器流式接口
      let accumulatedText = '';
      const toolCallBuffers = new Map<
        string,
        { name: string; argumentsJson: string }
      >();
      let stopReason: 'end_turn' | 'tool_use' | 'max_tokens' = 'end_turn';

      for await (const event of adapter.chatStream(
        messages,
        TOOL_DEFINITIONS,
        {
          apiKey: config.apiKey,
          apiBaseUrl: config.apiBaseUrl,
          model: config.model,
        },
      )) {
        switch (event.type) {
          case 'text_delta':
            accumulatedText += event.content || '';
            yield {
              event: 'text_delta',
              data: { content: event.content || '' },
            };
            break;

          case 'thinking_delta':
            yield {
              event: 'thinking_delta',
              data: { content: event.content || '' },
            };
            break;

          case 'tool_call_start':
            toolCallBuffers.set(event.toolCallId!, {
              name: event.toolCallName || '',
              argumentsJson: '',
            });
            yield {
              event: 'tool_call_start',
              data: {
                toolCallId: event.toolCallId,
                toolName: event.toolCallName,
              },
            };
            break;

          case 'tool_call_delta': {
            const buf = toolCallBuffers.get(event.toolCallId!);
            if (buf) {
              buf.argumentsJson += event.argumentsDelta || '';
            }
            break;
          }

          case 'tool_call_end':
            // 不需要额外处理，参数已在 delta 中累积
            break;

          case 'done':
            stopReason = event.stopReason || 'end_turn';
            break;
        }
      }

      if (stopReason === 'tool_use' && toolCallBuffers.size > 0) {
        // 构建 toolCalls 数组，过滤掉无效调用
        const toolCalls = Array.from(toolCallBuffers.entries())
          .filter(([, buf]) => {
            if (!buf.name) {
              this.logger.warn(`过滤掉空名工具调用`);
              return false;
            }
            return true;
          })
          .map(([id, buf]) => {
            let args: Record<string, any> = {};
            try {
              args = JSON.parse(buf.argumentsJson);
            } catch {
              this.logger.warn(`解析工具参数失败: ${buf.argumentsJson}`);
            }
            return { id, name: buf.name, arguments: args };
          });

        // 如果过滤后没有有效工具调用，直接退出循环
        if (toolCalls.length === 0) {
          this.logger.warn(`第 ${round + 1} 轮没有有效工具调用，退出循环`);
          break;
        }

        this.logger.log(`第 ${round + 1} 轮执行 ${toolCalls.length} 个工具: ${toolCalls.map(t => t.name).join(', ')}`);

        // 保存 assistant 消息（含 toolCalls）
        const assistantSeq =
          await this.sessionService.getNextSeqNum(sessionId);
        await this.sessionService.saveMessage(sessionId, assistantSeq, {
          role: 'assistant',
          content: accumulatedText || undefined,
          toolCalls,
        });

        // 追加到上下文
        messages.push({
          role: 'assistant',
          content: accumulatedText || undefined,
          toolCalls,
        });

        // 执行每个工具调用
        for (const toolCall of toolCalls) {
          const toolResult = await this.toolExecutor.executeTool(
            userId,
            toolCall.name,
            toolCall.arguments,
          );

          // 保存 tool 消息
          const toolSeq = await this.sessionService.getNextSeqNum(sessionId);
          await this.sessionService.saveMessage(sessionId, toolSeq, {
            role: 'tool',
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            toolResult,
          });

          // 追加到上下文
          messages.push({
            role: 'tool',
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            toolResult,
          });

          // 通知前端工具执行结果
          yield {
            event: 'tool_result',
            data: {
              toolCallId: toolCall.id,
              toolName: toolCall.name,
              result: toolResult,
            },
          };
        }

        // 继续循环，让 AI 处理工具结果
        continue;
      }

      // end_turn 或 max_tokens：保存最终 assistant 消息并退出
      if (accumulatedText) {
        const finalSeq = await this.sessionService.getNextSeqNum(sessionId);
        await this.sessionService.saveMessage(sessionId, finalSeq, {
          role: 'assistant',
          content: accumulatedText,
        });
      }
      break;
    }

    // 6. 异步后台任务（流式完成后执行，避免竞争 API 速率限制）
    if (isNewSession) {
      this.generateTitle(sessionId, dto.content, adapter, config).catch(
        (err) => this.logger.warn(`生成标题失败: ${err.message}`),
      );
    }
    this.checkAndCompress(userId, sessionId, adapter, config).catch((err) =>
      this.logger.warn(`摘要压缩失败: ${err.message}`),
    );

    // 7. 完成
    yield {
      event: 'done',
      data: {
        sessionId,
        thinkingTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * 获取适配器和配置
   * @param sessionOrId - 传入 session 对象可避免重复查询
   */
  private async getAdapterAndConfig(
    userId: string,
    configId: number | undefined,
    sessionOrId: number | { aiConfigId: number | null },
  ) {
    let aiConfig;

    if (configId) {
      aiConfig = await this.configService.getFullConfig(userId, configId);
    } else {
      // 获取 session（支持直接传入对象或 sessionId）
      const session =
        typeof sessionOrId === 'number'
          ? await this.sessionService.getSession(userId, sessionOrId)
          : sessionOrId;
      if (session.aiConfigId) {
        aiConfig = await this.configService.getFullConfig(
          userId,
          session.aiConfigId,
        );
      } else {
        // 使用默认配置
        aiConfig = await this.configService.findDefault(userId);
      }
    }

    if (!aiConfig) {
      throw new BadRequestException('请先配置 AI 模型');
    }

    const adapter = this.adapters.get(aiConfig.provider);
    if (!adapter) {
      throw new BadRequestException(
        `不支持的 AI 服务商: ${aiConfig.provider}`,
      );
    }

    return { adapter, config: aiConfig };
  }

  /**
   * 构建上下文消息（system prompt + 摘要 + 历史消息）
   * @param preloadedSession - 传入已获取的 session 可避免重复查询
   */
  private async buildContextMessages(
    userId: string,
    sessionId: number,
    preloadedSession?: any,
  ): Promise<ChatMessage[]> {
    const session = preloadedSession || await this.sessionService.getSession(userId, sessionId);

    // 并行: 构建 system prompt + 获取上下文消息
    const [systemPrompt, dbMessages] = await Promise.all([
      this.buildSystemPrompt(userId),
      this.sessionService.getContextMessages(sessionId, session.summaryUpTo),
    ]);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // 如果有摘要，作为 system 消息附加
    if (session.summary) {
      messages.push({
        role: 'system',
        content: `以下是之前对话的摘要：\n${session.summary}`,
      });
    }

    // 转换 DB 消息为 ChatMessage 格式
    for (const msg of dbMessages) {
      const chatMsg: ChatMessage = { role: msg.role as ChatMessage['role'] };

      if (msg.role === 'user') {
        if (msg.imageUrl) {
          // 多模态消息（支持多图）
          const contentBlocks: ContentBlock[] = [];
          if (msg.content) {
            contentBlocks.push({ type: 'text', text: msg.content });
          }
          // 向后兼容：老数据为纯字符串，新数据为 JSON 数组
          let imageUrls: string[];
          try {
            const parsed = JSON.parse(msg.imageUrl);
            imageUrls = Array.isArray(parsed) ? parsed : [msg.imageUrl];
          } catch {
            imageUrls = [msg.imageUrl];
          }
          for (const url of imageUrls) {
            contentBlocks.push({
              type: 'image',
              data: url,
              mediaType: 'image/jpeg',
            });
          }
          chatMsg.content = contentBlocks;
        } else {
          chatMsg.content = msg.content || '';
        }
      } else if (msg.role === 'assistant') {
        chatMsg.content = msg.content || undefined;
        if (msg.toolCalls) {
          chatMsg.toolCalls = msg.toolCalls as any;
        }
      } else if (msg.role === 'tool') {
        chatMsg.toolCallId = msg.toolCallId || undefined;
        chatMsg.toolName = msg.toolName || undefined;
        chatMsg.toolResult = msg.toolResult;
      } else {
        chatMsg.content = msg.content || '';
      }

      messages.push(chatMsg);
    }

    // 裁剪上下文：保留 system 消息，从前面移除旧消息
    if (messages.length > MAX_CONTEXT_MESSAGES) {
      const systemMessages = messages.filter((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');
      const trimmed = nonSystemMessages.slice(
        nonSystemMessages.length - (MAX_CONTEXT_MESSAGES - systemMessages.length),
      );
      messages.length = 0;
      messages.push(...systemMessages, ...trimmed);
    }

    return messages;
  }

  /**
   * 构建动态 system prompt
   */
  private async buildSystemPrompt(userId: string): Promise<string> {
    // 获取用户分类
    const categories = await this.categoriesService.findAll(userId);
    const expenseCategories = categories
      .filter((c) => c.type === 'expense')
      .map((c) => c.name);
    const incomeCategories = categories
      .filter((c) => c.type === 'income')
      .map((c) => c.name);

    const today = new Date();
    const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()];
    const dateStr = today.toISOString().split('T')[0];

    return `你是一个智能助手，可以帮助用户记账、查询账单、统计分析，也可以进行日常闲聊和回答问题。

## 当前信息
- 今天是 ${dateStr}（星期${dayOfWeek}）

## 用户的账单分类
- 支出分类: ${expenseCategories.join('、')}
- 收入分类: ${incomeCategories.join('、')}

## 工具使用规则
1. 当用户提到了消费或收入，且信息足够完整（至少有金额），调用 create_bills 工具
2. 如果用户表达了记账意图但信息不完整（缺少金额等关键信息），请友好地追问
3. 当用户想查看账单记录时，调用 query_bills 工具
4. 当用户要求删除账单时，调用 delete_bills 工具（需要先通过 query_bills 获取账单 ID）
5. 当用户询问统计、消费分析、预算等问题时，调用 get_statistics 工具
6. 日常闲聊和普通问答时，直接回复，不要调用任何工具

## 注意事项
- 如果用户没有指定日期，默认使用今天 (${dateStr})
- 分类名称必须从上面列出的分类中选择
- 金额必须是正数
- 回复要简洁友好，使用中文`;
  }

  /**
   * 自动生成会话标题
   */
  private async generateTitle(
    sessionId: number,
    firstMessage: string,
    adapter: AIAdapter,
    config: any,
  ): Promise<void> {
    try {
      const response = await adapter.chat(
        [
          {
            role: 'system',
            content:
              '根据用户的第一条消息，生成一个简短的对话标题（10字以内）。只返回标题文字，不要加引号或其他标点。',
          },
          {
            role: 'user',
            content: firstMessage,
          },
        ],
        [], // 不需要工具
        {
          apiKey: config.apiKey,
          apiBaseUrl: config.apiBaseUrl,
          model: config.model,
        },
      );

      if (response.content) {
        await this.sessionService.updateTitle(
          sessionId,
          response.content.trim(),
        );
      }
    } catch (err) {
      this.logger.warn(`生成标题失败: ${err.message}`);
    }
  }

  /**
   * 检查并执行摘要压缩
   */
  private async checkAndCompress(
    userId: string,
    sessionId: number,
    adapter: AIAdapter,
    config: any,
  ): Promise<void> {
    const unsummarizedCount =
      await this.sessionService.getUnsummarizedCount(sessionId);

    if (unsummarizedCount < MESSAGE_THRESHOLD) {
      return;
    }

    this.logger.log(
      `会话 ${sessionId} 有 ${unsummarizedCount} 条未摘要消息，开始压缩`,
    );

    // 获取需要压缩的消息（保留最近 10 条不压缩）
    const session = await this.sessionService
      .getSession(userId, sessionId)
      .catch(() => null);

    if (!session) return;

    const allMessages = await this.sessionService.getContextMessages(
      sessionId,
      session.summaryUpTo,
    );

    if (allMessages.length <= 10) return;

    // 压缩前面的消息，保留最近 10 条
    const toCompress = allMessages.slice(0, allMessages.length - 10);
    const lastCompressedSeqNum = toCompress[toCompress.length - 1].seqNum;

    // 构建压缩内容
    const compressContent = toCompress
      .map((m) => {
        if (m.role === 'tool') {
          return `[工具 ${m.toolName}: ${JSON.stringify(m.toolResult).substring(0, 200)}]`;
        }
        const text =
          typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return `${m.role}: ${text?.substring(0, 300) || '[无文本]'}`;
      })
      .join('\n');

    const existingSummary = session.summary
      ? `之前的摘要：${session.summary}\n\n`
      : '';

    try {
      const response = await adapter.chat(
        [
          {
            role: 'system',
            content:
              '请将以下对话内容压缩为一段 200 字以内的摘要。保留关键信息（涉及的金额、日期、操作结果等），去掉不重要的细节。只返回摘要文字。',
          },
          {
            role: 'user',
            content: `${existingSummary}需要压缩的对话：\n${compressContent}`,
          },
        ],
        [],
        {
          apiKey: config.apiKey,
          apiBaseUrl: config.apiBaseUrl,
          model: config.model,
        },
      );

      if (response.content) {
        await this.sessionService.updateSummary(
          sessionId,
          response.content.trim(),
          lastCompressedSeqNum,
        );
        this.logger.log(
          `会话 ${sessionId} 摘要压缩完成，覆盖到 seqNum=${lastCompressedSeqNum}`,
        );
      }
    } catch (err) {
      this.logger.warn(`摘要压缩失败: ${err.message}`);
    }
  }
}
