/**
 * 分类分析屏幕 - Neo-Brutalism 风格
 * 描边类型切换 + 描边总额卡片 + 描边分类列表 + Courier 数字
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { SegmentedControl, ProgressBar } from '../../components/ui';
import { useStyles } from '../../hooks';
import { billsService } from '../../services';

type TypeFilter = 'expense' | 'income';

const typeOptions = [
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
];

interface CategoryStat {
  name: string;
  icon?: string;
  amount: number;
  percentage: number;
  count: number;
}

export default function CategoryAnalysisScreen() {
  const styles = useStyles(createStyles);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('expense');
  const [refreshing, setRefreshing] = useState(false);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const stats = await billsService.getBillStatistics({
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      });

      if (stats.success && stats.data) {
        const categoryStats = typeFilter === 'expense'
          ? stats.data.expenseCategoryStats
          : stats.data.incomeCategoryStats;

        if (categoryStats && categoryStats.length > 0) {
          const sorted = [...categoryStats].sort((a, b) => Number(b.amount) - Number(a.amount));
          const total = sorted.reduce((sum: number, cat) => sum + Number(cat.amount), 0);
          setTotalAmount(total);

          const processed = sorted.map((cat) => ({
            name: cat.categoryName,
            icon: cat.categoryIcon,
            amount: Number(cat.amount),
            percentage: cat.percentage,
            count: cat.count || 0,
          }));

          setCategoryStats(processed);
        } else {
          setCategoryStats([]);
          setTotalAmount(0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch category analysis:', error);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getCategoryColor = (index: number) => {
    const categoryColors = [
      '#FF6B6B', '#FFD93D', '#7EB6FF', '#7DCEA0', '#C5A3FF', '#FFB366',
    ];
    return categoryColors[index % categoryColors.length];
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 类型选择器 */}
      <SegmentedControl
        options={typeOptions}
        selectedKey={typeFilter}
        onSelect={(key) => setTypeFilter(key as TypeFilter)}
        style={styles.segmentedControl}
      />

      {/* 总额 */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>
          {typeFilter === 'expense' ? '💸 总支出' : '💰 总收入'}
        </Text>
        <Text style={[
          styles.totalValue,
          { color: typeFilter === 'expense' ? styles._colors.expense : styles._colors.income },
        ]}>
          ¥{totalAmount.toFixed(2)}
        </Text>
      </View>

      {/* 分类列表 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 分类明细</Text>

        {categoryStats.length > 0 ? (
          categoryStats.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryIconBlock}>
                    <Text style={styles.categoryIcon}>
                      {category.icon || (typeFilter === 'expense' ? '💸' : '💰')}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>{category.count}笔</Text>
                  </View>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={styles.amountValue}>¥{category.amount.toFixed(2)}</Text>
                  <Text style={styles.percentageValue}>{category.percentage.toFixed(1)}%</Text>
                </View>
              </View>
              <ProgressBar
                progress={category.percentage}
                color={getCategoryColor(index)}
                height={8}
              />
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>暂无数据</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxxl,
    },
    segmentedControl: {
      marginBottom: spacing.lg,
    },
    totalCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.lg,
      ...shadow.small,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textTertiary,
      marginBottom: spacing.sm,
    },
    totalValue: {
      fontSize: 32,
      fontWeight: '800',
      fontFamily: 'Courier',
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    categoryItem: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryIconBlock: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    categoryIcon: {
      fontSize: 20,
    },
    categoryName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    categoryCount: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Courier',
      color: colors.textTertiary,
    },
    categoryAmount: {
      alignItems: 'flex-end',
    },
    amountValue: {
      fontSize: 16,
      fontWeight: '800',
      fontFamily: 'Courier',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    percentageValue: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Courier',
      color: colors.textTertiary,
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.xxl,
      alignItems: 'center',
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textTertiary,
    },
  }),
  _colors: colors,
});
