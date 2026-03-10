/**
 * 安全中间件
 * 提供基础的安全防护，包括请求头安全、XSS防护等
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // 设置安全响应头
    this.setSecurityHeaders(res);

    // 移除敏感信息
    this.removeSensitiveHeaders(res);

    // 请求大小限制检查
    this.checkRequestSize(req);

    next();
  }

  /**
   * 设置安全响应头
   */
  private setSecurityHeaders(res: Response): void {
    // 防止点击劫持
    res.setHeader('X-Frame-Options', 'DENY');

    // 防止MIME类型嗅探
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // XSS防护
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // 强制HTTPS（生产环境）
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }

    // 内容安全策略
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    );

    // 引用者策略
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 权限策略
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()',
    );
  }

  /**
   * 移除敏感响应头
   */
  private removeSensitiveHeaders(res: Response): void {
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
  }

  /**
   * 检查请求大小
   */
  private checkRequestSize(req: Request): void {
    const contentLength = req.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (size > maxSize) {
        throw new Error('请求体过大');
      }
    }
  }
}
