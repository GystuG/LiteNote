/**
 * 财务目标相关类型定义
 */

export interface FinancialGoalData {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  isCompleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinancialGoalDto {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

export interface UpdateFinancialGoalDto {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
  icon?: string;
  color?: string;
  isCompleted?: boolean;
}

export interface FinancialGoalProgress extends FinancialGoalData {
  progress: number; // 0-100
}
