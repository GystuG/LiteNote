/**
 * 应用常量
 */

// 存储键名
export const STORAGE_KEYS = {
  USER_TOKEN: '@accounting_app/user_token',
  USER_INFO: '@accounting_app/user_info',
  APP_SETTINGS: '@accounting_app/app_settings',
  LAST_SYNC_TIME: '@accounting_app/last_sync_time',
} as const;


// 默认分类配置
export const DEFAULT_CATEGORIES = {
  INCOME: [
    { name: '工资', icon: '💰', color: '#4CAF50' },
    { name: '奖金', icon: '🎁', color: '#8BC34A' },
    { name: '投资收益', icon: '📈', color: '#009688' },
  ],
  EXPENSE: [
    { name: '餐饮', icon: '🍽️', color: '#FF5722' },
    { name: '交通', icon: '🚗', color: '#FF9800' },
    { name: '购物', icon: '🛍️', color: '#E91E63' },
    { name: '娱乐', icon: '🎮', color: '#9C27B0' },
    { name: '医疗', icon: '💊', color: '#F44336' },
    { name: '教育', icon: '📚', color: '#3F51B5' },
    { name: '居住', icon: '🏠', color: '#795548' },
  ],
} as const;

// 应用主题色
export const THEME_COLORS = {
  PRIMARY: '#4A90E2',
  PRIMARY_LIGHT: '#E8F2FF',
  PRIMARY_DARK: '#3A7BC8',
  SECONDARY: '#FF6B6B',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  
  // 功能色
  INCOME: '#4CAF50',
  EXPENSE: '#F44336',
  
  // 中性色
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#666666',
  TEXT_TERTIARY: '#9E9E9E',
  BACKGROUND: '#F8F9FA',
  SURFACE: '#FFFFFF',
  DIVIDER: '#E0E0E0',
} as const;

// 动画配置
export const ANIMATION_CONFIG = {
  DURATION: {
    SHORT: 200,
    MEDIUM: 300,
    LONG: 500,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
} as const;

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
