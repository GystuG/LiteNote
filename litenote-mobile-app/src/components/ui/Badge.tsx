/**
 * 徽章组件 - Neo-Brutalism 风格
 * 描边 + 小圆角(非全圆) + 糖果色变体
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'small' | 'medium';
  style?: object;
}

export default function Badge({ label, variant = 'default', size = 'medium', style }: BadgeProps) {
  const styles = useStyles(createStyles);
  const isSmall = size === 'small';

  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return { bg: styles._colors.success, text: '#FFFFFF' };
      case 'warning':
        return { bg: styles._colors.accent, text: styles._colors.textPrimary };
      case 'error':
        return { bg: styles._colors.error, text: '#FFFFFF' };
      case 'info':
        return { bg: styles._colors.primary, text: '#FFFFFF' };
      default:
        return { bg: styles._colors.divider, text: styles._colors.textPrimary };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyle.bg,
          paddingVertical: isSmall ? 2 : spacing.xs,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: variantStyle.text,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    badge: {
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignSelf: 'flex-start',
    },
    label: {
      fontWeight: '700',
    },
  }),
  _colors: colors,
});
