/**
 * React Query 配置
 * 包含缓存策略、后台清理等配置
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * 缓存时间配置（毫秒）
 */
export const CACHE_TIME = {
  // 关键用户数据：较长缓存
  DASHBOARD: 5 * 60 * 1000,      // 5分钟 - 首页数据
  STATISTICS: 5 * 60 * 1000,     // 5分钟 - 统计数据
  CATEGORIES: 30 * 60 * 1000,    // 30分钟 - 分类数据（变化少）

  // 临时数据：较短缓存
  BILLS_LIST: 2 * 60 * 1000,     // 2分钟 - 账单列表
  BILL_DETAIL: 1 * 60 * 1000,    // 1分钟 - 账单详情
};

/**
 * 垃圾回收时间配置（毫秒）
 * 数据在缓存中保留的最长时间，超过后会被清理
 */
export const GC_TIME = {
  DEFAULT: 10 * 60 * 1000,       // 10分钟
  LONG: 30 * 60 * 1000,          // 30分钟
};

/**
 * Query Keys 常量
 * 用于缓存键管理和失效控制
 */
export const QUERY_KEYS = {
  // 首页相关
  dashboard: (month: string) => ['dashboard', month] as const,

  // 统计相关
  statistics: (startDate: string, endDate: string) =>
    ['statistics', startDate, endDate] as const,

  // 账单相关
  bills: {
    all: ['bills'] as const,
    list: (params: Record<string, any>) => ['bills', 'list', params] as const,
    detail: (id: number) => ['bills', 'detail', id] as const,
  },

  // 分类相关
  categories: {
    all: ['categories'] as const,
    byType: (type: 'income' | 'expense') => ['categories', type] as const,
  },

  // 资产 Tab
  accountsBalance: ['accounts', 'balance'] as const,
  accountsList: ['accounts', 'list'] as const,
  assetTrend: (year: number) => ['asset-trend', year] as const,

  // 收支网格
  dailyGrid: (year: number, month: number) =>
    ['daily-grid', year, month] as const,
  dailyBills: (date: string) =>
    ['daily-bills', date] as const,
  monthlyGrid: (year: number) =>
    ['monthly-grid', year] as const,
  yearlyGrid: (startYear: number, endYear: number) =>
    ['yearly-grid', startYear, endYear] as const,

  // 预算
  budgets: ['budgets'] as const,
  budgetProgress: ['budget-progress'] as const,

  // 财务目标
  financialGoals: ['financial-goals'] as const,
};

/**
 * 创建 QueryClient 实例
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 默认 staleTime：数据被认为是新鲜的时间
        staleTime: CACHE_TIME.BILLS_LIST,

        // 默认 gcTime：缓存数据被垃圾回收的时间
        gcTime: GC_TIME.DEFAULT,

        // 重试配置
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

        // 窗口聚焦时不自动重新获取（RN 中通过 AppState 手动控制）
        refetchOnWindowFocus: false,

        // 网络恢复时重新获取
        refetchOnReconnect: true,

        // 挂载时如果数据过期则重新获取
        refetchOnMount: true,
      },
      mutations: {
        // mutation 重试配置
        retry: 1,
      },
    },
  });
}

/**
 * 全局 QueryClient 实例
 */
export const queryClient = createQueryClient();

/**
 * 缓存失效辅助函数
 */
export const invalidateCache = {
  /**
   * 使所有账单相关缓存失效
   * 在创建/编辑/删除账单后调用
   */
  bills: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bills.all });
    // 同时使首页和统计数据失效，因为它们依赖账单数据
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
    // 使收支网格数据失效
    queryClient.invalidateQueries({ queryKey: ['daily-grid'] });
    queryClient.invalidateQueries({ queryKey: ['daily-bills'] });
    queryClient.invalidateQueries({ queryKey: ['monthly-grid'] });
    queryClient.invalidateQueries({ queryKey: ['yearly-grid'] });
    queryClient.invalidateQueries({ queryKey: ['asset-trend'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  },

  /**
   * 使首页数据失效
   */
  dashboard: () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  },

  /**
   * 使统计数据失效
   */
  statistics: () => {
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
  },

  /**
   * 使分类数据失效
   */
  categories: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories.all });
  },

  /**
   * 使预算相关缓存失效
   */
  budgets: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgets });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgetProgress });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  },

  /**
   * 使财务目标相关缓存失效
   */
  financialGoals: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.financialGoals });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  },

  /**
   * 清除所有缓存（用于退出登录等场景）
   */
  all: () => {
    queryClient.clear();
  },
};

/**
 * 清理过期缓存
 * 在应用进入后台时调用
 */
export const cleanupStaleCache = () => {
  // 移除所有非活跃的查询缓存
  queryClient.getQueryCache().getAll().forEach((query) => {
    // 如果查询没有观察者（没有组件在使用）且数据已过期
    if (query.getObserversCount() === 0 && query.isStale()) {
      queryClient.getQueryCache().remove(query);
    }
  });
};
