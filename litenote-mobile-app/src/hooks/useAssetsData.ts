/**
 * useAssetsData - 资产 Tab 数据 hook
 * 总资产 = 全部收入总和 - 全部支出总和（基于账单记录）
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { billsService } from '../services/api/bills';
import { QUERY_KEYS, CACHE_TIME, GC_TIME } from '../lib/queryClient';

export function useAssetsData() {
  const currentYear = new Date().getFullYear();

  // 获取全部收支统计（不限日期，得到总资产）
  const totalQuery = useQuery({
    queryKey: ['total-assets'],
    queryFn: async () => {
      const res = await billsService.getBillStatistics({});
      return res.data ?? { totalIncome: 0, totalExpense: 0, balance: 0 };
    },
    staleTime: CACHE_TIME.DASHBOARD,
    gcTime: GC_TIME.DEFAULT,
  });

  // 获取近12月统计（趋势折线图用）
  const trendQuery = useQuery({
    queryKey: QUERY_KEYS.assetTrend(currentYear),
    queryFn: async () => {
      const now = new Date();
      const startMonth = now.getMonth() + 2;
      const startDate = `${currentYear - 1}-${String(startMonth > 12 ? startMonth - 12 : startMonth).padStart(2, '0')}-01`;
      const endDay = new Date(currentYear, now.getMonth() + 1, 0).getDate();
      const endDate = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
      const res = await billsService.getBillStatistics({
        startDate,
        endDate,
        granularity: 'monthly',
      });
      return res.data ?? { monthlyTrends: [], totalIncome: 0, totalExpense: 0 };
    },
    staleTime: CACHE_TIME.STATISTICS,
    gcTime: GC_TIME.DEFAULT,
  });

  // 总资产 = 全部收入 - 全部支出
  const netWorth = (totalQuery.data?.totalIncome ?? 0) - (totalQuery.data?.totalExpense ?? 0);
  const totalIncome = totalQuery.data?.totalIncome ?? 0;
  const totalExpense = totalQuery.data?.totalExpense ?? 0;

  // 计算资产趋势折线图数据（逐月累计）
  const assetTrendData = useMemo(() => {
    if (!trendQuery.data?.monthlyTrends) return [];

    const trends = trendQuery.data.monthlyTrends;
    const totalNetInRange = trends.reduce((sum, t) => sum + (t.income - t.expense), 0);

    // 从后往前反推每月末的累计资产
    let cumulative = 0;
    return trends.map((t) => {
      cumulative += t.income - t.expense;
      return {
        month: t.month,
        value: Math.round((netWorth - totalNetInRange + cumulative) * 100) / 100,
      };
    });
  }, [trendQuery.data, netWorth]);

  // 收入/支出分类构成（用于饼图）
  const incomeCategoryStats = trendQuery.data?.incomeCategoryStats ?? [];
  const expenseCategoryStats = trendQuery.data?.expenseCategoryStats ?? [];

  // 趋势图日期范围描述
  const trendDateRange = useMemo(() => {
    const now = new Date();
    const startMonth = now.getMonth() + 2;
    const startY = currentYear - 1;
    const startM = startMonth > 12 ? startMonth - 12 : startMonth;
    return `${startY}.${startM} - ${currentYear}.${now.getMonth() + 1}`;
  }, [currentYear]);

  return {
    netWorth,
    totalIncome,
    totalExpense,
    assetTrendData,
    trendDateRange,
    incomeCategoryStats,
    expenseCategoryStats,
    isLoading: totalQuery.isLoading || trendQuery.isLoading,
    refetch: () => {
      totalQuery.refetch();
      trendQuery.refetch();
    },
  };
}
