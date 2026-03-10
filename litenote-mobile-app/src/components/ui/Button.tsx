/**
 * 按钮组件 - Neo-Brutalism 风格
 * 粗描边 + 实心偏移阴影 + 饱和色块
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const styles = useStyles(createStyles);

  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : styles._colors.primary}
        />
      ) : (
        <>
          {icon && <Text style={[buttonTextStyle, styles.icon]}>{icon}</Text>}
          <Text style={buttonTextStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      ...shadow.small,
    },

    // 变体样式
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.accent,
    },
    outline: {
      backgroundColor: colors.surface,
      borderColor: colors.stroke,
    },
    text: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },

    // 尺寸样式
    small: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 36,
    },
    medium: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      minHeight: 48,
    },
    large: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      minHeight: 56,
    },

    // 文本样式
    buttonText: {
      fontWeight: '800',
      textAlign: 'center',
    },
    primaryText: {
      color: '#FFFFFF',
    },
    secondaryText: {
      color: colors.textPrimary,
    },
    outlineText: {
      color: colors.textPrimary,
    },
    textText: {
      color: colors.primary,
    },

    // 尺寸文本样式
    smallText: {
      fontSize: 13,
    },
    mediumText: {
      fontSize: 15,
    },
    largeText: {
      fontSize: 18,
    },

    // 禁用状态
    disabled: {
      backgroundColor: colors.divider,
      borderColor: colors.textTertiary,
      shadowOpacity: 0,
      elevation: 0,
    },
    disabledText: {
      color: colors.textTertiary,
    },

    // 图标样式
    icon: {
      marginRight: spacing.sm,
    },
  }),
  _colors: colors,
});

export default Button;
