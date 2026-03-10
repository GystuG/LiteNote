/**
 * Toast 提示组件 - Neo-Brutalism 风格
 * 粗描边 + 实心阴影 + 粗文字
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
  position?: 'top' | 'center' | 'bottom';
}

const { width: screenWidth } = Dimensions.get('window');

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
  position = 'center',
}) => {
  const styles = useStyles(createStyles);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return { bg: styles._colors.success, icon: '✓' };
      case 'error':
        return { bg: styles._colors.error, icon: '✕' };
      case 'warning':
        return { bg: styles._colors.warning, icon: '⚠' };
      default:
        return { bg: styles._colors.primary, icon: 'ℹ' };
    }
  };

  const toastConfig = getToastConfig();

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { top: 100 };
      case 'bottom':
        return { bottom: 100 };
      default:
        return {
          top: Dimensions.get('window').height / 2 - 30,
        };
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, getPositionStyle()]}>
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: toastConfig.bg },
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{toastConfig.icon}</Text>
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 9999,
      paddingHorizontal: spacing.lg,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      maxWidth: screenWidth - spacing.lg * 2,
      minWidth: 200,
      ...shadow.medium,
    },
    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    icon: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '800',
    },
    message: {
      flex: 1,
      fontSize: 15,
      color: '#FFFFFF',
      fontWeight: '700',
      lineHeight: 21,
    },
  }),
  _colors: colors,
});

export default Toast;
