/**
 * IncomeExpenseTab - 收支页签
 * 包含 日收支/月收支/年收支 三个子 Tab
 * 管理跨 Tab 跳转逻辑
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import { SegmentedControl } from '../../components/ui';
import DailyView from './DailyView';
import MonthlyView from './MonthlyView';
import YearlyView from './YearlyView';

type SubTab = 'daily' | 'monthly' | 'yearly';

const SUB_TAB_OPTIONS = [
  { key: 'daily', label: '日收支' },
  { key: 'monthly', label: '月收支' },
  { key: 'yearly', label: '年收支' },
];

export default function IncomeExpenseTab() {
  const styles = useStyles(createStyles);
  const [subTab, setSubTab] = useState<SubTab>('daily');

  // 日收支导航状态
  const [dailyYear, setDailyYear] = useState<number | undefined>(undefined);
  const [dailyMonth, setDailyMonth] = useState<number | undefined>(undefined);
  const [dailySelectedDay, setDailySelectedDay] = useState<string | null>(null);

  // 月收支导航状态
  const [monthlyYear, setMonthlyYear] = useState<number | undefined>(undefined);
  const [monthlySelectedMonth, setMonthlySelectedMonth] = useState<number | null>(null);

  // 从月收支/年收支跳转到日收支
  const handleJumpToDaily = useCallback((year: number, month: number, day?: string) => {
    setDailyYear(year);
    setDailyMonth(month);
    setDailySelectedDay(day || null);
    setSubTab('daily');
  }, []);

  // 从年收支跳转到月收支
  const handleJumpToMonthly = useCallback((year: number, month?: number) => {
    setMonthlyYear(year);
    setMonthlySelectedMonth(month || null);
    setSubTab('monthly');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <SegmentedControl
          options={SUB_TAB_OPTIONS}
          selectedKey={subTab}
          onSelect={(key) => setSubTab(key as SubTab)}
        />
      </View>

      <View style={styles.content}>
        {subTab === 'daily' && (
          <DailyView
            initialYear={dailyYear}
            initialMonth={dailyMonth}
            initialSelectedDay={dailySelectedDay}
          />
        )}
        {subTab === 'monthly' && (
          <MonthlyView
            initialYear={monthlyYear}
            initialSelectedMonth={monthlySelectedMonth}
            onJumpToDaily={handleJumpToDaily}
          />
        )}
        {subTab === 'yearly' && (
          <YearlyView
            onJumpToMonthly={handleJumpToMonthly}
          />
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
    },
    tabBar: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    content: {
      flex: 1,
    },
  }),
  _colors: colors,
});
