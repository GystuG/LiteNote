/**
 * MonthlySummaryList - 每月收支汇总列表
 * 在年收支视图中，点击某年后展示该年12个月的收支
 */
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';

interface MonthSummary {
  month: number;
  income: number;
  expense: number;
}

interface MonthlySummaryListProps {
  data: MonthSummary[];
  onMonthPress: (month: number) => void;
}

export default function MonthlySummaryList({ data, onMonthPress }: MonthlySummaryListProps) {
  const styles = useStyles(createStyles);

  const renderItem = ({ item }: { item: MonthSummary }) => {
    const net = item.income - item.expense;
    const hasData = item.income > 0 || item.expense > 0;

    return (
      <TouchableOpacity
        style={[styles.row, !hasData && { opacity: 0.5 }]}
        onPress={() => onMonthPress(item.month)}
        activeOpacity={0.7}
        disabled={!hasData}
      >
        <Text style={styles.monthText}>{item.month}月</Text>
        <View style={styles.amounts}>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>收入</Text>
            <Text style={styles.incomeText}>
              {item.income > 0 ? `+${item.income.toFixed(2)}` : '0.00'}
            </Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>支出</Text>
            <Text style={styles.expenseText}>
              {item.expense > 0 ? `-${item.expense.toFixed(2)}` : '0.00'}
            </Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>结余</Text>
            <Text
              style={[
                styles.netText,
                { color: net >= 0 ? styles._colors.income : styles._colors.expense },
              ]}
            >
              {net >= 0 ? '+' : ''}{net.toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => String(item.month)}
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
    monthText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      width: 40,
    },
    amounts: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
      justifyContent: 'flex-end',
    },
    amountCol: {
      alignItems: 'flex-end',
      minWidth: 70,
    },
    amountLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textTertiary,
      marginBottom: 2,
    },
    incomeText: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Courier',
      color: colors.income,
    },
    expenseText: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Courier',
      color: colors.expense,
    },
    netText: {
      fontSize: 13,
      fontWeight: '800',
      fontFamily: 'Courier',
    },
  }),
  _colors: colors,
});
