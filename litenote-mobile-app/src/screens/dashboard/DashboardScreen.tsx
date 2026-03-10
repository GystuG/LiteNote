/**
 * Dashboard 首页 - Neo-Brutalism 风格
 * 粗线框、饱和糖果色块、粗描边、平移阴影
 * 像彩色积木构成的界面
 */
import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { ProgressBar, BrutalPressable } from '../../components/ui';
import { DashboardSkeleton } from '../../components/skeleton';
import { useDashboard, useStyles } from '../../hooks';
import { budgetsService } from '../../services/api/budgets';
import { financialGoalsService } from '../../services/api/financial-goals';
import { QUERY_KEYS } from '../../lib/queryClient';
import type { BillData } from '../../types/bill';
import type { BudgetProgress } from '../../types/budget';
import type { FinancialGoalProgress } from '../../types/financial-goal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY = 0.3;

/** 统一的进度卡片数据 */
interface ProgressCardItem {
  id: string;
  type: 'budget' | 'goal';
  title: string;
  icon: string;
  progress: number;
  currentAmount: number;
  totalAmount: number;
  color: string;
  labelLeft: string;
  labelRight: string;
}

/**
 * 可滑动丢弃的卡片堆叠组件
 * 跟随手指方向甩出，露出下方卡片
 */
function SwipeableCardStack({
  cards,
  styles,
  colors,
}: {
  cards: ProgressCardItem[];
  styles: any;
  colors: ThemeColors;
}) {
  const [topIndex, setTopIndex] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;

  // 当 cards 变化时重置
  useEffect(() => {
    setTopIndex(0);
    pan.setValue({ x: 0, y: 0 });
  }, [cards.length]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: (_, g) => {
        const dist = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
        const vel = Math.sqrt(g.vx * g.vx + g.vy * g.vy);
        const shouldDismiss = dist > SWIPE_THRESHOLD || vel > SWIPE_VELOCITY;

        if (shouldDismiss && cards.length > 1) {
          // 沿滑动方向飞出（放大到屏幕外）
          const scale = SCREEN_WIDTH * 1.5 / Math.max(dist, 1);
          const toX = g.dx * scale;
          const toY = g.dy * scale;
          Animated.timing(pan, {
            toValue: { x: toX, y: toY },
            duration: 280,
            useNativeDriver: true,
          }).start(() => {
            setTopIndex((prev) => (prev + 1) % cards.length);
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          // 弹回原位
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  if (cards.length === 0) {return null;}

  const topRotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  // 只渲染最多 3 张（从底到顶）
  const visibleCount = Math.min(cards.length, 3);
  const rendered = [];

  for (let i = visibleCount - 1; i >= 0; i--) {
    const cardIndex = (topIndex + i) % cards.length;
    const card = cards[cardIndex];
    const isTop = i === 0;

    const cardStyle: any = {
      position: i === 0 && cards.length === 1 ? 'relative' : 'absolute',
      left: 0,
      right: 0,
      top: i * 6,
      zIndex: visibleCount - i,
      opacity: i === 2 ? 0.4 : i === 1 ? 0.7 : 1,
      transform: isTop
        ? [{ translateX: pan.x }, { translateY: pan.y }, { rotate: topRotate }]
        : [{ scale: 1 - i * 0.03 }],
    };

    rendered.push(
      <Animated.View
        key={card.id + '-' + cardIndex}
        style={[styles.progressCard, cardStyle]}
        {...(isTop ? panResponder.panHandlers : {})}
      >
        <View style={styles.progressCardHeader}>
          <View style={styles.budgetTitleRow}>
            <Text style={styles.sectionSticker}>{card.icon}</Text>
            <View>
              <Text style={styles.progressCardTitle}>{card.title}</Text>
              <Text style={styles.progressCardType}>
                {card.type === 'budget' ? '预算' : '目标'}
              </Text>
            </View>
          </View>
          <View style={[
            styles.budgetPercentBadge,
            card.progress >= 100 && card.type === 'goal'
              ? { backgroundColor: colors.success }
              : undefined,
          ]}>
            <Text style={[
              styles.budgetPercentText,
              card.progress >= 100 && card.type === 'goal'
                ? { color: '#FFFFFF' }
                : undefined,
            ]}>
              {Math.round(card.progress)}%
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <ProgressBar
            progress={card.progress}
            color={card.color}
            backgroundColor={colors.divider}
            height={16}
            style={styles.budgetProgressBar}
          />
        </View>
        <View style={styles.budgetLabels}>
          <Text style={styles.budgetLabel}>{card.labelLeft}</Text>
          <Text style={styles.budgetLabel}>{card.labelRight}</Text>
        </View>
      </Animated.View>,
    );
  }

  return rendered;
}

/**
 * 列表项入场动画 - 交错滑入 + 淡入
 * 每个 item 延迟 index * 80ms，从下方 24px 滑入
 */
function AnimatedListItem({ children, index }: { children: React.ReactNode; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [24, 0],
          }),
        }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const styles = useStyles(createStyles);
  const {
    recentBills,
    monthIncome,
    monthExpense,
    monthBalance,
    isLoading,
    isFetching,
    refetch,
  } = useDashboard();

  // 预算进度查询
  const { data: budgetProgressData, refetch: refetchBudgets } = useQuery({
    queryKey: QUERY_KEYS.budgetProgress,
    queryFn: async () => {
      const res = await budgetsService.getProgress();
      return Array.isArray(res) ? res : (res.data ?? []);
    },
  });

  // 财务目标进度查询
  const { data: goalProgressData, refetch: refetchGoals } = useQuery({
    queryKey: QUERY_KEYS.financialGoals,
    queryFn: async () => {
      const res = await financialGoalsService.getProgress();
      return Array.isArray(res) ? res : (res.data ?? []);
    },
  });

  // 合并为统一的卡片数据（预算优先，财务目标补充）
  const progressCards: ProgressCardItem[] = useMemo(() => {
    const cards: ProgressCardItem[] = [];

    // 预算卡片（实时数据，优先展示）
    (budgetProgressData ?? []).forEach((b: BudgetProgress) => {
      cards.push({
        id: `budget-${b.id}`,
        type: 'budget',
        title: b.name,
        icon: '📊',
        progress: b.progress,
        currentAmount: b.spent,
        totalAmount: Number(b.amount),
        color: styles._colors.primary,
        labelLeft: `已用 ¥${b.spent.toLocaleString()}`,
        labelRight: `剩余 ¥${Math.max(0, b.remaining).toLocaleString()}`,
      });
    });

    // 财务目标卡片（手动维护，作为补充）
    (goalProgressData ?? []).filter((g: FinancialGoalProgress) => !g.isCompleted).forEach((g: FinancialGoalProgress) => {
      cards.push({
        id: `goal-${g.id}`,
        type: 'goal',
        title: g.name,
        icon: g.icon || '🎯',
        progress: g.progress,
        currentAmount: g.currentAmount,
        totalAmount: g.targetAmount,
        color: g.color || styles._colors.success,
        labelLeft: `已存 ¥${g.currentAmount.toLocaleString()}`,
        labelRight: `目标 ¥${g.targetAmount.toLocaleString()}`,
      });
    });

    return cards;
  }, [budgetProgressData, goalProgressData, styles._colors]);

  const currentDate = new Date();
  const monthName = `${currentDate.getMonth() + 1}月账本`;
  const yearName = `${currentDate.getFullYear()}`;

  const onRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchBudgets(), refetchGoals()]);
  }, [refetch, refetchBudgets, refetchGoals]);

  const handleAddBill = () => {
    navigation.navigate('CreateBill' as never);
  };

  const handleViewAllBills = () => {
    navigation.navigate('AllBills');
  };

  const handleViewExpense = () => {
    navigation.navigate('AllBills', { initialFilter: 'expense' });
  };

  const handleViewIncome = () => {
    navigation.navigate('AllBills', { initialFilter: 'income' });
  };

  const handleViewBillDetail = (bill: BillData) => {
    navigation.navigate('CreateBill', { bill });
  };

  // 分类图标
  const getCategoryIcon = (categoryName?: string): string => {
    const iconMap: { [key: string]: string } = {
      '餐饮': '☕',
      '交通': '🚗',
      '购物': '🛍️',
      '收入': '💰',
      '工资': '💼',
      '娱乐': '🎮',
      '医疗': '🏥',
      '教育': '📚',
    };
    return iconMap[categoryName || ''] || '📝';
  };

  // Neo-Brutalism 分类色块 - 饱和糖果色
  const getCategoryBlockColor = (categoryName?: string): string => {
    const colorMap: { [key: string]: string } = {
      '餐饮': '#FACC15',    // 明黄
      '交通': '#3B82F6',    // 蓝
      '购物': '#EC4899',    // 粉
      '收入': '#22C55E',    // 绿
      '工资': '#22C55E',    // 绿
      '娱乐': '#A855F7',    // 紫
      '医疗': '#EF4444',    // 红
      '教育': '#F97316',    // 橙
    };
    return colorMap[categoryName || ''] || '#E5E5E5';
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ========== Header ========== */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{monthName}</Text>
            <Text style={styles.headerSticker}>✦</Text>
          </View>
          <Text style={styles.headerSubtitle}>{yearName}</Text>
        </View>
      </View>

      {/* ========== Overview Card - 主色块 ========== */}
      <TouchableOpacity style={styles.overviewCard} activeOpacity={0.95}>
        {/* 装饰贴纸 */}
        <View style={styles.stickerTopRight}>
          <Text style={styles.stickerText}>⚡</Text>
        </View>
        <View style={styles.overviewContent}>
          <Text style={styles.overviewLabel}>本月结余</Text>
          <Text style={styles.overviewBalance}>¥ {monthBalance.toFixed(2)}</Text>

          <View style={styles.overviewDivider} />

          <View style={styles.overviewStats}>
            <TouchableOpacity style={styles.statBlock} onPress={handleViewExpense}>
              <View style={styles.statIconBlock}>
                <Text style={styles.statIcon}>↘</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>总支出</Text>
                <Text style={styles.statValue}>¥ {monthExpense.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statBlockGreen} onPress={handleViewIncome}>
              <View style={styles.statIconBlockGreen}>
                <Text style={styles.statIcon}>↗</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>总收入</Text>
                <Text style={styles.statValue}>¥ {monthIncome.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* ========== Progress Cards - 预算 & 财务目标 ========== */}
      {progressCards.length > 0 ? (
        <View style={[styles.carouselWrapper, { minHeight: 160 }]}>
          <SwipeableCardStack
            cards={progressCards}
            styles={styles}
            colors={styles._colors}
          />
        </View>
      ) : (
        <TouchableOpacity
          style={styles.progressEmptyCard}
          onPress={() => navigation.navigate('FinancialGoals' as never)}
          activeOpacity={0.8}
        >
          <Text style={styles.progressEmptyIcon}>📊</Text>
          <Text style={styles.progressEmptyText}>设置预算或财务目标来追踪进度</Text>
          <Text style={styles.progressEmptyHint}>点击前往设置 →</Text>
        </TouchableOpacity>
      )}

      {/* ========== Recent Transactions ========== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionSticker}>📋</Text>
            <Text style={styles.sectionTitle}>近期交易</Text>
          </View>
          <BrutalPressable
            onPress={handleViewAllBills}
            style={styles.viewAllButton}
            shadowOffset={2}
            shadowColor={styles._colors.stroke}
          >
            <Text style={styles.viewAllText}>查看全部 →</Text>
          </BrutalPressable>
        </View>

        {recentBills.length > 0 ? (
          <View style={styles.transactionList}>
            {recentBills.map((bill, index) => (
              <AnimatedListItem key={bill.id} index={index}>
                <BrutalPressable
                  style={styles.transactionItem}
                  shadowOffset={3}
                  shadowColor={styles._colors.stroke}
                  onPress={() => handleViewBillDetail(bill)}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: getCategoryBlockColor(bill.category?.name) },
                    ]}>
                      <Text style={styles.transactionIconText}>
                        {bill.category?.icon || getCategoryIcon(bill.category?.name)}
                      </Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {bill.description || bill.category?.name || '未分类'}
                      </Text>
                      <Text style={styles.transactionMeta}>
                        {new Date(bill.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} · {bill.category?.name || '未分类'}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.amountBadge,
                    bill.type === 'income' ? styles.incomeBadge : styles.expenseBadge,
                  ]}>
                    <Text style={[
                      styles.transactionAmount,
                      bill.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                    ]}>
                      {bill.type === 'income' ? '+' : '-'}¥{Number(bill.amount).toFixed(2)}
                    </Text>
                  </View>
                </BrutalPressable>
              </AnimatedListItem>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>暂无交易记录</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddBill}>
              <Text style={styles.emptyButtonText}>添加第一笔</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Neo-Brutalism 样式
const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: 80,
    },

    // ===== Header =====
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xxl,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    headerSticker: {
      fontSize: 20,
      color: colors.accent,
    },
    headerSubtitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textTertiary,
      marginTop: spacing.xs,
      fontFamily: 'Courier',
    },

    // ===== Overview Card =====
    overviewCard: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thick,
      borderColor: colors.stroke,
      overflow: 'hidden',
      marginBottom: spacing.xxl,
      ...shadow.large,
    },
    stickerTopRight: {
      position: 'absolute',
      right: 12,
      top: 12,
      width: 40,
      height: 40,
      borderRadius: borderRadius.small,
      backgroundColor: colors.accent,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: '12deg' }],
      zIndex: 10,
    },
    stickerText: {
      fontSize: 20,
    },
    overviewContent: {
      padding: spacing.xl,
    },
    overviewLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.85)',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    overviewBalance: {
      fontSize: 40,
      fontWeight: '900',
      color: '#FFFFFF',
      marginTop: spacing.sm,
      letterSpacing: -1.5,
    },
    overviewDivider: {
      height: borderWidth.thin,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      marginVertical: spacing.lg,
    },
    overviewStats: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    statBlock: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      borderRadius: borderRadius.medium,
      padding: spacing.md,
      borderWidth: borderWidth.thin,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statBlockGreen: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      borderRadius: borderRadius.medium,
      padding: spacing.md,
      borderWidth: borderWidth.thin,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statIconBlock: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.small,
      backgroundColor: colors.error,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIconBlockGreen: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.small,
      backgroundColor: colors.success,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIcon: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '800',
    },
    statLabel: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '600',
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },

    // ===== Progress Cards Stack =====
    carouselWrapper: {
      marginBottom: spacing.md,
      position: 'relative',
    },
    progressCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.lg,
      ...shadow.medium,
    },
    progressCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    progressCardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    progressCardType: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textTertiary,
      fontFamily: 'Courier',
      marginTop: 1,
    },

    // Budget card styles (reused for progress cards)
    budgetTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    budgetPercentBadge: {
      backgroundColor: colors.accent,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    budgetPercentText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'Courier',
    },
    progressBarContainer: {
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    budgetProgressBar: {
    },
    budgetLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    budgetLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      fontFamily: 'Courier',
    },

    // Progress empty state
    progressEmptyCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      borderStyle: 'dashed',
      padding: spacing.xl,
      marginBottom: spacing.xxl,
      alignItems: 'center',
    },
    progressEmptyIcon: {
      fontSize: 32,
      marginBottom: spacing.sm,
    },
    progressEmptyText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textTertiary,
      textAlign: 'center',
    },
    progressEmptyHint: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginTop: spacing.sm,
    },

    // ===== Section =====
    section: {
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sectionSticker: {
      fontSize: 18,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    viewAllButton: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    // ===== Transaction List =====
    transactionList: {
      gap: spacing.md,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    transactionIconText: {
      fontSize: 22,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    transactionMeta: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      fontFamily: 'Courier',
    },
    amountBadge: {
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    incomeBadge: {
      backgroundColor: '#DCFCE7',
    },
    expenseBadge: {
      backgroundColor: '#FEE2E2',
    },
    transactionAmount: {
      fontSize: 15,
      fontWeight: '800',
      fontFamily: 'Courier',
    },
    incomeAmount: {
      color: '#16A34A',
    },
    expenseAmount: {
      color: '#DC2626',
    },

    // ===== Empty State =====
    emptyState: {
      alignItems: 'center',
      padding: spacing.xxl,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      ...shadow.medium,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textTertiary,
      marginBottom: spacing.lg,
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

  }),
  _colors: colors,
});
