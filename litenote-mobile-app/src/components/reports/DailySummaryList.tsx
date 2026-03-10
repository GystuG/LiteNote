/**
 * DailySummaryList - 每日收支汇总列表
 * 在月收支视图中，点击某月后展示该月每天的收支
 */
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';

interface DaySummary {
  date: string;
  income: number;
  expense: number;
}

interface DailySummaryListProps {
  data: DaySummary[];
  onDayPress: (dateStr: string) => void;
}

export default function DailySummaryList({ data, onDayPress }: DailySummaryListProps) {
  const styles = useStyles(createStyles);

  // 只展示有数据的天
  const filtered = data.filter((d) => d.income > 0 || d.expense > 0);

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  };

  const renderItem = ({ item }: { item: DaySummary }) => {
    const net = item.income - item.expense;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => onDayPress(item.date)}
        activeOpacity={0.7}
      >
        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        <View style={styles.amounts}>
          {item.income > 0 && (
            <Text style={styles.incomeText}>+{item.income.toFixed(2)}</Text>
          )}
          {item.expense > 0 && (
            <Text style={styles.expenseText}>-{item.expense.toFixed(2)}</Text>
          )}
          <Text
            style={[
              styles.netText,
              { color: net >= 0 ? styles._colors.income : styles._colors.expense },
            ]}
          >
            {net >= 0 ? '+' : ''}{net.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (filtered.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>该月暂无收支记录</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      renderItem={renderItem}
      keyExtractor={(item) => item.date}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
    />
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    list: {
      paddingHorizontal: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      ...shadow.small,
    },
    dateText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    amounts: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    incomeText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: 'Courier',
      color: colors.income,
    },
    expenseText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: 'Courier',
      color: colors.expense,
    },
    netText: {
      fontSize: 14,
      fontWeight: '800',
      fontFamily: 'Courier',
      minWidth: 80,
      textAlign: 'right',
    },
    empty: {
      padding: spacing.xxxl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textTertiary,
    },
  }),
  _colors: colors,
});
