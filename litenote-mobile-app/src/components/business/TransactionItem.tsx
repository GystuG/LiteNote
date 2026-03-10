/**
 * 交易记录项组件 - Neo-Brutalism 风格
 * 粗描边 + BrutalPressable + 糖果色图标块
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import BrutalPressable from '../ui/BrutalPressable';

export interface TransactionItemProps {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  categoryName?: string;
  categoryIcon?: string;
  date: string;
  time?: string;
  onPress?: () => void;
}

export default function TransactionItem({
  amount,
  type,
  description,
  categoryName,
  categoryIcon,
  date,
  time,
  onPress,
}: TransactionItemProps) {
  const styles = useStyles(createStyles);
  const isIncome = type === 'income';

  const content = (
    <View style={styles.inner}>
      <View style={[
        styles.iconContainer,
        { backgroundColor: isIncome ? styles._colors.success : styles._colors.accent },
      ]}>
        <Text style={styles.icon}>{categoryIcon || (isIncome ? '💰' : '💸')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.mainRow}>
          <Text style={styles.category} numberOfLines={1}>
            {categoryName || (isIncome ? '收入' : '支出')}
          </Text>
          <View style={[
            styles.amountBadge,
            isIncome ? styles.incomeBadge : styles.expenseBadge,
          ]}>
            <Text style={[styles.amount, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
              {isIncome ? '+' : '-'}¥{Math.abs(amount).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.subRow}>
          <Text style={styles.description} numberOfLines={1}>
            {description || '无备注'}
          </Text>
          <Text style={styles.time}>
            {time || date}
          </Text>
        </View>
      </View>
    </View>
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
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    icon: {
      fontSize: 22,
    },
    content: {
      flex: 1,
    },
    mainRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    category: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
      marginRight: spacing.sm,
    },
    amountBadge: {
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    incomeBadge: {
      backgroundColor: '#DCFCE7',
    },
    expenseBadge: {
      backgroundColor: '#FEE2E2',
    },
    amount: {
      fontSize: 15,
      fontWeight: '800',
      fontFamily: 'Courier',
    },
    incomeAmount: {
      color: '#16A34A',
    },
    expenseAmount: {
      color: '#DC2626',
    },
    subRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    description: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textTertiary,
      flex: 1,
      marginRight: spacing.sm,
    },
    time: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      fontFamily: 'Courier',
    },
  }),
  _colors: colors,
});
