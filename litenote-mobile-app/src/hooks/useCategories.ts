/**
 * 分类数据 Hook
 * 使用 React Query 管理分类数据的获取和缓存
 */
import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '../services';
import { CACHE_TIME, QUERY_KEYS, GC_TIME } from '../lib/queryClient';
import type { BillType } from '../types/bill';

/**
 * 获取分类列表
 * @param type 分类类型（income/expense）
 * @param enabled 是否启用查询
 */
export function useCategories(type: BillType, enabled: boolean = true) {
  const query = useQuery({
    queryKey: QUERY_KEYS.categories.byType(type),
    queryFn: async () => {
      const response = await categoriesService.getCategories(type);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    },
    enabled,
    staleTime: CACHE_TIME.CATEGORIES,
    gcTime: GC_TIME.DEFAULT,
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
