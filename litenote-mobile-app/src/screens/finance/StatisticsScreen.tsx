/**
 * 统计分析页面 - Neo-Brutalism 风格
 * 描边过滤栏 + 描边统计卡片 + 描边图表 + Courier 数字
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, LineChart } from '../../components';
import { useToast, useStyles } from '../../hooks';
import { billsService } from '../../services';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';
import {
  getCurrentMonthRange,
  getLastMonthRange,
  getCurrentQuarterRange,
  getCurrentYearRange,
} from '../../utils/date';
import type {
  BillStatistics,
  CategoryStatistic,
} from '../../types/bill';

const StatisticsScreen: React.FC = () => {
  const { showError } = useToast();
  const styles = useStyles(createStyles);

  const [statistics, setStatistics] = useState<BillStatistics | null>(null);
  const [expenseCategoryStats, setExpenseCategoryStats] = useState<
    CategoryStatistic[]
  >([]);
  const [incomeCategoryStats, setIncomeCategoryStats] = useState<
    CategoryStatistic[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<
    'month' | 'lastMonth' | 'quarter' | 'year'
  >('month');

  // 加载统计数据
  const fetchStatistics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let dateRange: { startDate: string; endDate: string };

      switch (timeRange) {
        case 'month':
          dateRange = getCurrentMonthRange();
          break;
        case 'lastMonth':
          dateRange = getLastMonthRange();
          break;
        case 'quarter':
          dateRange = getCurrentQuarterRange();
          break;
        case 'year':
          dateRange = getCurrentYearRange();
          break;
        default:
          dateRange = getCurrentMonthRange();
      }

      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      const response = await billsService.getBillStatistics(params);
      if (response.success && response.data) {
        setStatistics(response.data);
        setExpenseCategoryStats(response.data.expenseCategoryStats || []);
        setIncomeCategoryStats(response.data.incomeCategoryStats || []);
      }
    } catch (error: any) {
      showError(error.message || '加载统计数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 支出分类颜色（暖色调）
  const getExpenseCategoryColor = (index: number): string => {
    const expenseColors = [
      '#FF6B6B', '#FF9F43', '#FFA07A', '#FFD93D', '#FF7675',
      '#FDCB6E', '#E17055', '#D63031', '#FD79A8', '#E84393',
    ];
    return expenseColors[index % expenseColors.length];
  };

  // 收入分类颜色（冷色调）
  const getIncomeCategoryColor = (index: number): string => {
    const incomeColors = [
      '#00B894', '#4ECDC4', '#45B7D1', '#74B9FF', '#A8E6CF',
      '#81ECEC', '#00CEC9', '#0984E3', '#6C5CE7', '#A29BFE',
    ];
    return incomeColors[index % incomeColors.length];
  };

  // 月度趋势数据
  const getMonthlyTrendData = () => {
    if (!statistics?.monthlyTrends) return [];
    return statistics.monthlyTrends.map(trend => ({
      label: trend.month,
      value: trend.expense,
    }));
  };

  useFocusEffect(
    useCallback(() => {
      fetchStatistics();
    }, [timeRange]),
  );

  const handleRefresh = () => {
    fetchStatistics(true);
  };

  const expensePercent = statistics
    ? ((statistics.totalExpense / (statistics.totalIncome || 1)) * 100).toFixed(1)
    : '0';

  return (
    <View style={styles.container}>
      {/* 时间范围选择器 */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['month', 'lastMonth', 'quarter', 'year'] as const).map((range) => {
            const labels = { month: '本月', lastMonth: '上月', quarter: '本季度', year: '本年度' };
            return (
              <TouchableOpacity
                key={range}
                style={[styles.filterBtn, timeRange === range && styles.filterBtnActive]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[styles.filterText, timeRange === range && styles.filterTextActive]}>
                  {labels[range]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={styles._colors.primary} />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : (
          <>
            {/* 统计概览与分类占比 */}
            <View style={styles.overviewCard}>
              {/* 饼图区域 */}
              {expenseCategoryStats.length > 0 &&
              statistics &&
              statistics.totalExpense > 0 ? (
                <View style={styles.chartWrapper}>
                  <View style={styles.chartWithLegend}>
                    <View style={styles.chartContainer}>
                      <PieChart
                        data={expenseCategoryStats.map((stat, index) => ({
                          value: stat.amount,
                          color: getExpenseCategoryColor(index),
                          label: `${stat.categoryIcon} ${stat.categoryName}`,
                        }))}
                        size={160}
                        innerRadius={0.6}
                        showLabels={false}
                        showLegend={false}
                      />
                      <View style={styles.chartCenterText}>
                        <Text style={styles.centerLabel}>总支出</Text>
                        <Text style={styles.centerValue}>
                          ¥{statistics.totalExpense.toFixed(0)}
                        </Text>
                      </View>
                    </View>
                    {/* 图例 */}
                    <View style={styles.legendContainer}>
                      {expenseCategoryStats.slice(0, 6).map((stat, index) => (
                        <View key={index} style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: getExpenseCategoryColor(index) },
                            ]}
                          />
                          <Text style={styles.legendIcon}>
                            {stat.categoryIcon}
                          </Text>
                          <Text style={styles.legendText}>
                            {stat.categoryName}
                          </Text>
                          <Text style={styles.legendValue}>
                            {stat.percentage}%
                          </Text>
                        </View>
                      ))}
                      {expenseCategoryStats.length > 6 && (
                        <Text style={styles.legendMore}>
                          还有{expenseCategoryStats.length - 6}个分类...
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.chartWrapper}>
                  <View style={styles.emptyChartContainer}>
                    <View style={styles.emptyChartIcon}>
                      <Text style={styles.emptyChartIconText}>📊</Text>
                    </View>
                    <Text style={styles.emptyChartTitle}>暂无支出数据</Text>
                    <Text style={styles.emptyChartSubtitle}>
                      开始记录您的支出，查看分类占比
                    </Text>
                  </View>
                </View>
              )}

              {/* 统计数据网格 */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, styles.incomeValue]}>
                    ¥{statistics?.totalIncome.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={styles.statLabel}>总收入</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, styles.expenseValue]}>
                    ¥{statistics?.totalExpense.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={styles.statLabel}>总支出</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    ¥{statistics?.balance.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={styles.statLabel}>结余</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{expensePercent}%</Text>
                  <Text style={styles.statLabel}>支出占比</Text>
                </View>
              </View>

              {/* 收入分类占比 */}
              <Text style={styles.sectionTitle}>💰 收入分类占比</Text>
              {incomeCategoryStats.length > 0 &&
              statistics &&
              statistics.totalIncome > 0 ? (
                <View style={styles.categoryList}>
                  {incomeCategoryStats.map((stat, index) => (
                    <View key={index} style={styles.categoryItem}>
                      <View style={styles.categoryLeft}>
                        <Text style={styles.categoryIcon}>
                          {stat.categoryIcon}
                        </Text>
                        <Text style={styles.categoryName}>
                          {stat.categoryName}
                        </Text>
                      </View>
                      <View style={styles.categoryBar}>
                        <View
                          style={[
                            styles.categoryProgress,
                            {
                              width: `${stat.percentage}%`,
                              backgroundColor: getIncomeCategoryColor(index),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.categoryPercent}>
                        {stat.percentage}%
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>暂无数据</Text>
              )}
            </View>

            {/* 月度趋势 */}
            <View style={styles.trendCard}>
              <Text style={styles.sectionTitle}>📈 月度趋势</Text>
              <LineChart
                data={getMonthlyTrendData()}
                height={200}
                showValues={false}
                showLabels={true}
                formatValue={value => `¥${(value / 1000).toFixed(1)}k`}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    filterBar: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: borderWidth.thin,
      borderBottomColor: colors.stroke,
    },
    filterBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.small,
      marginRight: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    filterBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.stroke,
    },
    filterText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '700',
    },
    filterTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    overviewCard: {
      margin: spacing.lg,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      ...shadow.small,
    },
    chartWrapper: {
      marginBottom: spacing.lg,
    },
    chartWithLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartContainer: {
      position: 'relative',
      width: 160,
      height: 160,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.lg,
    },
    chartCenterText: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    centerValue: {
      fontSize: 15,
      fontWeight: '800',
      fontFamily: 'Courier',
      color: colors.textPrimary,
    },
    legendContainer: {
      width: 130,
      justifyContent: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
      paddingVertical: spacing.xs,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: colors.stroke,
      marginRight: spacing.sm,
    },
    legendIcon: {
      fontSize: 12,
      marginRight: spacing.xs,
      width: 16,
      textAlign: 'center',
    },
    legendText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
      marginRight: spacing.xs,
    },
    legendValue: {
      fontSize: 12,
      fontWeight: '800',
      fontFamily: 'Courier',
      color: colors.primary,
      minWidth: 35,
      textAlign: 'right',
    },
    legendMore: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textTertiary,
      marginTop: spacing.xs,
    },
    emptyChartContainer: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyChartIcon: {
      width: 72,
      height: 72,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    emptyChartIconText: {
      fontSize: 32,
    },
    emptyChartTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    emptyChartSubtitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: spacing.lg,
      justifyContent: 'space-between',
    },
    statCard: {
      width: '48%',
      padding: spacing.md,
      backgroundColor: colors.background,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      marginBottom: spacing.sm,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      fontFamily: 'Courier',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    incomeValue: {
      color: colors.income,
    },
    expenseValue: {
      color: colors.expense,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textTertiary,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    categoryList: {
      marginTop: spacing.sm,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    categoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      width: 80,
    },
    categoryIcon: {
      fontSize: 16,
      marginRight: spacing.xs,
    },
    categoryName: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    categoryBar: {
      flex: 1,
      height: 10,
      backgroundColor: colors.background,
      borderRadius: borderRadius.small,
      borderWidth: 1,
      borderColor: colors.stroke,
      overflow: 'hidden',
      marginHorizontal: spacing.sm,
    },
    categoryProgress: {
      height: '100%',
      borderRadius: borderRadius.small,
    },
    categoryPercent: {
      width: 40,
      fontSize: 12,
      fontWeight: '800',
      fontFamily: 'Courier',
      color: colors.textSecondary,
      textAlign: 'right',
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textTertiary,
      textAlign: 'center',
      paddingVertical: spacing.xl,
    },
    trendCard: {
      margin: spacing.lg,
      padding: spacing.lg,
      marginBottom: 100,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      ...shadow.small,
    },
  }),
  _colors: colors,
});

export default StatisticsScreen;
