/**
 * 账单详情页面 - Neo-Brutalism 风格
 * 粗描边详情卡片 + 大糖果色分类图标 + Courier 金额
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { billsService } from '../../services';
import { invalidateCache } from '../../lib/queryClient';
import { useStyles } from '../../hooks';
import { useAlert } from '../../providers';
import type { BillData } from '../../types/bill';

export default function BillDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { billId } = route.params as { billId: number };
  const styles = useStyles(createStyles);
  const { alert, confirm } = useAlert();

  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchBill = useCallback(async () => {
    try {
      setLoading(true);
      const response = await billsService.getBillById(billId);
      setBill(response.data || null);
    } catch (error) {
      console.error('Failed to fetch bill:', error);
      alert('错误', '获取账单详情失败');
    } finally {
      setLoading(false);
    }
  }, [billId, alert]);

  useEffect(() => {
    fetchBill();
  }, [fetchBill]);

  const handleEdit = () => {
    if (bill) {
      navigation.navigate('CreateBill' as any, { bill });
    }
  };

  const handleDelete = () => {
    confirm(
      '确认删除',
      '确定要删除这条账单记录吗？此操作不可撤销。',
      async () => {
        try {
          setDeleting(true);
          await billsService.deleteBill(billId);
          invalidateCache.bills();
          navigation.goBack();
        } catch (error) {
          console.error('Failed to delete bill:', error);
          alert('错误', '删除账单失败');
        } finally {
          setDeleting(false);
        }
      },
      undefined,
      { confirmText: '删除', destructive: true }
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={styles._colors.primary} />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>账单不存在</Text>
      </View>
    );
  }

  const isExpense = bill.type === 'expense';
  const typeLabel = isExpense ? '支出' : '收入';
  const amountColor = isExpense ? styles._colors.expense : styles._colors.income;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* 金额区域 */}
        <View style={styles.amountSection}>
          <View style={styles.categoryIconBlock}>
            <Text style={styles.categoryEmoji}>{bill.category?.icon || '📝'}</Text>
          </View>
          <Text style={[styles.typeBadge, { backgroundColor: isExpense ? styles._colors.expense + '20' : styles._colors.income + '20', color: amountColor }]}>
            {typeLabel}
          </Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            ¥ {Number(bill.amount).toFixed(2)}
          </Text>
          <Text style={styles.categoryLabel}>{bill.category?.name || '未分类'}</Text>
        </View>

        {/* 详情卡片 */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>分类</Text>
            <View style={styles.detailValueContainer}>
              {bill.category?.icon && <Text style={styles.detailIcon}>{bill.category.icon}</Text>}
              <Text style={styles.detailValue}>{bill.category?.name || '未分类'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>时间</Text>
            <Text style={styles.detailValueCourier}>{`${formatDate(bill.date)} ${formatTime(bill.createdAt)}`}</Text>
          </View>
          {bill.description && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>描述</Text>
                <Text style={styles.detailValue}>{bill.description}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={styles._colors.error} />
          ) : (
            <Text style={styles.deleteButtonText}>删除</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    errorText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textTertiary,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxxl,
    },
    amountSection: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      marginBottom: spacing.lg,
      padding: spacing.xl,
    },
    categoryIconBlock: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    categoryEmoji: {
      fontSize: 32,
    },
    typeBadge: {
      fontSize: 13,
      fontWeight: '800',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    amount: {
      fontSize: 40,
      fontWeight: '800',
      fontFamily: 'Courier',
      letterSpacing: -1,
      marginBottom: spacing.sm,
    },
    categoryLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    detailCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      overflow: 'hidden',
      marginBottom: spacing.lg,
      ...shadow.small,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textTertiary,
    },
    detailValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    detailIcon: {
      fontSize: 16,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    detailValueCourier: {
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Courier',
      color: colors.textPrimary,
    },
    divider: {
      height: borderWidth.thin,
      backgroundColor: colors.stroke,
      marginHorizontal: spacing.lg,
    },
    bottomActions: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      backgroundColor: colors.surface,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
    },
    editButton: {
      flex: 1,
      height: 48,
      borderRadius: borderRadius.button,
      backgroundColor: colors.primary,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.small,
    },
    editButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    deleteButton: {
      flex: 1,
      height: 48,
      borderRadius: borderRadius.button,
      backgroundColor: colors.error + '15',
      borderWidth: borderWidth.thin,
      borderColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.error,
    },
  }),
  _colors: colors,
});
