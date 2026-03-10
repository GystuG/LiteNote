/**
 * 统计数据 Hook
 * 使用 React Query 管理统计页面数据的获取和缓存
 */
import { useQuery } from '@tanstack/react-query';
import { billsService } from '../services';
import { CACHE_TIME, QUERY_KEYS, GC_TIME } from '../lib/queryClient';
import type { BillStatistics } from '../types/bill';

type PeriodType = 'week' | 'month' | 'year';

interface StatisticsParams {
  startDate: string;
  endDate: string;
  period: PeriodType;
}

interface StatisticsData {
  current: BillStatistics | null;
  previous: BillStatistics | null;
}

/**
 * 计算日期范围
 */
export function getDateRange(date: Date, periodType: PeriodType) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  let startDate: Date;
  let endDate: Date;

  switch (periodType) {
    case 'week':
      const dayOfWeek = date.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(year, month, day - adjustedDay);
      endDate = new Date(year, month, day - adjustedDay + 6);
      break;
    case 'month':
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
      break;
    case 'year':
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      break;
  }

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

/**
 * 计算上一周期的日期范围
 */
export function getPreviousDateRange(date: Date, periodType: PeriodType) {
  const prevDate = new Date(date);

  switch (periodType) {
    case 'week':
      prevDate.setDate(prevDate.getDate() - 7);
      break;
    case 'month':
      prevDate.setMonth(prevDate.getMonth() - 1);
      break;
    case 'year':
      prevDate.setFullYear(prevDate.getFullYear() - 1);
      break;
  }

  return getDateRange(prevDate, periodType);
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取统计数据
 */
async function fetchStatistics(params: StatisticsParams): Promise<StatisticsData> {
  const { startDate, endDate } = params;

  // 计算上一周期的日期范围
  const currentDate = new Date(startDate);
  const prevRange = getPreviousDateRange(currentDate, params.period);

  // 并行获取当前周期和上一周期的数据
  const [currentStats, prevStats] = await Promise.all([
    billsService.getBillStatistics({ startDate, endDate }),
    billsService.getBillStatistics({
      startDate: prevRange.startDate,
      endDate: prevRange.endDate,
    }),
  ]);

  return {
    current: currentStats.success && currentStats.data ? currentStats.data : null,
    previous: prevStats.success && prevStats.data ? prevStats.data : null,
  };
}

/**
 * 统计数据 Hook
 * @param date 当前选择的日期
 * @param period 周期类型（week/month/year）
 * @param enabled 是否启用查询
 */
export function useStatistics(
  date: Date,
  period: PeriodType,
  enabled: boolean = true
) {
  const { startDate, endDate } = getDateRange(date, period);

  const query = useQuery({
    queryKey: QUERY_KEYS.statistics(startDate, endDate),
    queryFn: () => fetchStatistics({ startDate, endDate, period }),
    enabled,
    staleTime: CACHE_TIME.STATISTICS,
    gcTime: GC_TIME.DEFAULT,
    // 每次进入都重新获取，实现 SWR 模式
    // refetchOnMount: 'always',
    // 切换周期时保留旧数据直到新数据加载完成
    placeholderData: (previousData) => previousData,
  });

  // 计算环比
  const calculateComparison = () => {
    const current = query.data?.current;
    const previous = query.data?.previous;

    if (!current || !previous) {
      return { percentage: 0, isIncrease: false, text: '' };
    }

    const currentExpense = current.totalExpense;
    const previousExpense = previous.totalExpense;

    if (previousExpense === 0) {
      return { percentage: 0, isIncrease: currentExpense > 0, text: '' };
    }

    const diff = currentExpense - previousExpense;
    const percentage = Math.abs((diff / previousExpense) * 100);
    const isIncrease = diff > 0;

    const periodText = period === 'month' ? '上月' : period === 'year' ? '去年' : '上周';
    const changeText = isIncrease ? '多' : '少';

    return {
      percentage: Math.round(percentage),
      isIncrease,
      text: `比${periodText}同期${changeText}`,
    };
  };

  return {
    // 数据
    statistics: query.data?.current ?? null,
    prevStatistics: query.data?.previous ?? null,
    comparison: calculateComparison(),

    // 状态
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,

    // 方法
    refetch: query.refetch,
  };
}
