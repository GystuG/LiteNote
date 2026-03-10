/**
 * 搜索栏组件 - Neo-Brutalism 风格
 * 粗描边 + stroke 色 + 粗图标
 */
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onClear?: () => void;
  style?: object;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = '搜索...',
  onSubmit,
  onClear,
  style,
}: SearchBarProps) {
  const styles = useStyles(createStyles);
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, isFocused && styles.containerFocused, style]}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={styles._colors.textTertiary}
        style={styles.input}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.input,
      paddingHorizontal: spacing.md,
      height: 48,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
    },
    containerFocused: {
      borderColor: colors.accent,
    },
    icon: {
      fontSize: 18,
      marginRight: spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      padding: 0,
    },
    clearButton: {
      width: 28,
      height: 28,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearIcon: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: '800',
    },
  }),
  _colors: colors,
});
