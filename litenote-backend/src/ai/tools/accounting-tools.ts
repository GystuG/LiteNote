import { tool } from 'ai';
import { z } from 'zod';

/**
 * 工具执行结果类型（与 ToolExecutorService 返回格式一致）
 */
interface ToolExecutionResult {
  success: boolean;
  data: any;
  message: string;
}

/**
 * 创建记账工具集
 * 需要传入 userId 和 toolExecutor（运行时注入）
 */
export function createAccountingTools(
  userId: string,
  toolExecutor: { executeTool: (userId: string, toolName: string, args: any) => Promise<ToolExecutionResult> },
) {
  return {
    create_bills: tool({
      description:
        '识别并创建账单记录。当用户提到了消费或收入，且信息足够完整（至少有金额）时调用此工具。',
      inputSchema: z.object({
        bills: z.array(
          z.object({
            amount: z.number().describe('金额，正数'),
            type: z.enum(['income', 'expense']).describe('类型'),
            description: z.string().describe('简短描述，10字以内'),
            categoryName: z.string().describe('分类名称'),
            date: z.string().describe('日期，YYYY-MM-DD 格式'),
          }),
        ).describe('识别到的账单列表'),
      }),
      execute: async (args) =>
        toolExecutor.executeTool(userId, 'create_bills', args),
    }),

    query_bills: tool({
      description:
        '查询用户的账单记录。当用户想查看、搜索或了解某段时间内的账单时调用。',
      inputSchema: z.object({
        startDate: z.string().optional().describe('开始日期，YYYY-MM-DD'),
        endDate: z.string().optional().describe('结束日期，YYYY-MM-DD'),
        type: z.enum(['income', 'expense']).optional().describe('筛选类型'),
        categoryName: z.string().optional().describe('按分类名称筛选'),
        limit: z.number().optional().describe('返回数量限制，默认20，最大50'),
      }),
      execute: async (args) =>
        toolExecutor.executeTool(userId, 'query_bills', args),
    }),

    delete_bills: tool({
      description:
        '删除指定的账单记录。只有在用户明确要求删除时才调用。',
      inputSchema: z.object({
        billIds: z.array(z.number()).describe('要删除的账单ID列表'),
      }),
      execute: async (args) =>
        toolExecutor.executeTool(userId, 'delete_bills', args),
    }),

    get_statistics: tool({
      description:
        '获取账单统计信息。当用户询问统计、消费趋势、分析等问题时调用。',
      inputSchema: z.object({
        startDate: z.string().optional().describe('统计开始日期，YYYY-MM-DD'),
        endDate: z.string().optional().describe('统计结束日期，YYYY-MM-DD'),
      }),
      execute: async (args) =>
        toolExecutor.executeTool(userId, 'get_statistics', args),
    }),
  };
}
