/**
 * 悬浮操作按钮组件 - Neo-Brutalism 风格
 * 实心偏移阴影 + 粗描边 + BrutalPressable 按压效果
 */
import React, { useRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  Animated,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth } from '../../theme/spacing';
import { useStyles } from '../../hooks';

interface FloatingActionButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  icon?: string;
  style?: ViewStyle;
  disabled?: boolean;
  size?: 'small' | 'normal' | 'large';
  backgroundColor?: string;
  iconColor?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = '+',
  style,
  disabled = false,
  size = 'normal',
  backgroundColor,
  iconColor,
}) => {
  const styles = useStyles(createStyles);
  const anim = useRef(new Animated.Value(0)).current;

  const sizeStyles = {
    small: { width: 44, height: 44, iconSize: 22 },
    normal: { width: 56, height: 56, iconSize: 28 },
    large: { width: 64, height: 64, iconSize: 32 },
  };

  const currentSize = sizeStyles[size];
  const shadowOffset = size === 'small' ? 3 : 4;
  const bgColor = backgroundColor || styles._colors.accent;
  const txtColor = iconColor || styles._colors.textPrimary;

  const handlePressIn = () => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shadowOffset],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shadowOffset],
  });

  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: shadowOffset,
          marginRight: shadowOffset,
        },
        style,
      ]}
    >
      {/* 实心阴影层 */}
      <View
        style={[
          styles.shadowLayer,
          {
            width: currentSize.width,
            height: currentSize.height,
            borderRadius: borderRadius.medium,
            top: shadowOffset,
            left: shadowOffset,
          },
        ]}
      />
      {/* 按钮主体 */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View
          style={[
            styles.button,
            {
              width: currentSize.width,
              height: currentSize.height,
              borderRadius: borderRadius.medium,
              backgroundColor: disabled ? styles._colors.divider : bgColor,
              transform: [{ translateX }, { translateY }],
            },
          ]}
        >
          <Text
            style={[
              styles.icon,
              {
                fontSize: currentSize.iconSize,
                color: disabled ? styles._colors.textTertiary : txtColor,
              },
            ]}
          >
            {icon}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 80,
      right: spacing.lg,
      zIndex: 999,
    },
    shadowLayer: {
      position: 'absolute',
      backgroundColor: colors.stroke,
    },
    button: {
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: borderWidth.thick,
      borderColor: colors.stroke,
    },
    icon: {
      fontWeight: '800',
    },
  }),
  _colors: colors,
});

export default FloatingActionButton;
