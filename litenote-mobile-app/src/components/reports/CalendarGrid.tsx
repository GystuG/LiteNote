/**
 * CalendarGrid - 7列日历网格（日收支用）
 * 每格显示日期 + 当日净额，支持选中状态
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import GridCell from './GridCell';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  dailyData: Map<string, { income: number; expense: number }>;
  selectedDay: string | null;
  onDayPress: (dateStr: string) => void;
}

const GAP = 3;

export default function CalendarGrid({
  year,
  month,
  dailyData,
  selectedDay,
  onDayPress,
}: CalendarGridProps) {
  const styles = useStyles(createStyles);
  const cellSize = (SCREEN_WIDTH - spacing.lg * 2 - GAP * 6) / 7;

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const cells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // 获取该月1号是星期几 (0=周日, 1=周一, ..., 6=周六)
    let firstDayWeekday = new Date(year, month, 1).getDay();
    // 转换为周一起始 (周一=0, 周二=1, ..., 周日=6)
    const offset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

    const result: Array<{
      key: string;
      day: number | null;
      dateStr: string | null;
    }> = [];

    // 前置空格
    for (let i = 0; i < offset; i++) {
      result.push({ key: `empty-${i}`, day: null, dateStr: null });
    }

    // 日期格子
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push({ key: dateStr, day: d, dateStr });
    }

    return result;
  }, [year, month]);

  return (
    <View style={styles.container}>
      {/* 星期表头 */}
      <View style={styles.header}>
        {WEEK_DAYS.map((day) => (
          <View key={day} style={[styles.headerCell, { width: cellSize }]}>
            <Text style={styles.headerText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 日期网格 */}
      <View style={styles.grid}>
        {cells.map((cell) => {
          if (cell.day === null) {
            return <View key={cell.key} style={{ width: cellSize, height: cellSize }} />;
          }

          const data = dailyData.get(cell.dateStr!);
          const income = data?.income ?? 0;
          const expense = data?.expense ?? 0;
          const isFuture = cell.dateStr! > today;

          return (
            <GridCell
              key={cell.key}
              label={String(cell.day)}
              income={isFuture ? 0 : income}
              expense={isFuture ? 0 : expense}
              isSelected={selectedDay === cell.dateStr}
              isCurrentPeriod={cell.dateStr === today}
              disabled={isFuture}
              onPress={() => onDayPress(cell.dateStr!)}
              width={cellSize}
              height={cellSize}
            />
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      marginBottom: spacing.xs,
      gap: GAP,
    },
    headerCell: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    headerText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textTertiary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP,
    },
  }),
  _colors: colors,
});
