/**
 * 分类管理页面 - Neo-Brutalism 风格
 * 描边标签切换 + 描边方形分类网格 + 虚线添加按钮
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AddCategoryModal } from '../../components/modals/AddCategoryModal';
import { useToast, useStyles } from '../../hooks';
import { useAlert } from '../../providers';
import { categoriesService } from '../../services';
import type { CategoryData } from '../../types/category';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';

const CategoryManageScreen: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const { confirm } = useAlert();
  const styles = useStyles(createStyles);

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesService.getCategories(selectedType);
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error: any) {
      showError(error.message || '加载分类失败');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [selectedType])
  );

  const handleDeleteCategory = (category: CategoryData) => {
    if (category.isDefault) {
      showError('默认分类不能删除');
      return;
    }

    confirm(
      '删除分类',
      `确定要删除"${category.name}"分类吗？`,
      async () => {
        try {
          const response = await categoriesService.deleteCategory(category.id);
          if (response.success) {
            showSuccess('分类删除成功');
            fetchCategories();
          } else {
            showError(response.message || '删除失败');
          }
        } catch (error: any) {
          showError(error.message || '删除失败');
        }
      },
      undefined,
      { confirmText: '删除', destructive: true }
    );
  };

  const handleEditCategory = (category: CategoryData) => {
    if (category.isDefault) {
      showError('默认分类不能编辑');
      return;
    }
    setSelectedCategory(category);
    setShowAddModal(true);
  };

  const handleAddSuccess = () => {
    fetchCategories();
  };

  const defaultCategories = categories.filter(cat => cat.isDefault);
  const customCategories = categories.filter(cat => !cat.isDefault);

  return (
    <View style={styles.container}>
      {/* 类型切换标签 */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedType === 'expense' && styles.tabExpenseActive]}
          onPress={() => setSelectedType('expense')}
        >
          <Text style={[styles.tabText, selectedType === 'expense' && styles.tabTextActive]}>
            支出分类
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedType === 'income' && styles.tabIncomeActive]}
          onPress={() => setSelectedType('income')}
        >
          <Text style={[styles.tabText, selectedType === 'income' && styles.tabTextActive]}>
            收入分类
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={styles._colors.primary} />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : (
          <>
            {/* 默认分类 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 默认分类</Text>
              <View style={styles.categoryGrid}>
                {defaultCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    activeOpacity={0.8}
                  >
                    <View style={styles.categoryIconBlock}>
                      <Text style={styles.categoryEmoji}>
                        {category.icon || '📝'}
                      </Text>
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 自定义分类 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ 自定义分类</Text>
              <View style={styles.categoryGrid}>
                {customCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryItem, styles.customCategoryItem]}
                    onLongPress={() => handleDeleteCategory(category)}
                    activeOpacity={0.8}
                  >
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleEditCategory(category)}
                    >
                      <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteCategory(category)}
                    >
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                    <View style={styles.categoryIconBlock}>
                      <Text style={styles.categoryEmoji}>
                        {category.icon || '📝'}
                      </Text>
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}

                {/* 添加分类按钮 */}
                <TouchableOpacity
                  style={styles.addCategoryBtn}
                  onPress={() => {
                    setSelectedCategory(null);
                    setShowAddModal(true);
                  }}
                >
                  <View style={styles.addIconContainer}>
                    <Text style={styles.addIcon}>+</Text>
                  </View>
                  <Text style={styles.addLabel}>添加分类</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      <AddCategoryModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedCategory(null);
        }}
        onSuccess={handleAddSuccess}
        billType={selectedType}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: borderWidth.thin,
      borderBottomColor: colors.stroke,
      padding: spacing.sm,
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.surface,
    },
    tabExpenseActive: {
      backgroundColor: colors.expense,
      borderColor: colors.stroke,
    },
    tabIncomeActive: {
      backgroundColor: colors.income,
      borderColor: colors.stroke,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    section: {
      margin: spacing.lg,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    categoryItem: {
      width: '22%',
      alignItems: 'center',
      position: 'relative',
      paddingVertical: spacing.sm,
    },
    customCategoryItem: {
      position: 'relative',
    },
    categoryIconBlock: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    categoryEmoji: {
      fontSize: 24,
    },
    categoryName: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    editBtn: {
      position: 'absolute',
      top: 0,
      right: 2,
      zIndex: 1,
      width: 22,
      height: 22,
      borderRadius: borderRadius.small,
      borderWidth: 1,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editIcon: {
      fontSize: 10,
    },
    deleteBtn: {
      position: 'absolute',
      top: 0,
      left: 2,
      zIndex: 1,
      width: 22,
      height: 22,
      borderRadius: borderRadius.small,
      borderWidth: 1,
      borderColor: colors.error,
      backgroundColor: colors.error + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteIcon: {
      fontSize: 10,
    },
    addCategoryBtn: {
      width: '22%',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    addIconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
      backgroundColor: 'transparent',
    },
    addIcon: {
      fontSize: 24,
      color: colors.textTertiary,
      fontWeight: '800',
    },
    addLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textTertiary,
      textAlign: 'center',
    },
  }),
  _colors: colors,
});

export default CategoryManageScreen;
