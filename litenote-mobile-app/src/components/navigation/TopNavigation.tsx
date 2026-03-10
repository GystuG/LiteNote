/**
 * 顶部导航栏组件 - Neo-Brutalism 风格
 * 粗描边底线 + 粗标题 + 描边图标按钮
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth } from '../../theme/spacing';
import { useStyles } from '../../hooks';

interface TopNavigationProps {
  title: string;
  showSearch?: boolean;
  showSettings?: boolean;
  onSearchPress?: () => void;
  onSettingsPress?: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  title,
  showSearch = true,
  showSettings = true,
  onSearchPress,
  onSettingsPress,
}) => {
  const styles = useStyles(createStyles);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.actions}>
          {showSearch && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSearchPress}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>🔍</Text>
            </TouchableOpacity>
          )}

          {showSettings && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSettingsPress}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderBottomWidth: borderWidth.medium,
      borderBottomColor: colors.stroke,
      zIndex: 100,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      minHeight: 56,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      lineHeight: 24,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      fontSize: 18,
    },
  }),
  _colors: colors,
});

export default TopNavigation;
