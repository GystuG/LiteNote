/**
 * 账户相关类型定义
 */

export type AccountType = 'bank_card' | 'e_wallet' | 'credit_card' | 'cash';

export interface AccountData {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  icon?: string;
  color?: string;
  isDefault: boolean;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  balance?: number;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  balance?: number;
  icon?: string;
  color?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface AccountBalance {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}
