/**
 * 统计报表主屏幕 - Neo-Brutalism 风格
 * 双 Tab 架构：资产 | 收支
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import { SegmentedControl } from '../../components/ui';
import AssetsTab from './AssetsTab';
import IncomeExpenseTab from './IncomeExpenseTab';

type TopTab = 'assets' | 'incomeExpense';

const TOP_TAB_OPTIONS = [
  { key: 'assets', label: '资产' },
  { key: 'incomeExpense', label: '收支' },
];

export default function ReportsScreen() {
  const styles = useStyles(createStyles);
  const [topTab, setTopTab] = useState<TopTab>('incomeExpense');

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <SegmentedControl
          options={TOP_TAB_OPTIONS}
          selectedKey={topTab}
          onSelect={(key) => setTopTab(key as TopTab)}
        />
      </View>

      <View style={styles.content}>
        {topTab === 'assets' ? <AssetsTab /> : <IncomeExpenseTab />}
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
    tabBar: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
  }),
  _colors: colors,
});
