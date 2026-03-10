/**
 * 进度条组件 - Neo-Brutalism 风格
 * 粗边框、实心填充、无圆角渐变
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';

export interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside';
  style?: object;
}

export default function ProgressBar({
  progress,
  color,
  backgroundColor,
  height = 8,
  showLabel = false,
  labelPosition = 'outside',
  style,
}: ProgressBarProps) {
  const styles = useStyles(createStyles);
  const resolvedColor = color || styles._colors.primary;
  const resolvedBg = backgroundColor || styles._colors.divider;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const getProgressColor = () => {
    if (clampedProgress >= 100) return styles._colors.error;
    if (clampedProgress >= 80) return styles._colors.warning;
    return resolvedColor;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { backgroundColor: resolvedBg, height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: getProgressColor(),
              height,
            },
          ]}
        />
        {showLabel && labelPosition === 'inside' && clampedProgress > 20 && (
          <Text style={styles.insideLabel}>{Math.round(clampedProgress)}%</Text>
        )}
      </View>
      {showLabel && labelPosition === 'outside' && (
        <Text style={[styles.outsideLabel, { color: getProgressColor() }]}>
          {Math.round(clampedProgress)}%
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    track: {
      flex: 1,
      borderRadius: borderRadius.small,
      overflow: 'hidden',
      position: 'relative',
    },
    fill: {
      borderRadius: borderRadius.small,
    },
    insideLabel: {
      position: 'absolute',
      right: spacing.sm,
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
      top: '50%',
      transform: [{ translateY: -6 }],
    },
    outsideLabel: {
      marginLeft: spacing.sm,
      fontSize: 12,
      fontWeight: '800',
      minWidth: 36,
      fontFamily: 'Courier',
    },
  }),
  _colors: colors,
});
