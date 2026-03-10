/**
 * 统一API响应接口定义
 * 提供标准化的响应结构，确保前后端数据交互的一致性
 */

export interface ApiResponse<T = any> {
  /**
   * 响应状态码
   * 200: 成功
   * 400: 客户端错误
   * 500: 服务器错误
   */
  code: number;

  /**
   * 响应消息
   * 成功时显示操作结果，失败时显示错误信息
   */
  message: string;

  /**
   * 响应数据
   * 成功时包含实际数据，失败时为null
   */
  data: T | null;

  /**
   * 请求是否成功
   */
  success: boolean;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  /**
   * 数据列表
   */
  items: T[];

  /**
   * 分页信息
   */
  pagination: {
    /**
     * 当前页码
     */
    page: number;

    /**
     * 每页数量
     */
    limit: number;

    /**
     * 总数量
     */
    total: number;

    /**
     * 总页数
     */
    totalPages: number;

    /**
     * 是否有下一页
     */
    hasNext: boolean;

    /**
     * 是否有上一页
     */
    hasPrev: boolean;
  };
}

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  /**
   * 错误码
   */
  code: number;

  /**
   * 错误消息
   */
  message: string;

  /**
   * 错误详情（开发环境显示）
   */
  details?: any;

  /**
   * 错误堆栈（开发环境显示）
   */
  stack?: string;

  /**
   * 时间戳
   */
  timestamp: string;

  /**
   * 请求路径
   */
  path: string;
}
