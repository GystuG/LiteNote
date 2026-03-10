/**
 * 骨架屏基础组件 - Neo-Brutalism 风格
 * 描边骨架卡片 + shimmer 动画
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth } from '../../theme/spacing';
import { useStyles } from '../../hooks';

interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * 基础骨架元素
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius: br = 8,
  style,
}: SkeletonProps) {
  const styles = useStyles(createStyles);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: br,
        },
        { opacity },
        style,
      ]}
    />
  );
}

/**
 * 圆形骨架元素
 */
export function SkeletonCircle({ size = 40, style }: { size?: number; style?: ViewStyle }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}

/**
 * 文本行骨架
 */
export function SkeletonText({
  width = '100%',
  height = 14,
  style,
}: {
  width?: number | `${number}%` | 'auto';
  height?: number;
  style?: ViewStyle;
}) {
  return <Skeleton width={width} height={height} borderRadius={4} style={style} />;
}

/**
 * 卡片骨架容器 - Neo-Brutalism 描边
 */
export function SkeletonCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const styles = useStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    skeleton: {
      backgroundColor: colors.divider,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: 16,
    },
  }),
  _colors: colors,
});
