/**
 * 预算管理页面 - Neo-Brutalism 风格
 * 预算列表 + 新增/编辑弹窗 + 分类选择 + 进度追踪
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, Plus, Trash2, Pencil } from 'lucide-react-native';
import { ThemeColors } from '../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../theme/spacing';
import { ProgressBar, BrutalPressable } from '../components/ui';
import { useStyles } from '../hooks';
import { useAlert } from '../providers';
import { budgetsService } from '../services/api/budgets';
import { categoriesService, CategoryData } from '../services/api/categories';
import { QUERY_KEYS, invalidateCache } from '../lib/queryClient';
import type {
  BudgetProgress,
  BudgetPeriod,
  CreateBudgetDto,
  UpdateBudgetDto,
} from '../types/budget';

export default function BudgetScreen() {
  const navigation = useNavigation();
  const styles = useStyles(createStyles);
  const { confirm } = useAlert();

  // 弹窗状态
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetProgress | null>(null);

  // 表单状态
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPeriod, setFormPeriod] = useState<BudgetPeriod>('monthly');
  const [formCategoryId, setFormCategoryId] = useState<number | undefined>(undefined);
  const [formAlertAt, setFormAlertAt] = useState('80');

  // 数据查询
  const { data: budgetsData, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.budgets,
    queryFn: async () => {
      const res = await budgetsService.getProgress();
      return Array.isArray(res) ? res : (res.data ?? []);
    },
  });

  const { data: categories } = useQuery({
    queryKey: QUERY_KEYS.categories.byType('expense'),
    queryFn: async () => {
      const res = await categoriesService.getExpenseCategories();
      return res.data ?? [];
    },
  });

  const budgets = budgetsData ?? [];
  const totalBudgets = budgets.length;
  const activeBudgets = budgets.filter(b => b.isActive && !b.isOverBudget).length;
  const overBudgets = budgets.filter(b => b.isOverBudget).length;

  // 创建 mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateBudgetDto) => budgetsService.create(data),
    onSuccess: () => {
      invalidateCache.budgets();
      closeFormModal();
    },
  });

  // 更新 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBudgetDto }) =>
      budgetsService.update(id, data),
    onSuccess: () => {
      invalidateCache.budgets();
      closeFormModal();
    },
  });

  // 删除 mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => budgetsService.delete(id),
    onSuccess: () => invalidateCache.budgets(),
  });

  // 表单操作
  const openCreateModal = () => {
    setEditingBudget(null);
    setFormName('');
    setFormAmount('');
    setFormPeriod('monthly');
    setFormCategoryId(undefined);
    setFormAlertAt('80');
    setShowFormModal(true);
  };

  const openEditModal = (budget: BudgetProgress) => {
    setEditingBudget(budget);
    setFormName(budget.name);
    setFormAmount(String(budget.amount));
    setFormPeriod(budget.period);
    setFormCategoryId(budget.categoryId);
    setFormAlertAt(String(budget.alertAt));
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingBudget(null);
  };

  const handleSubmitForm = () => {
    const amount = parseFloat(formAmount);
    const alertAt = parseInt(formAlertAt, 10);
    if (!formName.trim() || isNaN(amount) || amount <= 0) { return; }

    const payload: CreateBudgetDto = {
      name: formName.trim(),
      amount,
      period: formPeriod,
      categoryId: formCategoryId,
      alertAt: isNaN(alertAt) ? 80 : alertAt,
    };

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (budget: BudgetProgress) => {
    confirm(
      '删除预算',
      `确定要删除「${budget.name}」吗？此操作不可撤销。`,
      () => deleteMutation.mutate(budget.id),
      undefined,
      { confirmText: '删除', destructive: true },
    );
  };

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const getProgressColor = (budget: BudgetProgress) => {
    if (budget.isOverBudget) { return styles._colors.error; }
    if (budget.needsAlert) { return '#F59E0B'; }
    return styles._colors.success;
  };

  const getCategoryIcon = (budget: BudgetProgress) => {
    return budget.category?.icon || '💰';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={styles._colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>预算管理</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Plus size={20} color={styles._colors.textPrimary} strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{totalBudgets}</Text>
          <Text style={styles.summaryLabel}>个预算</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{activeBudgets}</Text>
          <Text style={styles.summaryLabel}>进行中</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, overBudgets > 0 && { color: styles._colors.error }]}>
            {overBudgets}
          </Text>
          <Text style={styles.summaryLabel}>已超支</Text>
        </View>
      </View>

      {/* Budget List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyText}>还没有预算计划</Text>
            <Text style={styles.emptySubtext}>创建预算，合理控制你的开支</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
              <Text style={styles.emptyButtonText}>创建预算</Text>
            </TouchableOpacity>
          </View>
        ) : (
          budgets.map((budget) => (
            <View key={budget.id} style={styles.budgetCard}>
              {/* Card Header */}
              <View style={styles.budgetHeader}>
                <View style={styles.budgetTitleRow}>
                  <View style={styles.budgetIconBox}>
                    <Text style={styles.budgetIconText}>{getCategoryIcon(budget)}</Text>
                  </View>
                  <View style={styles.budgetTitleGroup}>
                    <Text style={styles.budgetName} numberOfLines={1}>{budget.name}</Text>
                    {budget.category && (
                      <Text style={styles.budgetCategory}>{budget.category.name}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.badgeRow}>
                  <View style={styles.periodBadge}>
                    <Text style={styles.periodText}>
                      {budget.period === 'monthly' ? '本月' : '本年'}
                    </Text>
                  </View>
                  <View style={[
                    styles.percentBadge,
                    budget.isOverBudget && styles.overBudgetBadge,
                  ]}>
                    <Text style={[
                      styles.percentText,
                      budget.isOverBudget && styles.overBudgetBadgeText,
                    ]}>
                      {Math.round(budget.progress)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.budgetProgressContainer}>
                <ProgressBar
                  progress={Math.min(budget.progress, 100)}
                  color={getProgressColor(budget)}
                  backgroundColor={styles._colors.divider}
                  height={14}
                />
              </View>

              {/* Amounts */}
              <View style={styles.budgetAmounts}>
                <Text style={styles.budgetAmountSpent}>
                  已用 ¥{budget.spent.toLocaleString()}
                </Text>
                <Text style={styles.budgetAmountTotal}>
                  / 预算 ¥{budget.amount.toLocaleString()}
                </Text>
              </View>

              {/* Over-budget warning */}
              {budget.isOverBudget && (
                <View style={styles.warningBar}>
                  <Text style={styles.warningText}>
                    超支 ¥{Math.abs(budget.remaining).toLocaleString()}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.budgetActions}>
                <BrutalPressable
                  style={styles.editButton}
                  shadowOffset={2}
                  shadowColor={styles._colors.stroke}
                  onPress={() => openEditModal(budget)}
                >
                  <Pencil size={16} color={styles._colors.textPrimary} strokeWidth={2.5} />
                  <Text style={styles.editButtonText}>编辑</Text>
                </BrutalPressable>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(budget)}
                >
                  <Trash2 size={16} color={styles._colors.error} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showFormModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingBudget ? '编辑预算' : '新建预算'}
              </Text>

              <Text style={styles.inputLabel}>预算名称</Text>
              <TextInput
                style={styles.textInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="如：每月餐饮、年度旅行"
                placeholderTextColor={styles._colors.textTertiary}
                maxLength={50}
              />

              <Text style={styles.inputLabel}>预算金额</Text>
              <TextInput
                style={styles.textInput}
                value={formAmount}
                onChangeText={setFormAmount}
                placeholder="0.00"
                placeholderTextColor={styles._colors.textTertiary}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>预算周期</Text>
              <View style={styles.periodPicker}>
                <TouchableOpacity
                  style={[styles.periodOption, formPeriod === 'monthly' && styles.periodOptionSelected]}
                  onPress={() => setFormPeriod('monthly')}
                >
                  <Text style={[
                    styles.periodOptionText,
                    formPeriod === 'monthly' && styles.periodOptionTextSelected,
                  ]}>月度</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodOption, formPeriod === 'yearly' && styles.periodOptionSelected]}
                  onPress={() => setFormPeriod('yearly')}
                >
                  <Text style={[
                    styles.periodOptionText,
                    formPeriod === 'yearly' && styles.periodOptionTextSelected,
                  ]}>年度</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>关联分类（可选）</Text>
              <ScrollView
                style={styles.categoryScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={[styles.categoryChip, !formCategoryId && styles.categoryChipSelected]}
                  onPress={() => setFormCategoryId(undefined)}
                >
                  <Text style={styles.categoryChipIcon}>📊</Text>
                  <Text style={[
                    styles.categoryChipText,
                    !formCategoryId && styles.categoryChipTextSelected,
                  ]}>全部分类</Text>
                </TouchableOpacity>
                {(categories ?? []).map((cat: CategoryData) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, formCategoryId === cat.id && styles.categoryChipSelected]}
                    onPress={() => setFormCategoryId(cat.id)}
                  >
                    <Text style={styles.categoryChipIcon}>{cat.icon || '📁'}</Text>
                    <Text style={[
                      styles.categoryChipText,
                      formCategoryId === cat.id && styles.categoryChipTextSelected,
                    ]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>预警阈值（%）</Text>
              <TextInput
                style={styles.textInput}
                value={formAlertAt}
                onChangeText={setFormAlertAt}
                placeholder="80"
                placeholderTextColor={styles._colors.textTertiary}
                keyboardType="number-pad"
                maxLength={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeFormModal}>
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, (!formName.trim() || !formAmount) && styles.submitButtonDisabled]}
                  onPress={handleSubmitForm}
                  disabled={!formName.trim() || !formAmount || createMutation.isPending || updateMutation.isPending}
                >
                  <Text style={styles.submitButtonText}>
                    {editingBudget ? '保存' : '创建'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ===== Header =====
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: borderWidth.medium,
      borderBottomColor: colors.stroke,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ===== Summary =====
    summaryBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      ...shadow.small,
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryNumber: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'Courier',
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      marginTop: 2,
    },
    summaryDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.divider,
    },

    // ===== Scroll =====
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: 40,
    },

    // ===== Empty =====
    emptyState: {
      alignItems: 'center',
      padding: spacing.xxxl,
      marginTop: spacing.xxl,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      ...shadow.medium,
    },
    emptyIcon: {
      fontSize: 56,
      marginBottom: spacing.md,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    emptySubtext: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textTertiary,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    emptyButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      ...shadow.small,
    },
    emptyButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },

    // ===== Budget Card =====
    budgetCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadow.small,
    },
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    budgetTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: spacing.md,
    },
    budgetIconBox: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent + '30',
      alignItems: 'center',
      justifyContent: 'center',
    },
    budgetIconText: {
      fontSize: 22,
    },
    budgetTitleGroup: {
      flex: 1,
    },
    budgetName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    budgetCategory: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      marginTop: 2,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginLeft: spacing.sm,
    },
    periodBadge: {
      backgroundColor: colors.primaryLight,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    periodText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    percentBadge: {
      backgroundColor: colors.accent,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    overBudgetBadge: {
      backgroundColor: colors.error,
    },
    percentText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'Courier',
    },
    overBudgetBadgeText: {
      color: '#FFFFFF',
    },

    // Progress
    budgetProgressContainer: {
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },

    // Amounts
    budgetAmounts: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: spacing.sm,
    },
    budgetAmountSpent: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'Courier',
    },
    budgetAmountTotal: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginLeft: spacing.xs,
    },

    // Warning
    warningBar: {
      backgroundColor: colors.error + '15',
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.error,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    warningText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.error,
      fontFamily: 'Courier',
      textAlign: 'center',
    },

    // Actions
    budgetActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    editButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    deleteButton: {
      marginLeft: 'auto',
      padding: spacing.sm,
    },

    // ===== Modal =====
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
    },
    modalScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.xl,
      ...shadow.large,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    textInput: {
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },

    // Period picker
    periodPicker: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    periodOption: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    periodOptionSelected: {
      borderWidth: borderWidth.medium,
      backgroundColor: colors.primaryLight,
    },
    periodOptionText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    periodOptionTextSelected: {
      color: colors.primary,
      fontWeight: '800',
    },

    // Category picker
    categoryScroll: {
      maxHeight: 160,
      marginTop: spacing.xs,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      backgroundColor: colors.background,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    categoryChipSelected: {
      backgroundColor: colors.primaryLight,
    },
    categoryChipIcon: {
      fontSize: 16,
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    categoryChipTextSelected: {
      color: colors.primary,
      fontWeight: '800',
    },

    // Modal Actions
    modalActions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    submitButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      backgroundColor: colors.primary,
      alignItems: 'center',
      ...shadow.small,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  }),
  _colors: colors,
});
