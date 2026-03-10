/**
 * YearlyView - 年收支视图
 * 近5年网格 + 点击某年展示12月汇总 + 点击某月跳转月收支
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import { useYearlyGridData } from '../../hooks/useIncomeExpenseData';
import { YearGrid, MonthlySummaryList } from '../../components/reports';

interface YearlyViewProps {
  onJumpToMonthly?: (year: number, month?: number) => void;
}

export default function YearlyView({ onJumpToMonthly }: YearlyViewProps) {
  const styles = useStyles(createStyles);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { yearlyData, getMonthlyDataForYear, isLoading, refetch } = useYearlyGridData();

  const handleYearPress = (year: number) => {
    setSelectedYear(selectedYear === year ? null : year);
  };

  const handleMonthPress = (month: number) => {
    if (onJumpToMonthly && selectedYear) {
      onJumpToMonthly(selectedYear, month);
    }
  };

  // 补全选中年的12个月数据
  const fullMonthlyData = React.useMemo(() => {
    const monthlyForYear = selectedYear ? getMonthlyDataForYear(selectedYear) : [];
    const result = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
    }));
    monthlyForYear.forEach((m) => {
      const item = result.find((r) => r.month === m.month);
      if (item) {
        item.income = m.income;
        item.expense = m.expense;
      }
    });
    return result;
  }, [selectedYear, getMonthlyDataForYear]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>近5年收支</Text>
      </View>

      <YearGrid
        years={yearlyData}
        selectedYear={selectedYear}
        onYearPress={handleYearPress}
      />

      {/* 选中年的12月汇总 */}
      {selectedYear && (
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>
            {selectedYear}年 每月收支
          </Text>
          <MonthlySummaryList
            data={fullMonthlyData}
            onMonthPress={handleMonthPress}
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
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
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
