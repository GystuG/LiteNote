/**
 * 趋势分析屏幕 - Neo-Brutalism 风格
 * 描边周期/类型切换 + 描边图表卡片 + 描边统计卡片 + Courier 数字
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { SegmentedControl } from '../../components/ui';
import { BarChart } from '../../components/charts';
import { useStyles } from '../../hooks';
import { billsService } from '../../services';

type PeriodType = 'week' | 'month' | 'year';
type DataType = 'expense' | 'income' | 'balance';

const periodOptions = [
  { key: 'week', label: '周' },
  { key: 'month', label: '月' },
  { key: 'year', label: '年' },
];

const dataTypeOptions = [
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
  { key: 'balance', label: '结余' },
];

interface TrendDataPoint {
  label: string;
  value: number;
}

export default function TrendAnalysisScreen() {
  const styles = useStyles(createStyles);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [dataType, setDataType] = useState<DataType>('expense');
  const [refreshing, setRefreshing] = useState(false);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [averageValue, setAverageValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
  const [minValue, setMinValue] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const today = new Date();
      let dataPoints: TrendDataPoint[] = [];

      switch (period) {
        case 'week':
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const stats = await billsService.getBillStatistics({
              startDate: dateStr,
              endDate: dateStr,
            });
            let value = 0;
            if (stats.success && stats.data) {
              if (dataType === 'expense') value = stats.data.totalExpense || 0;
              else if (dataType === 'income') value = stats.data.totalIncome || 0;
              else value = (stats.data.totalIncome || 0) - (stats.data.totalExpense || 0);
            }
            dataPoints.push({
              label: `${date.getMonth() + 1}/${date.getDate()}`,
              value,
            });
          }
          break;

        case 'month':
          for (let i = 3; i >= 0; i--) {
            const endDate = new Date(today);
            endDate.setDate(today.getDate() - i * 7);
            const startDateWeek = new Date(endDate);
            startDateWeek.setDate(endDate.getDate() - 6);

            const stats = await billsService.getBillStatistics({
              startDate: startDateWeek.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            });

            let value = 0;
            if (stats.success && stats.data) {
              if (dataType === 'expense') value = stats.data.totalExpense || 0;
              else if (dataType === 'income') value = stats.data.totalIncome || 0;
              else value = (stats.data.totalIncome || 0) - (stats.data.totalExpense || 0);
            }

            dataPoints.push({
              label: `第${4 - i}周`,
              value,
            });
          }
          break;

        case 'year':
          for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

            const stats = await billsService.getBillStatistics({
              startDate: monthDate.toISOString().split('T')[0],
              endDate: nextMonth.toISOString().split('T')[0],
            });

            let value = 0;
            if (stats.success && stats.data) {
              if (dataType === 'expense') value = stats.data.totalExpense || 0;
              else if (dataType === 'income') value = stats.data.totalIncome || 0;
              else value = (stats.data.totalIncome || 0) - (stats.data.totalExpense || 0);
            }

            dataPoints.push({
              label: `${monthDate.getMonth() + 1}月`,
              value,
            });
          }
          break;
      }

      setTrendData(dataPoints);

      const values = dataPoints.map(d => d.value);
      const sum = values.reduce((a, b) => a + b, 0);
      setAverageValue(values.length > 0 ? sum / values.length : 0);
      setMaxValue(Math.max(...values, 0));
      setMinValue(Math.min(...values, 0));
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    }
  }, [period, dataType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getChartColor = () => {
    switch (dataType) {
      case 'expense':
        return styles._colors.expense;
      case 'income':
        return styles._colors.income;
      default:
        return styles._colors.primary;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 时间周期选择 */}
      <SegmentedControl
        options={periodOptions}
        selectedKey={period}
        onSelect={(key) => setPeriod(key as PeriodType)}
        style={styles.segmentedControl}
      />

      {/* 数据类型选择 */}
      <SegmentedControl
        options={dataTypeOptions}
        selectedKey={dataType}
        onSelect={(key) => setDataType(key as DataType)}
        style={styles.segmentedControl}
      />

      {/* 趋势图表 */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>
          {dataType === 'expense' ? '📉 支出趋势' : dataType === 'income' ? '📈 收入趋势' : '💰 结余趋势'}
        </Text>
        {trendData.length > 0 ? (
          <View style={styles.chartWrapper}>
            <BarChart
              data={trendData}
              width={300}
              height={200}
              barColor={getChartColor()}
            />
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>暂无数据</Text>
          </View>
        )}
      </View>

      {/* 统计卡片 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>平均</Text>
          <Text style={[styles.statValue, { color: getChartColor() }]}>
            ¥{averageValue.toFixed(0)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>最高</Text>
          <Text style={[styles.statValue, { color: getChartColor() }]}>
            ¥{maxValue.toFixed(0)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>最低</Text>
          <Text style={[styles.statValue, { color: getChartColor() }]}>
            ¥{minValue.toFixed(0)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxxl,
    },
    segmentedControl: {
      marginBottom: spacing.md,
    },
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...shadow.small,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    chartWrapper: {
      alignItems: 'center',
    },
    emptyChart: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textTertiary,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.md,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textTertiary,
      marginBottom: spacing.xs,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
      fontFamily: 'Courier',
    },
  }),
  _colors: colors,
});
