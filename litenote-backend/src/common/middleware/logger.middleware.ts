/**
 * 请求日志中间件
 * 记录所有HTTP请求的详细信息，便于调试和监控
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // 记录请求开始
    this.logger.log(`📥 ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    // 监听响应完成事件
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const responseTime = Date.now() - startTime;

      // 根据状态码选择不同的日志级别
      const logLevel =
        statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'log';
      const statusIcon = this.getStatusIcon(statusCode);

      this.logger[logLevel](
        `📤 ${statusIcon} ${method} ${originalUrl} ${statusCode} ${contentLength}b - ${responseTime}ms`,
      );
    });

    next();
  }

  /**
   * 根据状态码获取对应的图标
   */
  private getStatusIcon(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) {
      return '✅'; // 成功
    } else if (statusCode >= 300 && statusCode < 400) {
      return '🔄'; // 重定向
    } else if (statusCode >= 400 && statusCode < 500) {
      return '⚠️'; // 客户端错误
    } else {
      return '❌'; // 服务器错误
    }
  }
}
