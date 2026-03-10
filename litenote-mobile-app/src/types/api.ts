/**
 * API相关类型定义
 */

// 基础响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  code?: number;
  timestamp?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 错误响应类型
export interface ApiError {
  code: number;
  message: string;
  details?: any;
  timestamp: string;
}

// HTTP方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// 请求配置类型
export interface RequestConfig {
  url: string;
  method: HttpMethod;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// 拦截器类型
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: any) => Promise<any>;
}

export interface ResponseInterceptor {
  onResponse?: (response: any) => any | Promise<any>;
  onResponseError?: (error: any) => Promise<any>;
}
