/**
 * MonthGrid - 4x3 月份网格（月收支用）
 * 每格显示月份 + 当月净额
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import GridCell from './GridCell';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLS = 4;
const GAP = spacing.sm;

interface MonthGridProps {
  year: number;
  monthlyData: Array<{ month: number; income: number; expense: number }>;
  selectedMonth: number | null;
  onMonthPress: (month: number) => void;
}

export default function MonthGrid({
  year,
  monthlyData,
  selectedMonth,
  onMonthPress,
}: MonthGridProps) {
  const styles = useStyles(createStyles);
  const cellWidth = (SCREEN_WIDTH - spacing.lg * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS;
  const cellHeight = cellWidth * 0.75;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const data = monthlyData.find((m) => m.month === monthNum);
      const income = data?.income ?? 0;
      const expense = data?.expense ?? 0;
      const isFuture = year > currentYear || (year === currentYear && monthNum > currentMonth);
      return { monthNum, income, expense, isFuture };
    });
  }, [year, monthlyData, currentYear, currentMonth]);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {months.map(({ monthNum, income, expense, isFuture }) => (
          <View key={monthNum} style={{ marginRight: monthNum % NUM_COLS === 0 ? 0 : GAP, marginBottom: GAP }}>
            <GridCell
              label={`${monthNum}月`}
              income={isFuture ? 0 : income}
              expense={isFuture ? 0 : expense}
              isSelected={selectedMonth === monthNum}
              isCurrentPeriod={year === currentYear && monthNum === currentMonth}
              disabled={isFuture}
              onPress={() => onMonthPress(monthNum)}
              width={cellWidth}
              height={cellHeight}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
  }),
  _colors: colors,
});
