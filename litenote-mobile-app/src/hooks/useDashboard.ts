/**
 * 首页数据 Hook
 * 使用 React Query 管理首页数据的获取和缓存
 */
import { useQuery } from '@tanstack/react-query';
import { billsService } from '../services';
import { CACHE_TIME, QUERY_KEYS, GC_TIME } from '../lib/queryClient';
import type { BillData, BillStatistics } from '../types/bill';

interface DashboardData {
  statistics: BillStatistics | null;
  recentBills: BillData[];
  monthIncome: number;
  monthExpense: number;
  monthBalance: number;
}

/**
 * 获取首页数据
 */
async function fetchDashboardData(month: string): Promise<DashboardData> {
  const today = new Date();
  const [year, monthNum] = month.split('-').map(Number);
  const startOfMonth = new Date(year, monthNum - 1, 1);
  const endOfMonth = new Date(year, monthNum, 0);

  const todayStr = today < endOfMonth
    ? today.toISOString().split('T')[0]
    : endOfMonth.toISOString().split('T')[0];
  const monthStartStr = startOfMonth.toISOString().split('T')[0];

  // 并行获取统计数据和最近账单
  const [statsResponse, billsResponse] = await Promise.all([
    billsService.getBillStatistics({
      startDate: monthStartStr,
      endDate: todayStr,
    }),
    billsService.getBills({ limit: 10 }),
  ]);

  const stats = statsResponse.data;
  const monthIncome = stats?.totalIncome || 0;
  const monthExpense = stats?.totalExpense || 0;

  return {
    statistics: stats || null,
    recentBills: billsResponse.data || [],
    monthIncome,
    monthExpense,
    monthBalance: monthIncome - monthExpense,
  };
}

/**
 * 首页数据 Hook
 * @param enabled 是否启用查询（用于按需加载）
 */
export function useDashboard(enabled: boolean = true) {
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const query = useQuery({
    queryKey: QUERY_KEYS.dashboard(currentMonth),
    queryFn: () => fetchDashboardData(currentMonth),
    enabled,
    staleTime: CACHE_TIME.DASHBOARD,
    gcTime: GC_TIME.DEFAULT,
    // 如果有缓存数据，先显示缓存再后台刷新
    refetchOnMount: 'always',
  });

  return {
    // 数据
    data: query.data,
    statistics: query.data?.statistics ?? null,
    recentBills: query.data?.recentBills ?? [],
    monthIncome: query.data?.monthIncome ?? 0,
    monthExpense: query.data?.monthExpense ?? 0,
    monthBalance: query.data?.monthBalance ?? 0,

    // 状态
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,

    // 方法
    refetch: query.refetch,
  };
}
