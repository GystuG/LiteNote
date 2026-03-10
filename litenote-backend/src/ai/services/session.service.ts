import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 会话管理服务
 * 处理 ChatSession 和 ChatMessage 的 CRUD
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建新会话
   */
  async createSession(userId: string, aiConfigId?: number) {
    return this.prisma.chatSession.create({
      data: {
        userId,
        aiConfigId: aiConfigId || null,
        title: '新对话',
      },
    });
  }

  /**
   * 获取会话（含权限校验）
   */
  async getSession(userId: string, sessionId: number) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId, isActive: true },
    });
    if (!session) {
      throw new NotFoundException('会话不存在');
    }
    return session;
  }

  /**
   * 获取会话列表（分页，置顶优先）
   */
  async listSessions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      this.prisma.chatSession.findMany({
        where: { userId, isActive: true },
        orderBy: [
          { isPinned: 'desc' },
          { updatedAt: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.chatSession.count({
        where: { userId, isActive: true },
      }),
    ]);

    return {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取会话详情 + 全部消息
   */
  async getSessionWithMessages(userId: string, sessionId: number) {
    const session = await this.getSession(userId, sessionId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { seqNum: 'asc' },
    });
    return { session, messages };
  }

  /**
   * 获取上下文消息（summaryUpTo 之后的消息，用于构建 AI 上下文）
   */
  async getContextMessages(sessionId: number, summaryUpTo: number | null) {
    const where: any = { sessionId };
    if (summaryUpTo) {
      where.seqNum = { gt: summaryUpTo };
    }
    return this.prisma.chatMessage.findMany({
      where,
      orderBy: { seqNum: 'asc' },
    });
  }

  /**
   * 获取下一个消息序号
   */
  async getNextSeqNum(sessionId: number): Promise<number> {
    const lastMessage = await this.prisma.chatMessage.findFirst({
      where: { sessionId },
      orderBy: { seqNum: 'desc' },
      select: { seqNum: true },
    });
    return (lastMessage?.seqNum ?? 0) + 1;
  }

  /**
   * 保存消息
   */
  async saveMessage(
    sessionId: number,
    seqNum: number,
    data: {
      role: string;
      content?: string;
      toolCalls?: any;
      toolCallId?: string;
      toolName?: string;
      toolResult?: any;
      imageUrl?: string;
    },
  ) {
    // 同时更新 session 的 updatedAt
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return this.prisma.chatMessage.create({
      data: {
        sessionId,
        seqNum,
        role: data.role,
        content: data.content || null,
        toolCalls: data.toolCalls || undefined,
        toolCallId: data.toolCallId || null,
        toolName: data.toolName || null,
        toolResult: data.toolResult || undefined,
        imageUrl: data.imageUrl || null,
      },
    });
  }

  /**
   * 更新会话摘要
   */
  async updateSummary(
    sessionId: number,
    summary: string,
    summaryUpTo: number,
  ) {
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { summary, summaryUpTo },
    });
  }

  /**
   * 更新会话标题
   */
  async updateTitle(sessionId: number, title: string) {
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: title.substring(0, 200) },
    });
  }

  /**
   * 切换置顶状态
   */
  async togglePin(sessionId: number, isPinned: boolean) {
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { isPinned },
    });
  }

  /**
   * 软删除会话
   */
  async deleteSession(userId: string, sessionId: number) {
    await this.getSession(userId, sessionId);
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  /**
   * 获取未摘要的消息数量
   */
  async getUnsummarizedCount(sessionId: number): Promise<number> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { summaryUpTo: true },
    });
    const where: any = { sessionId };
    if (session?.summaryUpTo) {
      where.seqNum = { gt: session.summaryUpTo };
    }
    return this.prisma.chatMessage.count({ where });
  }
}
