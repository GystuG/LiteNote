/**
 * 通用模型类型定义
 */

// 基础模型
export interface BaseModel {
  id: number | string;
  created_at: string;
  updated_at: string;
}

// 系统状态
export interface SystemStatus {
  message: string;
  version: string;
  status: string;
  timestamp: string;
  features: string[];
}

// 工具模块
export interface ToolModule {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'active' | 'planned' | 'disabled';
  version?: string;
  config?: Record<string, any>;
}

// 用户信息（预留）
export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  preferences?: UserPreferences;
}

// 用户偏好设置（预留）
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  modules: string[];
}

// 通用查询参数
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
  filter?: Record<string, any>;
}

// 通用响应数据
export interface ResponseData<T = any> {
  data: T;
  message?: string;
  timestamp?: string;
}

// 分页响应
export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
