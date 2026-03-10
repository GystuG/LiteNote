/**
 * 空状态组件 - Neo-Brutalism 风格
 * 描边容器 + 大 emoji 方块 + 粗标题 + BrutalPressable 按钮
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import BrutalPressable from './BrutalPressable';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const styles = useStyles(createStyles);

  return (
    <View style={[styles.container, style]}>
      {/* Emoji 方块 */}
      <View style={styles.iconBlock}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <BrutalPressable
          onPress={onAction}
          style={styles.button}
          shadowOffset={3}
          shadowColor={styles._colors.stroke}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </BrutalPressable>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      ...shadow.small,
    },
    iconBlock: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    icon: {
      fontSize: 40,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    description: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    button: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  }),
  _colors: colors,
});
