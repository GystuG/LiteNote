/**
 * GridCell - 通用网格单元格组件
 * 用于日/月/年日历网格的单元格展示
 * 上下结构分别显示收入和支出金额
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';

interface GridCellProps {
  label: string;
  income: number;
  expense: number;
  isSelected: boolean;
  isCurrentPeriod?: boolean;
  disabled?: boolean;
  onPress: () => void;
  width: number;
  height: number;
}

const formatAmount = (val: number) => {
  if (val === 0) return '';
  if (val >= 10000) return `${(val / 10000).toFixed(1)}w`;
  return val.toFixed(2);
};

function GridCell({
  label,
  income,
  expense,
  isSelected,
  isCurrentPeriod = false,
  disabled = false,
  onPress,
  width,
  height,
}: GridCellProps) {
  const styles = useStyles(createStyles);

  const hasData = income > 0 || expense > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.cell,
        {
          width,
          height,
          backgroundColor: isSelected ? styles._colors.primary : styles._colors.surface,
          borderColor: isSelected
            ? styles._colors.stroke
            : isCurrentPeriod
              ? styles._colors.primary
              : styles._colors.stroke,
          borderWidth: borderWidth.thin,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          isSelected && { color: '#FFFFFF', fontWeight: '800' },
          isCurrentPeriod && !isSelected && { fontWeight: '800' },
        ]}
      >
        {label}
      </Text>
      {!disabled && hasData ? (
        <View style={styles.amountWrap}>
          {income > 0 && (
            <Text
              style={[
                styles.incomeText,
                isSelected && { color: '#FFFFFF' },
              ]}
              numberOfLines={1}
            >
              {formatAmount(income)}
            </Text>
          )}
          {expense > 0 && (
            <Text
              style={[
                styles.expenseText,
                isSelected && { color: '#FFFFFF' },
              ]}
              numberOfLines={1}
            >
              {formatAmount(expense)}
            </Text>
          )}
        </View>
      ) : !disabled ? (
        <Text style={styles.zeroAmount}>-</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    cell: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.small,
      paddingVertical: 2,
      paddingHorizontal: 1,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    amountWrap: {
      alignItems: 'center',
      marginTop: 1,
    },
    incomeText: {
      fontSize: 9,
      fontWeight: '700',
      fontFamily: 'Courier',
      color: colors.income,
    },
    expenseText: {
      fontSize: 9,
      fontWeight: '700',
      fontFamily: 'Courier',
      color: colors.expense,
    },
    zeroAmount: {
      fontSize: 9,
      fontWeight: '500',
      color: colors.textQuaternary,
      marginTop: 1,
    },
  }),
  _colors: colors,
});

export default memo(GridCell);
