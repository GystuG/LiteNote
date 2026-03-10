/**
 * 分类相关类型定义
 */

export interface CategoryData {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  isDefault: boolean;
  sortOrder: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  type?: 'income' | 'expense';
  icon?: string;
  color?: string;
  sortOrder?: number;
}
