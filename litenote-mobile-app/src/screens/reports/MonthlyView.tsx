/**
 * MonthlyView - 月收支视图
 * 12个月网格 + 点击某月展示每日汇总 + 点击某天跳转日收支
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import { useMonthlyGridData, useDailyGridData } from '../../hooks/useIncomeExpenseData';
import { MonthGrid, PeriodNavigator, DailySummaryList } from '../../components/reports';

interface MonthlyViewProps {
  initialYear?: number;
  initialSelectedMonth?: number | null;
  onJumpToDaily?: (year: number, month: number, day?: string) => void;
}

export default function MonthlyView({
  initialYear,
  initialSelectedMonth = null,
  onJumpToDaily,
}: MonthlyViewProps) {
  const styles = useStyles(createStyles);
  const now = new Date();

  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(initialSelectedMonth);

  // 当外部初始值变化时更新
  useEffect(() => {
    if (initialYear !== undefined) setYear(initialYear);
    if (initialSelectedMonth !== undefined) setSelectedMonth(initialSelectedMonth);
  }, [initialYear, initialSelectedMonth]);

  const { monthlyData, isLoading, refetch } = useMonthlyGridData(year);

  // 当选中月份时，获取该月每日数据
  const { dailyMap } = useDailyGridData(
    year,
    selectedMonth ? selectedMonth - 1 : 0,
  );

  const isNextDisabled = year >= now.getFullYear();

  const handlePrev = () => {
    setYear(year - 1);
    setSelectedMonth(null);
  };

  const handleNext = () => {
    setYear(year + 1);
    setSelectedMonth(null);
  };

  const handleMonthPress = (month: number) => {
    setSelectedMonth(selectedMonth === month ? null : month);
  };

  const handleDayPress = (dateStr: string) => {
    if (onJumpToDaily) {
      const parts = dateStr.split('-');
      onJumpToDaily(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, dateStr);
    }
  };

  // 将 dailyMap 转换为 DailySummaryList 需要的数组格式
  const dailySummaryData = React.useMemo(() => {
    if (!selectedMonth) return [];
    const result: Array<{ date: string; income: number; expense: number }> = [];
    dailyMap.forEach((value, key) => {
      result.push({ date: key, ...value });
    });
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyMap, selectedMonth]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      showsVerticalScrollIndicator={false}
    >
      <PeriodNavigator
        title={`${year}年`}
        onPrev={handlePrev}
        onNext={handleNext}
        disableNext={isNextDisabled}
      />

      <MonthGrid
        year={year}
        monthlyData={monthlyData}
        selectedMonth={selectedMonth}
        onMonthPress={handleMonthPress}
      />

      {/* 选中月的每日汇总 */}
      {selectedMonth && (
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>
            {year}年{selectedMonth}月 每日收支
          </Text>
          <DailySummaryList
            data={dailySummaryData}
            onDayPress={handleDayPress}
          />
        </View>
      )}

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
    },
    detailSection: {
      marginTop: spacing.lg,
    },
    detailTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
  }),
  _colors: colors,
});
