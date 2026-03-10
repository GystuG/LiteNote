/**
 * 模态框组件 - Neo-Brutalism 风格
 * 粗描边容器、实心阴影、粗标题、描边关闭按钮
 */
import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  animationType = 'slide',
}) => {
  const styles = useStyles(createStyles);

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* 模态框头部 */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  {title && <Text style={styles.title}>{title}</Text>}
                </View>

                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 模态框内容 */}
            <View style={styles.content}>
              {children}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </RNModal>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.overlay,
    },
    modalContainer: {
      width: screenWidth * 0.9,
      maxWidth: 400,
      maxHeight: screenHeight * 0.8,
    },
    modal: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thick,
      borderColor: colors.stroke,
      overflow: 'hidden',
      ...shadow.medium,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: borderWidth.thin,
      borderBottomColor: colors.stroke,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    closeIcon: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: '800',
    },
    content: {
      padding: spacing.lg,
      maxHeight: screenHeight * 0.6,
    },
  }),
  _colors: colors,
});

export default Modal;
