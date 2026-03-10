/**
 * 分类选择器组件 - Neo-Brutalism 风格
 * 描边网格项 + 糖果色 + BrutalPressable 选中
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth } from '../../theme';
import { useToast, useStyles } from '../../hooks';
import { categoriesService } from '../../services';
import type { BillType } from '../../types/bill';
import type { CategoryData } from '../../types/category';

interface CategorySelectorProps {
  selectedCategoryId?: number;
  onCategorySelect: (category: CategoryData) => void;
  billType: BillType;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  billType,
}) => {
  const styles = useStyles(createStyles);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesService.getCategories(billType);
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error: any) {
      console.error('加载分类失败:', error);
      showError('加载分类失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [billType]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>分类</Text>
      <View style={styles.categoryGrid}>
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected && styles.categoryItemSelected,
              ]}
              onPress={() => onCategorySelect(category)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryName,
                isSelected && styles.categoryNameSelected,
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    categoryItem: {
      width: '22%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      backgroundColor: colors.surface,
      padding: spacing.sm,
    },
    categoryItemSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.stroke,
    },
    categoryIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    categoryName: {
      fontSize: 12,
      color: colors.textPrimary,
      textAlign: 'center',
      fontWeight: '600',
    },
    categoryNameSelected: {
      fontWeight: '800',
    },
  }),
  _colors: colors,
});
