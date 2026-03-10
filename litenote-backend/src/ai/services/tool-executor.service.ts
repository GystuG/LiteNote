import { Injectable, Logger } from '@nestjs/common';
import { BillsService } from '../../bills/bills.service';
import { CategoriesService } from '../../categories/categories.service';

/**
 * 工具执行服务
 * 执行 AI 调用的工具，操作账单和分类数据
 */
@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private readonly billsService: BillsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * 执行工具调用
   */
  async executeTool(
    userId: string,
    toolName: string,
    args: Record<string, any>,
  ): Promise<{ success: boolean; data: any; message: string }> {
    this.logger.log(`执行工具: ${toolName}, 参数: ${JSON.stringify(args)}`);

    switch (toolName) {
      case 'create_bills':
        return this.executeCreateBills(userId, args);
      case 'query_bills':
        return this.executeQueryBills(userId, args);
      case 'delete_bills':
        return this.executeDeleteBills(userId, args);
      case 'get_statistics':
        return this.executeGetStatistics(userId, args);
      default:
        return {
          success: false,
          data: null,
          message: `未知工具: ${toolName}`,
        };
    }
  }

  /**
   * create_bills: 仅做数据补全（categoryName → categoryId），不入库
   * 返回补全后的账单数据，由前端展示和确认后手动保存
   */
  private async executeCreateBills(
    userId: string,
    args: any,
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const categories = await this.categoriesService.findAll(userId);

      const bills = (args.bills || []).map((bill: any) => {
        const category = categories.find(
          (c) => c.name === bill.categoryName && c.type === bill.type,
        );
        return {
          amount: Number(bill.amount),
          type: bill.type,
          description: bill.description || '',
          categoryName: bill.categoryName,
          categoryId: category?.id || null,
          categoryIcon: category?.icon || null,
          date: bill.date,
        };
      });

      return {
        success: true,
        data: { bills },
        message: `识别到 ${bills.length} 条账单`,
      };
    } catch (error) {
      this.logger.error(`create_bills 执行失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `创建账单失败: ${error.message}`,
      };
    }
  }

  /**
   * query_bills: 查询账单记录
   */
  private async executeQueryBills(
    userId: string,
    args: any,
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      let categoryId: number | undefined;
      if (args.categoryName) {
        const categories = await this.categoriesService.findAll(userId);
        const cat = categories.find((c) => c.name === args.categoryName);
        categoryId = cat?.id;
      }

      const result = await this.billsService.findAll(userId, {
        startDate: args.startDate,
        endDate: args.endDate,
        type: args.type,
        categoryId,
        limit: Math.min(args.limit || 20, 50),
        page: 1,
        orderBy: 'date',
        orderDirection: 'desc',
      });

      return {
        success: true,
        data: result,
        message: `查询到 ${result.data.length} 条账单`,
      };
    } catch (error) {
      this.logger.error(`query_bills 执行失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `查询账单失败: ${error.message}`,
      };
    }
  }

  /**
   * delete_bills: 删除账单
   */
  private async executeDeleteBills(
    userId: string,
    args: any,
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const results: { id: number; deleted: boolean; error?: string }[] = [];
      for (const id of args.billIds || []) {
        try {
          await this.billsService.remove(userId, id);
          results.push({ id, deleted: true });
        } catch (e) {
          results.push({ id, deleted: false, error: e.message });
        }
      }
      const successCount = results.filter((r) => r.deleted).length;
      return {
        success: true,
        data: { results, successCount },
        message: `成功删除 ${successCount} 条账单`,
      };
    } catch (error) {
      this.logger.error(`delete_bills 执行失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `删除账单失败: ${error.message}`,
      };
    }
  }

  /**
   * get_statistics: 获取统计数据
   */
  private async executeGetStatistics(
    userId: string,
    args: any,
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const stats = await this.billsService.getStatistics(
        userId,
        args.startDate,
        args.endDate,
      );
      return {
        success: true,
        data: stats,
        message: '统计数据获取成功',
      };
    } catch (error) {
      this.logger.error(`get_statistics 执行失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `获取统计失败: ${error.message}`,
      };
    }
  }
}
