import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    return {
      message: '智能记账 API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      features: ['智能记账', '分类管理', '预算追踪', '统计分析', 'AI 助手'],
    };
  }
}
