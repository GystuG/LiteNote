/**
 * 预算卡片组件 - Neo-Brutalism 风格
 * 粗描边 + 实心阴影 + 描边进度条 + Courier 数字
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import ProgressBar from '../ui/ProgressBar';
import BrutalPressable from '../ui/BrutalPressable';

export interface BudgetCardProps {
  id: number;
  name: string;
  amount: number;
  spent: number;
  categoryIcon?: string;
  period?: 'monthly' | 'yearly';
  onPress?: () => void;
}

export default function BudgetCard({
  name,
  amount,
  spent,
  categoryIcon,
  period = 'monthly',
  onPress,
}: BudgetCardProps) {
  const styles = useStyles(createStyles);
  const remaining = amount - spent;
  const progress = amount > 0 ? (spent / amount) * 100 : 0;
  const isOverBudget = spent > amount;
  const periodLabel = period === 'monthly' ? '本月' : '本年';

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {categoryIcon && (
            <View style={styles.iconBlock}>
              <Text style={styles.icon}>{categoryIcon}</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
        </View>
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>{periodLabel}</Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>预算</Text>
          <Text style={styles.amountValue}>¥{amount.toFixed(0)}</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>已花</Text>
          <Text style={[styles.amountValue, styles.spentValue]}>¥{spent.toFixed(0)}</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>剩余</Text>
          <Text style={[
            styles.amountValue,
            { color: isOverBudget ? styles._colors.error : styles._colors.success },
          ]}>
            {isOverBudget ? '-' : ''}¥{Math.abs(remaining).toFixed(0)}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progress}
          height={12}
          color={styles._colors.primary}
          backgroundColor={styles._colors.divider}
        />
      </View>

      {isOverBudget && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠ 已超出预算 ¥{Math.abs(remaining).toFixed(0)}</Text>
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <BrutalPressable
        onPress={onPress}
        style={styles.container}
        shadowOffset={3}
        shadowColor={styles._colors.stroke}
      >
        {content}
      </BrutalPressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconBlock: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    icon: {
      fontSize: 16,
    },
    name: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    periodBadge: {
      backgroundColor: colors.primaryLight,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    periodText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      fontFamily: 'Courier',
    },
    amountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    amountItem: {
      alignItems: 'center',
    },
    amountLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      marginBottom: spacing.xs,
    },
    amountValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'Courier',
    },
    spentValue: {
      color: colors.expense,
    },
    progressContainer: {
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      overflow: 'hidden',
    },
    warningContainer: {
      marginTop: spacing.sm,
      backgroundColor: colors.error,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.sm,
      alignItems: 'center',
    },
    warningText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '700',
    },
  }),
  _colors: colors,
});
