/**
 * 添加分类模态框组件 - Neo-Brutalism 风格
 * 描边图标网格 + BrutalPressable 按钮
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';
import { useToast, useStyles } from '../../hooks';
import { categoriesService } from '../../services';
import type { BillType } from '../../types/bill';
import Modal from '../ui/Modal';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  billType: BillType;
}

const ICON_OPTIONS = [
  '🍔', '🚕', '🛍️', '🏠', '🎮', '📚',
  '💊', '🎁', '✈️', '🏋️', '🍿', '📱',
  '💻', '🚗', '👕', '🎵', '🎬', '📺',
  '⚽', '🎾', '🎨', '📷', '🌹', '🐶',
  '💰', '💼', '🏦', '📈', '🎯', '⭐',
  '🔥', '❤️', '🌟', '🎉', '🚀', '💎',
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  visible,
  onClose,
  onSuccess,
  billType,
}) => {
  const styles = useStyles(createStyles);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🍔');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleSave = async () => {
    if (!categoryName.trim()) {
      showError('请输入分类名称');
      return;
    }

    setLoading(true);
    try {
      await categoriesService.createCategory({
        name: categoryName.trim(),
        type: billType,
        icon: selectedIcon,
        color: billType === 'income' ? styles._colors.income : styles._colors.expense,
      });

      showSuccess('分类创建成功');
      setCategoryName('');
      setSelectedIcon('🍔');
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message || '创建分类失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategoryName('');
    setSelectedIcon('🍔');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="添加分类"
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 分类名称输入 */}
        <View style={styles.section}>
          <Text style={styles.label}>分类名称</Text>
          <TextInput
            style={styles.input}
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder="输入分类名称"
            placeholderTextColor={styles._colors.textTertiary}
            maxLength={20}
          />
        </View>

        {/* 图标选择 */}
        <View style={styles.section}>
          <Text style={styles.label}>选择图标</Text>
          <View style={styles.iconGrid}>
            {ICON_OPTIONS.map((icon, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
                activeOpacity={0.7}
              >
                <Text style={styles.iconText}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleClose}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    content: {
      maxHeight: 400,
    },
    contentContainer: {
      paddingVertical: spacing.sm,
    },
    section: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      padding: spacing.md,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      marginHorizontal: -4,
    },
    iconOption: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      margin: 4,
    },
    iconOptionSelected: {
      backgroundColor: colors.accent,
      borderWidth: borderWidth.medium,
    },
    iconText: {
      fontSize: 22,
    },
    footer: {
      flexDirection: 'row',
      paddingTop: spacing.md,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
      gap: spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      alignItems: 'center',
      ...shadow.small,
    },
    cancelButton: {
      backgroundColor: colors.surface,
    },
    cancelButtonText: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
  }),
  _colors: colors,
});
