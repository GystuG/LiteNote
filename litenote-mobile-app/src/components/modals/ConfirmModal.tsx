/**
 * 确认对话框组件 - Neo-Brutalism 风格
 * 粗描边 + 红色糖果危险按钮
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
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';
import { useStyles } from '../../hooks';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  confirmColor,
}) => {
  const styles = useStyles(createStyles);
  const btnColor = confirmColor || styles._colors.error;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: btnColor }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
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
    cancelButton: {
      backgroundColor: colors.surface,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    confirmButton: {
      backgroundColor: colors.error,
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  }),
  _colors: colors,
});
