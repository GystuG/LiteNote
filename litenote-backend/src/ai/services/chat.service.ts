import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { generateText, streamText, ModelMessage, LanguageModel, stepCountIs } from 'ai';
import { AIConfigService } from '../ai-config.service';
import { SessionService } from './session.service';
import { ToolExecutorService } from './tool-executor.service';
import { CategoriesService } from '../../categories/categories.service';
import { AIProviderFactory } from '../providers/ai-provider.factory';
import { createAccountingTools } from '../tools/accounting-tools';
import { StreamEvent } from '../types/chat.types';
import { ChatRequestDto } from '../dto/chat.dto';

/** 触发摘要压缩的消息数阈值 */
const MESSAGE_THRESHOLD = 20;
/** 发送给 AI 的最大上下文消息数 */
const MAX_CONTEXT_MESSAGES = 30;
/** 工具调用最大循环次数 */
const MAX_TOOL_ROUNDS = 5;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly configService: AIConfigService,
    private readonly sessionService: SessionService,
    private readonly toolExecutor: ToolExecutorService,
    private readonly categoriesService: CategoriesService,
    private readonly providerFactory: AIProviderFactory,
  ) {}

  /**
   * 流式聊天方法 — 逐步 yield StreamEvent
   */
  async *chatStream(
    userId: string,
    dto: ChatRequestDto,
    abortSignal?: AbortSignal,
  ): AsyncGenerator<StreamEvent, void, undefined> {
    const startTime = Date.now();

    // 1. 会话预处理 + 保存用户消息
    const { sessionId, isNewSession, model, config } =
      await this.prepareChat(userId, dto);

    // ★ 立即通知前端，消除"连接中..."等待
    yield { event: 'session_created', data: { sessionId } };
    yield { event: 'thinking', data: { round: 1 } };

    // 2. 构建上下文
    const messages = await this.buildContextMessages(userId, sessionId);

    // 3. 使用 AI SDK streamText + stopWhen 进行流式 agent loop
    let currentRound = 1;
    const tools = createAccountingTools(userId, this.toolExecutor);

    // 判断是否为 DeepSeek reasoner 模型，需要特殊处理 reasoning_content
    const isReasonerModel = config.model?.includes('reasoner');

    const result = streamText({
      model,
      messages,
      tools,
      stopWhen: stepCountIs(MAX_TOOL_ROUNDS),
      abortSignal,
      // DeepSeek reasoner 的 reasoning_content 不被 AI SDK chat 模式原生支持，
      // 需要通过 raw chunk 手动提取
      includeRawChunks: isReasonerModel,
    });

    // 4. 消费 fullStream，映射为客户端 SSE 事件
    try {
      for await (const part of result.fullStream) {
        switch (part.type) {
          case 'text-delta':
            yield {
              event: 'text_delta',
              data: { content: part.text },
            };
            break;

          case 'reasoning-delta':
            // Claude 等原生支持 reasoning 的模型走这里
            yield {
              event: 'thinking_delta',
              data: { content: part.text },
            };
            break;

          case 'raw':
            // DeepSeek reasoner 的 reasoning_content 只能从 raw chunk 中提取
            if (isReasonerModel) {
              const rawValue = part.rawValue as any;
              const delta = rawValue?.choices?.[0]?.delta;
              if (delta?.reasoning_content) {
                yield {
                  event: 'thinking_delta',
                  data: { content: delta.reasoning_content },
                };
              }
            }
            break;

          case 'tool-call':
            yield {
              event: 'tool_call_start',
              data: {
                toolCallId: part.toolCallId,
                toolName: part.toolName,
              },
            };
            break;

          case 'tool-result':
            yield {
              event: 'tool_result',
              data: {
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                result: part.output,
              },
            };
            currentRound++;
            if (currentRound <= MAX_TOOL_ROUNDS) {
              yield { event: 'thinking', data: { round: currentRound } };
            }
            break;

          case 'error':
            yield {
              event: 'error',
              data: { message: String(part.error) },
            };
            break;

          default:
            // start-step, finish-step, text-start, text-end 等事件不需要推送给前端
            break;
        }
      }
    } catch (err: any) {
      // AbortError 不需要推送错误事件
      if (err.name !== 'AbortError') {
        yield {
          event: 'error',
          data: { message: err.message || '流式响应失败' },
        };
      }
      return;
    }

    // 5. 保存完整结果到数据库
    try {
      await result.response;
      await this.saveAgentTrace(sessionId, await result.steps);
    } catch (err: any) {
      this.logger.warn(`保存 agent trace 失败: ${err.message}`);
    }

    // 6. 异步后台任务
    if (isNewSession) {
      this.generateTitle(sessionId, dto.content, model).catch((err) =>
        this.logger.warn(`生成标题失败: ${err.message}`),
      );
    }
    this.checkAndCompress(userId, sessionId, model).catch((err) =>
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

  // ==================== 私有方法 ====================

  /**
   * 公共预处理逻辑：会话创建/校验 + 获取模型 + 保存用户消息
   */
  private async prepareChat(userId: string, dto: ChatRequestDto) {
    // 1. 创建或获取会话
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

    // 2. 并行: 获取 AI 配置 + 消息序号
    const [config, userSeqNum] = await Promise.all([
      this.getModelConfig(userId, dto.configId, session),
      this.sessionService.getNextSeqNum(sessionId),
    ]);

    // 3. 创建 AI SDK model 实例
    const model = this.providerFactory.createModel(config);

    // 4. 构建并保存用户消息
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
    await this.sessionService.saveMessage(
      sessionId,
      userSeqNum,
      userMessageData,
    );

    return { sessionId, isNewSession, model, config, session };
  }

  /**
   * 获取模型配置
   */
  private async getModelConfig(
    userId: string,
    configId: number | undefined,
    session: { aiConfigId: number | null },
  ) {
    let aiConfig;

    if (configId) {
      aiConfig = await this.configService.getFullConfig(userId, configId);
    } else if (session.aiConfigId) {
      aiConfig = await this.configService.getFullConfig(
        userId,
        session.aiConfigId,
      );
    } else {
      aiConfig = await this.configService.findDefault(userId);
    }

    if (!aiConfig) {
      throw new BadRequestException('请先配置 AI 模型');
    }

    return aiConfig;
  }

  /**
   * 构建上下文消息（system prompt + 摘要 + 历史消息）
   * 输出 AI SDK v6 的 ModelMessage[] 格式
   */
  private async buildContextMessages(
    userId: string,
    sessionId: number,
    preloadedSession?: any,
  ): Promise<ModelMessage[]> {
    const session =
      preloadedSession ||
      (await this.sessionService.getSession(userId, sessionId));

    // 并行: 构建 system prompt + 获取上下文消息
    const [systemPrompt, dbMessages] = await Promise.all([
      this.buildSystemPrompt(userId),
      this.sessionService.getContextMessages(
        sessionId,
        session.summaryUpTo,
      ),
    ]);

    const messages: ModelMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // 如果有摘要，作为 system 消息附加
    if (session.summary) {
      messages.push({
        role: 'system',
        content: `以下是之前对话的摘要：\n${session.summary}`,
      });
    }

    // 转换 DB 消息为 ModelMessage 格式
    for (const msg of dbMessages) {
      if (msg.role === 'user') {
        if (msg.imageUrl) {
          // 多模态消息（支持多图）
          const contentParts: any[] = [];
          if (msg.content) {
            contentParts.push({ type: 'text', text: msg.content });
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
            const dataUrl = url.startsWith('data:')
              ? url
              : `data:image/jpeg;base64,${url}`;
            contentParts.push({ type: 'image', image: dataUrl });
          }
          messages.push({ role: 'user', content: contentParts });
        } else {
          messages.push({ role: 'user', content: msg.content || '' });
        }
      } else if (msg.role === 'assistant') {
        if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
          // Assistant 消息包含工具调用
          const contentParts: any[] = [];
          if (msg.content) {
            contentParts.push({ type: 'text', text: msg.content });
          }
          for (const tc of msg.toolCalls as any[]) {
            contentParts.push({
              type: 'tool-call',
              toolCallId: tc.id,
              toolName: tc.name,
              input: tc.arguments,
            });
          }
          messages.push({ role: 'assistant', content: contentParts });
        } else {
          messages.push({
            role: 'assistant',
            content: msg.content || '',
          });
        }
      } else if (msg.role === 'tool') {
        messages.push({
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: msg.toolCallId || '',
              toolName: msg.toolName || '',
              output: {
                type: 'text',
                value: typeof msg.toolResult === 'string'
                  ? msg.toolResult
                  : JSON.stringify(msg.toolResult),
              },
            },
          ],
        } as any);
      }
      // system 消息已在上面处理，跳过
    }

    // 裁剪上下文：保留 system 消息，从前面移除旧消息
    if (messages.length > MAX_CONTEXT_MESSAGES) {
      const systemMessages = messages.filter((m) => m.role === 'system');
      const nonSystemMessages = messages.filter(
        (m) => m.role !== 'system',
      );
      const trimmed = nonSystemMessages.slice(
        nonSystemMessages.length -
          (MAX_CONTEXT_MESSAGES - systemMessages.length),
      );
      return [...systemMessages, ...trimmed];
    }

    return messages;
  }

  /**
   * 将 streamText 的步骤结果保存到数据库
   */
  private async saveAgentTrace(
    sessionId: number,
    steps: any[],
  ): Promise<void> {
    for (const step of steps) {
      // 保存 assistant 消息
      const assistantSeq =
        await this.sessionService.getNextSeqNum(sessionId);

      const toolCalls =
        step.toolCalls?.map((tc: any) => ({
          id: tc.toolCallId,
          name: tc.toolName,
          arguments: tc.input,
        })) || [];

      await this.sessionService.saveMessage(sessionId, assistantSeq, {
        role: 'assistant',
        content: step.text || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      });

      // 保存每个工具结果
      if (step.toolResults) {
        for (const tr of step.toolResults) {
          const toolSeq =
            await this.sessionService.getNextSeqNum(sessionId);
          await this.sessionService.saveMessage(sessionId, toolSeq, {
            role: 'tool',
            toolCallId: tr.toolCallId,
            toolName: tr.toolName,
            toolResult: tr.output,
          });
        }
      }
    }
  }

  /**
   * 构建动态 system prompt
   */
  private async buildSystemPrompt(userId: string): Promise<string> {
    const categories = await this.categoriesService.findAll(userId);
    const expenseCategories = categories
      .filter((c) => c.type === 'expense')
      .map((c) => c.name);
    const incomeCategories = categories
      .filter((c) => c.type === 'income')
      .map((c) => c.name);

    const today = new Date();
    const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][
      today.getDay()
    ];
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
    model: LanguageModel,
  ): Promise<void> {
    try {
      const result = await generateText({
        model,
        system:
          '根据用户的第一条消息，生成一个简短的对话标题（10字以内）。只返回标题文字，不要加引号或其他标点。',
        prompt: firstMessage,
        maxOutputTokens: 50,
      });

      if (result.text) {
        await this.sessionService.updateTitle(
          sessionId,
          result.text.trim(),
        );
      }
    } catch (err: any) {
      this.logger.warn(`生成标题失败: ${err.message}`);
    }
  }

  /**
   * 检查并执行摘要压缩
   */
  private async checkAndCompress(
    userId: string,
    sessionId: number,
    model: LanguageModel,
  ): Promise<void> {
    const unsummarizedCount =
      await this.sessionService.getUnsummarizedCount(sessionId);

    if (unsummarizedCount < MESSAGE_THRESHOLD) {
      return;
    }

    this.logger.log(
      `会话 ${sessionId} 有 ${unsummarizedCount} 条未摘要消息，开始压缩`,
    );

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
    const lastCompressedSeqNum =
      toCompress[toCompress.length - 1].seqNum;

    // 构建压缩内容
    const compressContent = toCompress
      .map((m) => {
        if (m.role === 'tool') {
          return `[工具 ${m.toolName}: ${JSON.stringify(m.toolResult).substring(0, 200)}]`;
        }
        const text =
          typeof m.content === 'string'
            ? m.content
            : JSON.stringify(m.content);
        return `${m.role}: ${text?.substring(0, 300) || '[无文本]'}`;
      })
      .join('\n');

    const existingSummary = session.summary
      ? `之前的摘要：${session.summary}\n\n`
      : '';

    try {
      const result = await generateText({
        model,
        system:
          '请将以下对话内容压缩为一段 200 字以内的摘要。保留关键信息（涉及的金额、日期、操作结果等），去掉不重要的细节。只返回摘要文字。',
        prompt: `${existingSummary}需要压缩的对话：\n${compressContent}`,
        maxOutputTokens: 500,
      });

      if (result.text) {
        await this.sessionService.updateSummary(
          sessionId,
          result.text.trim(),
          lastCompressedSeqNum,
        );
        this.logger.log(
          `会话 ${sessionId} 摘要压缩完成，覆盖到 seqNum=${lastCompressedSeqNum}`,
        );
      }
    } catch (err: any) {
      this.logger.warn(`摘要压缩失败: ${err.message}`);
    }
  }
}
