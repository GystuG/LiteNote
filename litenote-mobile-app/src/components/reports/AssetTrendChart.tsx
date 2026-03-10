/**
 * AssetTrendChart - 资产趋势折线图
 * 使用 react-native-gifted-charts 展示近12月资产变动
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';

interface AssetTrendChartProps {
  data: Array<{ month: string; value: number }>;
  dateRange?: string;
}

export default function AssetTrendChart({ data, dateRange }: AssetTrendChartProps) {
  const styles = useStyles(createStyles);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无资产变动数据</Text>
      </View>
    );
  }

  const chartData = data.map((d) => ({
    value: d.value,
    label: d.month,
    labelTextStyle: {
      color: styles._colors.textTertiary,
      fontSize: 10,
      fontWeight: '600' as const,
    },
  }));

  const minVal = Math.min(...data.map((d) => d.value), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>资产变动趋势</Text>
        {dateRange && <Text style={styles.dateRange}>{dateRange}</Text>}
      </View>
      <View style={styles.chartWrap}>
        <LineChart
          data={chartData}
          width={280}
          height={160}
          spacing={Math.max(280 / (data.length || 1), 30)}
          color={styles._colors.expense}
          thickness={3}
          startFillColor={styles._colors.expense + '30'}
          endFillColor={styles._colors.expense + '05'}
          startOpacity={0.3}
          endOpacity={0.05}
          areaChart
          curved
          dataPointsColor={styles._colors.expense}
          dataPointsRadius={4}
          yAxisColor={styles._colors.divider}
          xAxisColor={styles._colors.divider}
          yAxisTextStyle={{
            color: styles._colors.textTertiary,
            fontSize: 10,
            fontFamily: 'Courier',
          }}
          hideRules
          noOfSections={4}
          yAxisOffset={minVal < 0 ? minVal : 0}
          isAnimated
          animationDuration={600}
        />
      </View>
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
    title: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    dateRange: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    chartWrap: {
      alignItems: 'center',
      overflow: 'hidden',
    },
    emptyContainer: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
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
