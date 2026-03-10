/**
 * AssetsTab - 资产页签
 * 总资产(收入-支出) + 资产趋势折线图 + 收支构成饼图
 */
import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import { useAssetsData } from '../../hooks/useAssetsData';
import { AssetTrendChart } from '../../components/reports';
import AssetCompositionChart from '../../components/reports/AssetCompositionChart';

export default function AssetsTab() {
  const styles = useStyles(createStyles);
  const { netWorth, totalIncome, totalExpense, assetTrendData, trendDateRange, incomeCategoryStats, expenseCategoryStats, isLoading, refetch } = useAssetsData();

  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 10000) {
      return `¥${(val / 10000).toFixed(2)}万`;
    }
    return `¥${val.toFixed(2)}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 总资产卡片 */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>净资产（收入 - 支出）</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(netWorth)}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>总收入</Text>
            <Text style={[styles.balanceItemValue, { color: '#4ADE80' }]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>总支出</Text>
            <Text style={[styles.balanceItemValue, { color: '#F87171' }]}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* 资产趋势折线图 */}
      <AssetTrendChart data={assetTrendData} dateRange={trendDateRange} />

      {/* 收支分类构成饼图 */}
      <AssetCompositionChart
        incomeCategoryStats={incomeCategoryStats}
        expenseCategoryStats={expenseCategoryStats}
        dateRange={trendDateRange}
      />

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
    },
    balanceCard: {
      margin: spacing.lg,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.xl,
      ...shadow.medium,
    },
    balanceLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
      opacity: 0.8,
    },
    balanceAmount: {
      fontSize: 32,
      fontWeight: '900',
      fontFamily: 'Courier',
      color: '#FFFFFF',
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    balanceItem: {
      flex: 1,
    },
    balanceDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255,255,255,0.3)',
      marginHorizontal: spacing.md,
    },
    balanceItemLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
      opacity: 0.7,
      marginBottom: 4,
    },
    balanceItemValue: {
      fontSize: 16,
      fontWeight: '800',
      fontFamily: 'Courier',
    },
  }),
  _colors: colors,
});
