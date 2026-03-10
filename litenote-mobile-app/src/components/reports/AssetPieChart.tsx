/**
 * AssetPieChart - 资产构成饼图
 * 使用 react-native-gifted-charts 展示按账户类型的资产构成
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import type { AccountType } from '../../types/account';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank_card: '银行卡',
  e_wallet: '电子钱包',
  credit_card: '信用卡',
  cash: '现金',
};

interface AssetPieChartProps {
  data: Array<{ type: AccountType; balance: number; name: string }>;
}

export default function AssetPieChart({ data }: AssetPieChartProps) {
  const styles = useStyles(createStyles);

  const getColor = (type: AccountType) => {
    switch (type) {
      case 'bank_card': return styles._colors.primary;
      case 'e_wallet': return styles._colors.secondary;
      case 'credit_card': return styles._colors.warning;
      case 'cash': return styles._colors.success;
      default: return styles._colors.textTertiary;
    }
  };

  // 按类型分组汇总
  const grouped = data.reduce((acc, item) => {
    const existing = acc.find((a) => a.type === item.type);
    if (existing) {
      existing.value += Math.abs(item.balance);
    } else {
      acc.push({ type: item.type, value: Math.abs(item.balance) });
    }
    return acc;
  }, [] as Array<{ type: AccountType; value: number }>);

  const total = grouped.reduce((sum, g) => sum + g.value, 0);

  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无资产数据</Text>
      </View>
    );
  }

  const pieData = grouped.map((g) => ({
    value: g.value,
    color: getColor(g.type),
    text: `${((g.value / total) * 100).toFixed(0)}%`,
    textColor: '#FFFFFF',
    textSize: 11,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>资产构成</Text>
      <View style={styles.chartRow}>
        <PieChart
          data={pieData}
          donut
          innerRadius={45}
          radius={70}
          innerCircleColor={styles._colors.surface}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={styles.centerAmount}>
                {total >= 10000
                  ? `${(total / 10000).toFixed(1)}w`
                  : total.toFixed(0)}
              </Text>
              <Text style={styles.centerText}>总计</Text>
            </View>
          )}
          isAnimated
          animationDuration={600}
        />
        <View style={styles.legend}>
          {grouped.map((g) => (
            <View key={g.type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getColor(g.type) }]} />
              <Text style={styles.legendLabel}>{ACCOUNT_TYPE_LABELS[g.type]}</Text>
              <Text style={styles.legendValue}>
                ¥{g.value.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
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
      marginBottom: spacing.lg,
    },
    chartRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    centerLabel: {
      alignItems: 'center',
    },
    centerAmount: {
      fontSize: 14,
      fontWeight: '800',
      fontFamily: 'Courier',
      color: colors.textPrimary,
    },
    centerText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    legend: {
      flex: 1,
      marginLeft: spacing.xl,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: colors.stroke,
      marginRight: spacing.sm,
    },
    legendLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      flex: 1,
    },
    legendValue: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Courier',
      color: colors.textPrimary,
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
