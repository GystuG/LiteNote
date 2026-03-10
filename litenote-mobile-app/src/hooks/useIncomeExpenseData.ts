/**
 * useIncomeExpenseData - 收支网格数据 hook
 * 提供日/月/年收支数据查询
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { billsService } from '../services/api/bills';
import { QUERY_KEYS, CACHE_TIME, GC_TIME } from '../lib/queryClient';

/**
 * 获取某月的每日收支数据（日收支视图用）
 */
export function useDailyGridData(year: number, month: number) {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const query = useQuery({
    queryKey: QUERY_KEYS.dailyGrid(year, month),
    queryFn: async () => {
      const res = await billsService.getBillStatistics({ startDate, endDate });
      return res.data;
    },
    staleTime: CACHE_TIME.BILLS_LIST,
    gcTime: GC_TIME.DEFAULT,
  });

  const dailyMap = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    if (query.data?.dailyTrends) {
      query.data.dailyTrends.forEach((d) => {
        map.set(d.date, { income: d.income, expense: d.expense });
      });
    }
    return map;
  }, [query.data]);

  return {
    dailyMap,
    statistics: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/**
 * 获取某天的账单列表（日收支明细用）
 */
export function useDailyBills(date: string | null) {
  const query = useQuery({
    queryKey: QUERY_KEYS.dailyBills(date || ''),
    queryFn: async () => {
      if (!date) return [];
      const res = await billsService.getBills({
        startDate: date,
        endDate: date,
        limit: 100,
        orderBy: 'date',
        orderDirection: 'desc',
      });
      return res.data || [];
    },
    enabled: !!date,
    staleTime: CACHE_TIME.BILL_DETAIL,
    gcTime: GC_TIME.DEFAULT,
  });

  return {
    bills: query.data ?? [],
    isLoading: query.isLoading,
  };
}

/**
 * 获取某年12个月的收支数据（月收支视图用）
 */
export function useMonthlyGridData(year: number) {
  const query = useQuery({
    queryKey: QUERY_KEYS.monthlyGrid(year),
    queryFn: async () => {
      const res = await billsService.getBillStatistics({
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        granularity: 'monthly',
      });
      return res.data;
    },
    staleTime: CACHE_TIME.STATISTICS,
    gcTime: GC_TIME.DEFAULT,
  });

  const monthlyData = useMemo(() => {
    if (!query.data?.monthlyTrends) return [];
    return query.data.monthlyTrends.map((t) => ({
      month: parseInt(t.month),
      income: t.income,
      expense: t.expense,
    }));
  }, [query.data]);

  return {
    monthlyData,
    statistics: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/**
 * 获取近5年的收支数据（年收支视图用）
 * 单次请求，前端按年聚合
 */
export function useYearlyGridData() {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 4;

  const query = useQuery({
    queryKey: QUERY_KEYS.yearlyGrid(startYear, currentYear),
    queryFn: async () => {
      const res = await billsService.getBillStatistics({
        startDate: `${startYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        granularity: 'monthly',
      });
      return res.data;
    },
    staleTime: CACHE_TIME.STATISTICS * 2, // 10min
    gcTime: GC_TIME.LONG,
  });

  // 按年聚合
  const yearlyData = useMemo(() => {
    const years: Array<{ year: number; income: number; expense: number }> = [];
    for (let y = startYear; y <= currentYear; y++) {
      years.push({ year: y, income: 0, expense: 0 });
    }

    if (query.data?.monthlyTrends) {
      query.data.monthlyTrends.forEach((t) => {
        const yearItem = years.find((y) => y.year === t.year);
        if (yearItem) {
          yearItem.income += t.income;
          yearItem.expense += t.expense;
        }
      });
    }

    return years;
  }, [query.data, startYear, currentYear]);

  // 获取某年的12月数据（从已缓存数据中提取）
  const getMonthlyDataForYear = (year: number) => {
    if (!query.data?.monthlyTrends) return [];
    return query.data.monthlyTrends
      .filter((t) => t.year === year)
      .map((t) => ({
        month: parseInt(t.month),
        income: t.income,
        expense: t.expense,
      }));
  };

  return {
    yearlyData,
    getMonthlyDataForYear,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
