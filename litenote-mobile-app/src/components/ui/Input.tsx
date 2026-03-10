/**
 * 输入框组件 - Neo-Brutalism 风格
 * 粗描边、聚焦态 accent 边框、粗标签
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth } from '../../theme/spacing';
import { useStyles } from '../../hooks';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  required = false,
  ...props
}) => {
  const styles = useStyles(createStyles);
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.focused,
    error && styles.error,
  ];

  const textInputStyle = [
    styles.input,
    inputStyle,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={inputContainerStyle}>
        <TextInput
          style={textInputStyle}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={styles._colors.textTertiary}
          {...props}
        />
      </View>

      {error && (
        <Text style={[styles.errorText, errorStyle]}>{error}</Text>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    required: {
      color: colors.error,
      fontWeight: '800',
    },
    inputContainer: {
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      backgroundColor: colors.surface,
    },
    focused: {
      borderColor: colors.accent,
    },
    error: {
      borderColor: colors.error,
    },
    input: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      minHeight: 48,
    },
    errorText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.error,
      marginTop: spacing.xs,
    },
  }),
  _colors: colors,
});

export default Input;
