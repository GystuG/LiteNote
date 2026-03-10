/**
 * 全局导航类型定义
 * 统一管理所有页面的路由参数，支持类型安全的导航
 */

import type { BillData } from './bill';
import type { CategoryData } from './category';

// React Navigation 全局类型扩展
declare global {
  namespace ReactNavigation {
    interface RootParamList {
      // 认证相关
      Login: undefined;
      UserAgreement: undefined;
      PrivacyPolicy: undefined;
      EditProfile: undefined;

      // 主要导航
      Main: undefined;
      Settings: undefined;
      GeneralSettings: undefined;
      Profile: undefined;

      // Dashboard
      Dashboard: undefined;

      // 记账功能
      CreateBill: {
        bill?: BillData;
        initialType?: 'income' | 'expense';
      };
      EditBill: {
        billId: number;
      };
      AllBills: {
        initialFilter?: 'all' | 'income' | 'expense';
      } | undefined;
      Statistics: undefined;
      Categories: undefined;

      // 统计报表
      Reports: undefined;
      BillStatistics: {
        dateRange?: {
          start: string;
          end: string;
        };
        type?: 'income' | 'expense' | 'all';
      };

      // 账单详情
      BillDetail: {
        billId: number;
      };

      // 分类管理
      CategoryManagement: undefined;

      // AI 助手
      AIChat: { sessionId?: number } | undefined;
      AIChatSessions: undefined;

      // 账户管理
      Accounts: undefined;
      CreateAccount: undefined;
      EditAccount: {
        accountId: number;
      };

      // 预算管理
      Budgets: undefined;
      CreateBudget: undefined;
      EditBudget: {
        budgetId: number;
      };

      // 财务目标
      FinancialGoals: undefined;

      // 设置相关
      About: undefined;
      UserProfile: undefined;

      // 通用功能
      WebView: {
        url: string;
        title?: string;
      };
    }
  }
}
