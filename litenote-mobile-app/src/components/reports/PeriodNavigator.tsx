/**
 * PeriodNavigator - 周期导航条
 * < 2026年3月 > 样式的导航控件
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';

interface PeriodNavigatorProps {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  disableNext?: boolean;
}

export default function PeriodNavigator({
  title,
  onPrev,
  onNext,
  disableNext = false,
}: PeriodNavigatorProps) {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPrev}
        style={styles.arrowBtn}
        activeOpacity={0.7}
      >
        <ChevronLeft size={22} color={styles._colors.textPrimary} strokeWidth={3} />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity
        onPress={onNext}
        disabled={disableNext}
        style={[styles.arrowBtn, disableNext && { opacity: 0.3 }]}
        activeOpacity={0.7}
      >
        <ChevronRight size={22} color={styles._colors.textPrimary} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
    },
    arrowBtn: {
      padding: spacing.sm,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.surface,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginHorizontal: spacing.xl,
      minWidth: 120,
      textAlign: 'center',
    },
  }),
  _colors: colors,
});
