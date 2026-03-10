/**
 * API相关常量
 */

// API端点
export const API_ENDPOINTS = {
  // 系统相关
  ROOT: '/',
  HEALTH: '/health',

  // 分类相关（预留）
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id: number) => `/categories/${id}`,

  // 交易相关（预留）
  TRANSACTIONS: '/transactions',
  TRANSACTION_BY_ID: (id: number) => `/transactions/${id}`,
  TRANSACTION_STATISTICS: '/transactions/statistics',

  // 用户相关（预留）
  USER_PROFILE: '/user/profile',
  USER_SETTINGS: '/user/settings',

  // AI 相关
  AI_CONFIGS: '/ai/configs',
  AI_CONFIG_BY_ID: (id: number) => `/ai/configs/${id}`,
  AI_CONFIG_SET_DEFAULT: (id: number) => `/ai/configs/${id}/set-default`,
  AI_CONFIG_TEST: (id: number) => `/ai/configs/${id}/test`,
  AI_PARSE_BILLS: '/ai/parse-bills',

  // AI 聊天
  AI_CHAT_SEND: '/ai/chat/send',
  AI_CHAT_SESSIONS: '/ai/chat/sessions',
  AI_CHAT_SESSION_BY_ID: (id: number) => `/ai/chat/sessions/${id}`,
} as const;

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// 请求超时配置
export const TIMEOUT_CONFIG = {
  DEFAULT: 10000,
  UPLOAD: 30000,
  DOWNLOAD: 60000,
} as const;

// 重试配置
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RETRY_METHODS: ['GET'],
} as const;
