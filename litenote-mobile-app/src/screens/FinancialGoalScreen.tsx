/**
 * 财务目标管理页面 - Neo-Brutalism 风格
 * 目标列表 + 新增/编辑弹窗 + 存入弹窗 + 进度追踪
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
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react-native';
import { ThemeColors } from '../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../theme/spacing';
import { ProgressBar, BrutalPressable } from '../components/ui';
import { useStyles } from '../hooks';
import { useAlert } from '../providers';
import { financialGoalsService } from '../services/api/financial-goals';
import { QUERY_KEYS, invalidateCache } from '../lib/queryClient';
import type {
  FinancialGoalProgress,
  CreateFinancialGoalDto,
  UpdateFinancialGoalDto,
} from '../types/financial-goal';

const ICON_OPTIONS = ['🎯', '🏠', '🚗', '✈️', '💎', '📱', '🎓', '💰', '🏦', '🎁', '👶', '💪'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 图标网格：6列，动态计算尺寸适配弹窗宽度
const ICON_COLS = 6;
const MODAL_INNER_WIDTH = SCREEN_WIDTH - spacing.xl * 4; // overlay padding + modal padding
const ICON_SIZE = Math.floor((MODAL_INNER_WIDTH - (ICON_COLS - 1) * spacing.sm) / ICON_COLS);

export default function FinancialGoalScreen() {
  const navigation = useNavigation();
  const styles = useStyles(createStyles);
  const { confirm } = useAlert();
  const queryClient = useQueryClient();

  // 弹窗状态
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoalProgress | null>(null);
  const [depositGoal, setDepositGoal] = useState<FinancialGoalProgress | null>(null);

  // 表单状态
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formIcon, setFormIcon] = useState('🎯');
  const [depositAmount, setDepositAmount] = useState('');

  // 数据查询
  const { data: goalsData, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.financialGoals,
    queryFn: async () => {
      const res = await financialGoalsService.getProgress();
      return Array.isArray(res) ? res : (res.data ?? []);
    },
  });

  const goals = goalsData ?? [];
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.isCompleted).length;

  // 创建/更新 mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateFinancialGoalDto) => financialGoalsService.create(data),
    onSuccess: () => {
      invalidateCache.financialGoals();
      closeFormModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFinancialGoalDto }) =>
      financialGoalsService.update(id, data),
    onSuccess: () => {
      invalidateCache.financialGoals();
      closeFormModal();
      setShowDepositModal(false);
      setDepositAmount('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => financialGoalsService.delete(id),
    onSuccess: () => invalidateCache.financialGoals(),
  });

  // 表单操作
  const openCreateModal = () => {
    setEditingGoal(null);
    setFormName('');
    setFormTarget('');
    setFormDeadline('');
    setFormIcon('🎯');
    setShowFormModal(true);
  };

  const openEditModal = (goal: FinancialGoalProgress) => {
    setEditingGoal(goal);
    setFormName(goal.name);
    setFormTarget(String(goal.targetAmount));
    setFormDeadline(goal.deadline ? goal.deadline.split('T')[0] : '');
    setFormIcon(goal.icon || '🎯');
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingGoal(null);
  };

  const openDepositModal = (goal: FinancialGoalProgress) => {
    setDepositGoal(goal);
    setDepositAmount('');
    setShowDepositModal(true);
  };

  const handleSubmitForm = () => {
    const target = parseFloat(formTarget);
    if (!formName.trim() || isNaN(target) || target <= 0) {return;}

    const payload = {
      name: formName.trim(),
      targetAmount: target,
      deadline: formDeadline || undefined,
      icon: formIcon,
    };

    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeposit = () => {
    if (!depositGoal) {return;}
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount === 0) {return;}

    const newAmount = depositGoal.currentAmount + amount;
    const isCompleted = newAmount >= depositGoal.targetAmount;

    updateMutation.mutate({
      id: depositGoal.id,
      data: {
        currentAmount: Math.max(0, newAmount),
        isCompleted,
      },
    });
  };

  const handleDelete = (goal: FinancialGoalProgress) => {
    confirm(
      '删除目标',
      `确定要删除「${goal.name}」吗？此操作不可撤销。`,
      () => deleteMutation.mutate(goal.id),
      undefined,
      { confirmText: '删除', destructive: true },
    );
  };

  const handleToggleComplete = (goal: FinancialGoalProgress) => {
    updateMutation.mutate({
      id: goal.id,
      data: { isCompleted: !goal.isCompleted },
    });
  };

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const formatDeadline = (deadline?: string) => {
    if (!deadline) {return null;}
    const d = new Date(deadline);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (diff < 0) {return `已过期 (${dateStr})`;}
    if (diff === 0) {return '今天截止';}
    if (diff <= 30) {return `剩余 ${diff} 天`;}
    return dateStr;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={styles._colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>财务目标</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Plus size={20} color={styles._colors.textPrimary} strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{totalGoals}</Text>
          <Text style={styles.summaryLabel}>个目标</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{completedGoals}</Text>
          <Text style={styles.summaryLabel}>已完成</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{totalGoals - completedGoals}</Text>
          <Text style={styles.summaryLabel}>进行中</Text>
        </View>
      </View>

      {/* Goal List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>还没有财务目标</Text>
            <Text style={styles.emptySubtext}>设定一个目标，开始你的储蓄计划</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
              <Text style={styles.emptyButtonText}>创建目标</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => (
            <View key={goal.id} style={[
              styles.goalCard,
              goal.isCompleted && styles.goalCardCompleted,
            ]}>
              {/* Card Header */}
              <View style={styles.goalHeader}>
                <View style={styles.goalTitleRow}>
                  <View style={[styles.goalIconBox, goal.color ? { backgroundColor: goal.color + '30' } : undefined]}>
                    <Text style={styles.goalIconText}>{goal.icon || '🎯'}</Text>
                  </View>
                  <View style={styles.goalTitleGroup}>
                    <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                    {goal.deadline && (
                      <Text style={styles.goalDeadline}>{formatDeadline(goal.deadline)}</Text>
                    )}
                  </View>
                </View>
                <View style={[
                  styles.percentBadge,
                  goal.isCompleted ? styles.completedBadge : undefined,
                ]}>
                  <Text style={[
                    styles.percentText,
                    goal.isCompleted ? styles.completedBadgeText : undefined,
                  ]}>
                    {goal.isCompleted ? '✓' : `${Math.round(goal.progress)}%`}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.goalProgressContainer}>
                <ProgressBar
                  progress={goal.progress}
                  color={goal.isCompleted ? styles._colors.success : (goal.color || styles._colors.primary)}
                  backgroundColor={styles._colors.divider}
                  height={14}
                  style={styles.goalProgressBar}
                />
              </View>

              {/* Amounts */}
              <View style={styles.goalAmounts}>
                <Text style={styles.goalAmountCurrent}>
                  ¥{goal.currentAmount.toLocaleString()}
                </Text>
                <Text style={styles.goalAmountTarget}>
                  / ¥{goal.targetAmount.toLocaleString()}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.goalActions}>
                <BrutalPressable
                  style={styles.depositButton}
                  shadowOffset={2}
                  shadowColor={styles._colors.stroke}
                  onPress={() => openDepositModal(goal)}
                >
                  <Text style={styles.depositButtonText}>存入</Text>
                </BrutalPressable>
                <BrutalPressable
                  style={styles.editButton}
                  shadowOffset={2}
                  shadowColor={styles._colors.stroke}
                  onPress={() => openEditModal(goal)}
                >
                  <Text style={styles.editButtonText}>编辑</Text>
                </BrutalPressable>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(goal)}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGoal ? '编辑目标' : '新建目标'}
            </Text>

            <Text style={styles.inputLabel}>目标名称</Text>
            <TextInput
              style={styles.textInput}
              value={formName}
              onChangeText={setFormName}
              placeholder="如：攒首付、年度存款5万"
              placeholderTextColor={styles._colors.textTertiary}
              maxLength={50}
            />

            <Text style={styles.inputLabel}>目标金额</Text>
            <TextInput
              style={styles.textInput}
              value={formTarget}
              onChangeText={setFormTarget}
              placeholder="0.00"
              placeholderTextColor={styles._colors.textTertiary}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>截止日期（可选，格式 YYYY-MM-DD）</Text>
            <TextInput
              style={styles.textInput}
              value={formDeadline}
              onChangeText={setFormDeadline}
              placeholder="2026-12-31"
              placeholderTextColor={styles._colors.textTertiary}
              maxLength={10}
            />

            <Text style={styles.inputLabel}>选择图标</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    formIcon === icon && styles.iconOptionSelected,
                  ]}
                  onPress={() => setFormIcon(icon)}
                >
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeFormModal}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, (!formName.trim() || !formTarget) && styles.submitButtonDisabled]}
                onPress={handleSubmitForm}
                disabled={!formName.trim() || !formTarget || createMutation.isPending || updateMutation.isPending}
              >
                <Text style={styles.submitButtonText}>
                  {editingGoal ? '保存' : '创建'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal visible={showDepositModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {depositGoal?.icon} {depositGoal?.name}
            </Text>
            <Text style={styles.depositInfo}>
              当前 ¥{depositGoal?.currentAmount.toLocaleString()} / 目标 ¥{depositGoal?.targetAmount.toLocaleString()}
            </Text>

            <Text style={styles.inputLabel}>存入/取出金额</Text>
            <TextInput
              style={styles.textInput}
              value={depositAmount}
              onChangeText={setDepositAmount}
              placeholder="输入正数存入，负数取出"
              placeholderTextColor={styles._colors.textTertiary}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { setShowDepositModal(false); setDepositAmount(''); }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, !depositAmount && styles.submitButtonDisabled]}
                onPress={handleDeposit}
                disabled={!depositAmount || updateMutation.isPending}
              >
                <Text style={styles.submitButtonText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
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

    // ===== Goal Card =====
    goalCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadow.small,
    },
    goalCardCompleted: {
      opacity: 0.7,
    },
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    goalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: spacing.md,
    },
    goalIconBox: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent + '30',
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalIconText: {
      fontSize: 22,
    },
    goalTitleGroup: {
      flex: 1,
    },
    goalName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    goalDeadline: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    percentBadge: {
      backgroundColor: colors.accent,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      marginLeft: spacing.sm,
    },
    completedBadge: {
      backgroundColor: colors.success,
    },
    percentText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'Courier',
    },
    completedBadgeText: {
      color: '#FFFFFF',
    },

    // Progress
    goalProgressContainer: {
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    goalProgressBar: {},

    // Amounts
    goalAmounts: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: spacing.md,
    },
    goalAmountCurrent: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'Courier',
    },
    goalAmountTarget: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginLeft: spacing.xs,
    },

    // Actions
    goalActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    depositButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.successLight,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.thin,
      borderColor: colors.success,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    depositButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    editButton: {
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
      paddingHorizontal: spacing.xl,
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
    depositInfo: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'Courier',
      marginBottom: spacing.sm,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    iconOption: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconOptionSelected: {
      borderColor: colors.stroke,
      backgroundColor: colors.accent + '40',
      borderWidth: borderWidth.medium,
    },
    iconOptionText: {
      fontSize: 22,
    },
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
