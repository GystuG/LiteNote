/**
 * Neo-Brutalism 可按压组件
 *
 * 核心交互：实心偏移阴影 + 按下沉入效果
 * - 默认状态：内容在 (0,0)，黑色实心阴影可见于右下方
 * - 按下状态：内容平移至 (offset, offset)，覆盖阴影，看起来像被按下去
 * - 松开恢复：120ms 弹回原位
 */
import React, { useRef, useCallback } from 'react';
import {
  Animated,
  Pressable,
  View,
  ViewStyle,
  StyleSheet,
  StyleProp,
} from 'react-native';

interface BrutalPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** 阴影颜色，默认 #1A1A1A */
  shadowColor?: string;
  /** 阴影偏移量 (px)，默认 4 */
  shadowOffset?: number;
  /** 动画时长 (ms)，默认 120 */
  duration?: number;
}

export default function BrutalPressable({
  children,
  onPress,
  style,
  shadowColor = '#1A1A1A',
  shadowOffset = 4,
  duration = 120,
}: BrutalPressableProps) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(pressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [pressAnim, duration]);

  const handlePressOut = useCallback(() => {
    Animated.timing(pressAnim, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [pressAnim, duration]);

  const translateX = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shadowOffset],
  });

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shadowOffset],
  });

  // 提取 borderRadius 用于阴影层
  const flatStyle = StyleSheet.flatten(style) || {};
  const borderRadius = (flatStyle as ViewStyle).borderRadius || 0;

  return (
    <View style={{ marginBottom: shadowOffset, marginRight: shadowOffset }}>
      {/* 阴影层 - 固定位置的实心色块 */}
      <View
        style={{
          position: 'absolute',
          top: shadowOffset,
          left: shadowOffset,
          width: '100%',
          height: '100%',
          backgroundColor: shadowColor,
          borderRadius,
        }}
      />
      {/* 内容层 - 按下时平移覆盖阴影 */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            style,
            {
              transform: [{ translateX }, { translateY }],
              // 禁用 RN 阴影 - 使用 View-based 实心阴影
              shadowOpacity: 0,
              elevation: 0,
            },
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    </View>
  );
}
