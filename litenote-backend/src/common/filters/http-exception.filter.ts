/**
 * 全局HTTP异常过滤器
 * 统一处理所有未捕获的异常，提供标准化的错误响应
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        details = exceptionResponse;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      details = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '未知错误';
      details = exception;
    }

    // 记录错误日志
    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      `${request.method} ${request.url}`,
    );

    // 构建错误响应
    const errorResponse: ErrorResponse = {
      code: status,
      message: this.getChineseErrorMessage(status, message),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 开发环境显示详细错误信息
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = details;
      if (exception instanceof Error) {
        errorResponse.stack = exception.stack;
      }
    }

    response.status(status).json(errorResponse);
  }

  /**
   * 获取中文错误消息
   */
  private getChineseErrorMessage(
    status: number,
    originalMessage: string,
  ): string {
    const statusMessages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权访问',
      403: '禁止访问',
      404: '请求的资源不存在',
      405: '请求方法不被允许',
      409: '请求冲突',
      422: '请求参数验证失败',
      429: '请求过于频繁',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用',
      504: '网关超时',
    };

    // 如果原始消息已经是中文，直接返回
    if (this.isChinese(originalMessage)) {
      return originalMessage;
    }

    // 返回状态码对应的中文消息，如果没有则返回原始消息
    return statusMessages[status] || originalMessage;
  }

  /**
   * 判断字符串是否包含中文
   */
  private isChinese(text: string): boolean {
    return /[\u4e00-\u9fa5]/.test(text);
  }
}
