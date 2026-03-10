/**
 * 预算相关类型定义
 */

export type BudgetPeriod = 'monthly' | 'yearly';

export interface BudgetData {
  id: number;
  name: string;
  amount: number;
  period: BudgetPeriod;
  categoryId?: number;
  category?: {
    id: number;
    name: string;
    icon?: string;
  };
  alertAt: number;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDto {
  name: string;
  amount: number;
  period: BudgetPeriod;
  categoryId?: number;
  alertAt?: number;
}

export interface UpdateBudgetDto {
  name?: string;
  amount?: number;
  period?: BudgetPeriod;
  categoryId?: number;
  alertAt?: number;
  isActive?: boolean;
}

export interface BudgetProgress extends BudgetData {
  spent: number;
  remaining: number;
  progress: number;
  isOverBudget: boolean;
  needsAlert: boolean;
}
