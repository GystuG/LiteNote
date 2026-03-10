/**
 * 账单项组件 - Neo-Brutalism 风格
 * 描边卡片 + Courier 金额（列表用，无实心阴影）
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth } from '../../theme';
import { useStyles } from '../../hooks';

export interface BillData {
  id: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  description?: string;
  icon: string;
}

interface BillItemProps {
  bill: BillData;
  onPress?: (bill: BillData) => void;
}

const BillItem: React.FC<BillItemProps> = ({ bill, onPress }) => {
  const styles = useStyles(createStyles);

  const handlePress = () => {
    onPress?.(bill);
  };

  const isIncome = bill.type === 'income';

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.8}
    >
      <View style={styles.leftSection}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: isIncome ? styles._colors.success : styles._colors.accent },
        ]}>
          <Text style={styles.icon}>{bill.icon}</Text>
        </View>
        <View style={styles.billInfo}>
          <Text style={styles.category}>{bill.category}</Text>
          <Text style={styles.date}>{bill.date}</Text>
          {bill.description && (
            <Text style={styles.description} numberOfLines={1}>
              {bill.description}
            </Text>
          )}
        </View>
      </View>

      <View style={[
        styles.amountBadge,
        isIncome ? styles.incomeBadge : styles.expenseBadge,
      ]}>
        <Text style={[styles.amount, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
          {isIncome ? '+' : '-'}¥{Math.abs(bill.amount).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.xs,
      borderRadius: borderRadius.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
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
      fontSize: 20,
    },
    billInfo: {
      flex: 1,
    },
    category: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    date: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginBottom: 2,
    },
    description: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    amountBadge: {
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
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
  }),
  _colors: colors,
});

export default BillItem;
