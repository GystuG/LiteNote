/**
 * 底部导航栏组件 - Neo-Brutalism 风格
 * 粗描边顶线 + 糖果色活跃态 + 粗字重
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';

export interface NavigationItem {
  key: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

interface BottomNavigationProps {
  items: NavigationItem[];
  activeKey: string;
  onItemPress: (key: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeKey,
  onItemPress,
}) => {
  const styles = useStyles(createStyles);

  const renderNavItem = (item: NavigationItem) => {
    const isActive = item.key === activeKey;

    return (
      <TouchableOpacity
        key={item.key}
        style={styles.navItem}
        onPress={() => onItemPress(item.key)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.navIconContainer,
          isActive && styles.navIconContainerActive,
        ]}>
          <Text style={styles.navIcon}>
            {item.icon}
          </Text>
        </View>
        <Text style={[
          styles.navLabel,
          { color: isActive ? styles._colors.primary : styles._colors.textTertiary },
          isActive && styles.navLabelActive,
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigation}>
        {items.map((item) => renderNavItem(item))}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderTopWidth: borderWidth.medium,
      borderTopColor: colors.stroke,
      ...shadow.small,
    },
    navigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      height: 80,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
    },
    navIconContainer: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    navIconContainerActive: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
    },
    navIcon: {
      fontSize: 20,
    },
    navLabel: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    navLabelActive: {
      fontWeight: '700',
    },
  }),
  _colors: colors,
});

export default BottomNavigation;
