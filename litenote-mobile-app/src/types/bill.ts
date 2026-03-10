/**
 * 账单相关类型定义
 */
import type { CategoryData } from './category';

export type BillType = 'income' | 'expense';

export interface BillData {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  date: string;
  categoryId?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: CategoryData;
}

export interface CreateBillDto {
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  date: string;
  categoryId?: number;
}

export interface UpdateBillDto {
  amount?: number;
  type?: 'income' | 'expense';
  description?: string;
  date?: string;
  categoryId?: number;
}

export interface BillQueryParams {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface CategoryStatistic {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  income: number;
  expense: number;
}

export interface DailyTrend {
  date: string;
  income: number;
  expense: number;
}

export interface BillStatistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  expenseCategoryStats: CategoryStatistic[];
  incomeCategoryStats: CategoryStatistic[];
  monthlyTrends: MonthlyTrend[];
  dailyTrends: DailyTrend[];
}
