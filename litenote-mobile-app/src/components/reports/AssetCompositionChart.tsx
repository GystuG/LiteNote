/**
 * AssetCompositionChart - 收支分类构成饼图
 * 展示近12月的收入/支出按分类的构成比例
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import type { CategoryStatistic } from '../../types/bill';

const PIE_COLORS = [
  '#0052FF', '#FF6B35', '#00C853', '#FF3D00',
  '#7C4DFF', '#FFB300', '#00BCD4', '#E91E63',
  '#8BC34A', '#795548', '#607D8B', '#9C27B0',
];

const formatAmount = (val: number) => {
  if (Math.abs(val) >= 10000) {
    return `¥${(val / 10000).toFixed(1)}w`;
  }
  return `¥${val.toFixed(0)}`;
};

interface CategoryPieProps {
  title: string;
  data: CategoryStatistic[];
  dateRange?: string;
}

function CategoryPie({ title, data, dateRange }: CategoryPieProps) {
  const styles = useStyles(createStyles);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  if (total === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {dateRange && <Text style={styles.dateRange}>{dateRange}</Text>}
        </View>
        <View style={styles.emptyBody}>
          <Text style={styles.emptyText}>暂无数据</Text>
        </View>
      </View>
    );
  }

  const pieData = data.map((d, i) => ({
    value: d.amount,
    color: PIE_COLORS[i % PIE_COLORS.length],
    text: d.percentage >= 5 ? `${d.percentage.toFixed(0)}%` : '',
    textColor: '#FFFFFF',
    textSize: 10,
    onPress: () => setFocusedIndex(focusedIndex === i ? -1 : i),
  }));

  const focused = focusedIndex >= 0 && focusedIndex < data.length ? data[focusedIndex] : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {dateRange && <Text style={styles.dateRange}>{dateRange}</Text>}
      </View>
      <View style={styles.chartRow}>
        <PieChart
          data={pieData}
          donut
          innerRadius={40}
          radius={62}
          innerCircleColor={styles._colors.surface}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              {focused ? (
                <>
                  <Text style={styles.centerIcon}>{focused.categoryIcon}</Text>
                  <Text style={styles.centerAmount}>{formatAmount(focused.amount)}</Text>
                  <Text style={styles.centerText}>{focused.categoryName}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.centerAmount}>{formatAmount(total)}</Text>
                  <Text style={styles.centerText}>总计</Text>
                </>
              )}
            </View>
          )}
          focusOnPress
          isAnimated
          animationDuration={600}
        />
        <ScrollView
          style={styles.legendScroll}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {data.map((d, i) => (
            <View key={d.categoryId} style={styles.legendItem}>
              <View style={[
                styles.legendDot,
                { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] },
              ]} />
              <Text style={styles.legendIcon}>{d.categoryIcon}</Text>
              <Text style={styles.legendLabel} numberOfLines={1}>{d.categoryName}</Text>
              <View style={styles.legendValues}>
                <Text style={styles.legendAmount}>{formatAmount(d.amount)}</Text>
                <Text style={styles.legendPct}>{d.percentage.toFixed(0)}%</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

interface AssetCompositionChartProps {
  incomeCategoryStats: CategoryStatistic[];
  expenseCategoryStats: CategoryStatistic[];
  dateRange?: string;
}

export default function AssetCompositionChart({
  incomeCategoryStats,
  expenseCategoryStats,
  dateRange,
}: AssetCompositionChartProps) {
  return (
    <View>
      <CategoryPie title="近12月支出类型构成" data={expenseCategoryStats} dateRange={dateRange} />
      <CategoryPie title="近12月收入类型构成" data={incomeCategoryStats} dateRange={dateRange} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.lg,
      ...shadow.small,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    dateRange: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    chartRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    centerLabel: {
      alignItems: 'center',
    },
    centerIcon: {
      fontSize: 16,
      marginBottom: 2,
    },
    centerAmount: {
      fontSize: 13,
      fontWeight: '800',
      fontFamily: 'Courier',
      color: colors.textPrimary,
    },
    centerText: {
      fontSize: 9,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    legendScroll: {
      flex: 1,
      marginLeft: spacing.xl,
      maxHeight: 160,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.xs,
    },
    legendIcon: {
      fontSize: 14,
      marginRight: 4,
    },
    legendLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      flex: 1,
    },
    legendValues: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendAmount: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Courier',
      color: colors.textPrimary,
      marginRight: 6,
    },
    legendPct: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    emptyBody: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textTertiary,
    },
  }),
  _colors: colors,
});
