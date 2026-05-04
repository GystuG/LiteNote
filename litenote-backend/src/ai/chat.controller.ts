import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ChatService } from './services/chat.service';
import { SessionService } from './services/session.service';
import { ChatRequestDto, RenameSessionDto } from './dto/chat.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ai-chat')
@ApiBearerAuth('JWT-auth')
@Controller('ai/chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * 流式发送消息 (SSE)
   */
  @ApiOperation({
    summary: '流式发送聊天消息',
    description:
      '通过 SSE 流式返回 AI 响应，支持实时文本输出和工具调用状态',
  })
  @ApiResponse({ status: 200, description: 'SSE 流' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @Post('stream')
  async streamMessage(
    @CurrentUser('id') userId: string,
    @Body() dto: ChatRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // AbortController: 客户端断开时取消 AI 请求，节省 token
    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    try {
      for await (const event of this.chatService.chatStream(
        userId,
        dto,
        abortController.signal,
      )) {
        if (abortController.signal.aborted) break;
        res.write(
          `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      }
    } catch (error: any) {
      if (!abortController.signal.aborted) {
        res.write(
          `event: error\ndata: ${JSON.stringify({ message: error.message || '流式响应失败' })}\n\n`,
        );
      }
    } finally {
      res.end();
    }
  }

  /**
   * 获取会话列表
   */
  @ApiOperation({ summary: '获取聊天会话列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get('sessions')
  async listSessions(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.sessionService.listSessions(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * 获取会话详情（含所有消息）
   */
  @ApiOperation({ summary: '获取会话详情和消息历史' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @Get('sessions/:id')
  async getSession(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) sessionId: number,
  ) {
    const result = await this.sessionService.getSessionWithMessages(
      userId,
      sessionId,
    );
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 重命名会话
   */
  @ApiOperation({ summary: '重命名聊天会话' })
  @ApiResponse({ status: 200, description: '重命名成功' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @Patch('sessions/:id')
  async renameSession(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) sessionId: number,
    @Body() dto: RenameSessionDto,
  ) {
    await this.sessionService.getSession(userId, sessionId);
    await this.sessionService.updateTitle(sessionId, dto.title);
    return {
      success: true,
      message: '会话已重命名',
    };
  }

  /**
   * 置顶/取消置顶会话
   */
  @ApiOperation({ summary: '置顶或取消置顶聊天会话' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @Post('sessions/:id/toggle-pin')
  async togglePin(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) sessionId: number,
  ) {
    const session = await this.sessionService.getSession(userId, sessionId);
    const newPinned = !session.isPinned;
    await this.sessionService.togglePin(sessionId, newPinned);
    return {
      success: true,
      data: { isPinned: newPinned },
      message: newPinned ? '已置顶' : '已取消置顶',
    };
  }

  /**
   * 删除会话
   */
  @ApiOperation({ summary: '删除聊天会话' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @Delete('sessions/:id')
  async deleteSession(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) sessionId: number,
  ) {
    await this.sessionService.deleteSession(userId, sessionId);
    return {
      success: true,
      message: '会话已删除',
    };
  }
}
