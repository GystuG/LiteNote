/**
 * 主题化基础组件
 * 自动响应主题变化的 UI 组件
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ViewProps,
  TextProps,
  ScrollViewProps,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../providers';

// ============ ThemedView ============
interface ThemedViewProps extends ViewProps {
  /** 使用 surface 颜色而非 background */
  surface?: boolean;
}

export function ThemedView({ style, surface, ...props }: ThemedViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[{ backgroundColor: surface ? colors.surface : colors.background }, style]}
      {...props}
    />
  );
}

// ============ ThemedText ============
type TextVariant = 'primary' | 'secondary' | 'tertiary' | 'error' | 'success';

interface ThemedTextProps extends TextProps {
  /** 文字颜色变体 */
  variant?: TextVariant;
}

const textVariantMap: Record<TextVariant, keyof typeof import('../../theme/colors').lightColors> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  error: 'error',
  success: 'success',
};

export function ThemedText({ style, variant = 'primary', ...props }: ThemedTextProps) {
  const { colors } = useTheme();
  const colorKey = textVariantMap[variant];
  return <Text style={[{ color: colors[colorKey] }, style]} {...props} />;
}

// ============ ThemedScrollView ============
interface ThemedScrollViewProps extends ScrollViewProps {
  /** 使用 surface 颜色而非 background */
  surface?: boolean;
}

export function ThemedScrollView({ style, surface, ...props }: ThemedScrollViewProps) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={[{ backgroundColor: surface ? colors.surface : colors.background }, style]}
      {...props}
    />
  );
}

// ============ ThemedCard ============
interface ThemedCardProps extends ViewProps {
  /** 是否显示边框 */
  bordered?: boolean;
}

export function ThemedCard({ style, bordered = true, ...props }: ThemedCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          ...(bordered && {
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }),
        },
        style,
      ]}
      {...props}
    />
  );
}

// ============ ThemedDivider ============
interface ThemedDividerProps extends ViewProps {
  /** 垂直方向 */
  vertical?: boolean;
}

export function ThemedDivider({ style, vertical, ...props }: ThemedDividerProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.divider,
          ...(vertical ? { width: 1, height: '100%' } : { height: 1, width: '100%' }),
        },
        style,
      ]}
      {...props}
    />
  );
}
