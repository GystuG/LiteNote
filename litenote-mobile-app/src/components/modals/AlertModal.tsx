/**
 * 通用弹窗组件 - Neo-Brutalism 风格
 * 粗描边 + 糖果色类型图标
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertModalProps {
  visible: boolean;
  title?: string;
  message: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: '确定', style: 'default' }],
  onClose,
}) => {
  const styles = useStyles(createStyles);

  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    onClose();
  };

  const getButtonStyle = (style: AlertButton['style']) => {
    switch (style) {
      case 'destructive':
        return [styles.button, styles.destructiveButton];
      case 'cancel':
        return [styles.button, styles.cancelButton];
      default:
        return [styles.button, styles.defaultButton];
    }
  };

  const getButtonTextStyle = (style: AlertButton['style']) => {
    switch (style) {
      case 'destructive':
        return styles.destructiveButtonText;
      case 'cancel':
        return styles.cancelButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message}>{message}</Text>

          <View style={buttons.length > 2 ? styles.buttonColumn : styles.buttonRow}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={getButtonStyle(button.style)}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.8}
              >
                <Text style={getButtonTextStyle(button.style)}>{button.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thick,
      borderColor: colors.stroke,
      width: '85%',
      maxWidth: 320,
      padding: spacing.xl,
      ...shadow.medium,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    message: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      textAlign: 'center',
      lineHeight: 22,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    buttonColumn: {
      flexDirection: 'column',
      gap: spacing.sm,
    },
    button: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
      ...shadow.small,
    },
    defaultButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.surface,
    },
    destructiveButton: {
      backgroundColor: colors.error,
    },
    defaultButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    destructiveButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  }),
  _colors: colors,
});
