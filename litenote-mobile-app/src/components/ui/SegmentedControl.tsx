/**
 * 分段控制器组件 - Neo-Brutalism 风格
 * 描边分段，选中态糖果色填充+粗边，粗文字
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';

export interface SegmentedControlOption {
  key: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  style?: object;
}

export default function SegmentedControl({
  options,
  selectedKey,
  onSelect,
  style,
}: SegmentedControlProps) {
  const styles = useStyles(createStyles);

  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = option.key === selectedKey;

        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onSelect(option.key)}
            style={[
              styles.option,
              isSelected && styles.optionSelected,
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: 3,
    },
    option: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.small,
    },
    optionSelected: {
      backgroundColor: colors.accent,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    labelSelected: {
      color: colors.textPrimary,
      fontWeight: '800',
    },
  }),
  _colors: colors,
});
