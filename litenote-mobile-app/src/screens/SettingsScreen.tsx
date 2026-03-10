/**
 * 设置屏幕 - Neo-Brutalism 风格
 * 描边用户卡片 + 糖果色图标块 + 描边设置分组
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import {
  Wallet,
  Flag,
  Settings,
  Moon,
  Info,
  RefreshCw,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react-native';
import { ThemeColors } from '../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../theme';
import { useStyles, useAppUpdate } from '../hooks';
import { useTheme, useAuth, useAlert } from '../providers';
import { UpdateModal } from '../components/UpdateModal';
import { getAvatarUrl } from '../utils/url';

interface SettingsScreenProps {
  navigation?: any;
}

// 设置项类型定义
interface BaseSettingItem {
  id: string;
  label: string;
  icon: string;
}

interface PressableSettingItem extends BaseSettingItem {
  isSwitch?: false;
  onPress: () => void;
}

interface SwitchSettingItem extends BaseSettingItem {
  isSwitch: true;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

type SettingItem = PressableSettingItem | SwitchSettingItem;

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

// 糖果色图标背景映射
const ICON_CANDY_COLORS: Record<string, string> = {
  wallet: '#FFD93D',
  flag: '#FF90B3',
  settings: '#7EB6FF',
  moon: '#C5A3FF',
  info: '#7DCEA0',
  refresh: '#FFB366',
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { confirm } = useAlert();
  const styles = useStyles(createStyles);

  const {
    showModal,
    latestVersion,
    downloading,
    progress,
    currentVersion,
    checkUpdate,
    hideModal,
    downloadAndInstall,
  } = useAppUpdate({ autoCheck: false });

  const iconMap: Record<string, React.FC<{ size: number; color: string }>> = {
    wallet: Wallet,
    flag: Flag,
    settings: Settings,
    moon: Moon,
    info: Info,
    refresh: RefreshCw,
  };

  const settingGroups: SettingGroup[] = [
    {
      title: '💰 财务',
      items: [
        { id: 'budget-manage', label: '预算管理', icon: 'wallet', onPress: () => navigation?.navigate('Budgets') },
        { id: 'financial-goals', label: '财务目标', icon: 'flag', onPress: () => navigation?.navigate('FinancialGoals') },
      ],
    },
    {
      title: '⚙️ 应用',
      items: [
        {
          id: 'general-settings',
          label: '通用配置',
          icon: 'settings',
          onPress: () => navigation?.navigate('GeneralSettings'),
        },
      ],
    },
    {
      title: '🎨 显示',
      items: [
        {
          id: 'dark-mode',
          label: '深色模式',
          icon: 'moon',
          isSwitch: true,
          value: isDark,
          onValueChange: toggleTheme,
        },
      ],
    },
    {
      title: 'ℹ️ 关于',
      items: [
        { id: 'about', label: '关于应用', icon: 'info', onPress: () => {} },
        { id: 'check-update', label: '检测升级', icon: 'refresh', onPress: checkUpdate },
      ],
    },
  ];

  const handleLogout = () => {
    confirm(
      '退出登录',
      '确定要退出登录吗？',
      async () => {
        try {
          await logout();
        } catch (error) {
          console.error('退出登录失败', error);
        }
      },
      undefined,
      { confirmText: '确定', destructive: true }
    );
  };

  const displayAvatar = getAvatarUrl(user?.avatar);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => navigation?.navigate('EditProfile')}
        activeOpacity={0.8}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={32} color={styles._colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.nickname || user?.username || '用户'}</Text>
            <Text style={styles.userType}>{user?.email || '智能记账用户'}</Text>
          </View>
          <ChevronRight size={24} color={styles._colors.stroke} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {settingGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.settingGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupItems}>
              {group.items.map((item) => {
                const IconComponent = iconMap[item.icon];
                const candyColor = ICON_CANDY_COLORS[item.icon] || styles._colors.accent;
                return (
                <View key={item.id}>
                  {item.isSwitch ? (
                    <View style={styles.settingItem}>
                      <View style={styles.settingLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: candyColor }]}>
                          {IconComponent && <IconComponent size={20} color={styles._colors.stroke} />}
                        </View>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                      </View>
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: styles._colors.divider, true: styles._colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.settingItem}
                      onPress={item.onPress}
                      activeOpacity={0.8}
                    >
                      <View style={styles.settingLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: candyColor }]}>
                          {IconComponent && <IconComponent size={20} color={styles._colors.stroke} />}
                        </View>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                      </View>
                      <ChevronRight size={20} color={styles._colors.textTertiary} strokeWidth={2.5} />
                    </TouchableOpacity>
                  )}
                </View>
              )})}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={20} color={styles._colors.error} strokeWidth={2.5} />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>版本 {currentVersion}</Text>
          <Text style={styles.copyrightText}>© 2026 LiteNote</Text>
        </View>
      </ScrollView>

      <UpdateModal
        visible={showModal}
        versionInfo={latestVersion}
        downloading={downloading}
        progress={progress}
        onConfirm={downloadAndInstall}
        onCancel={hideModal}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.lg,
      ...shadow.small,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatarContainer: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.medium,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    userType: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    scrollView: {
      flex: 1,
    },
    settingGroup: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    groupTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    groupItems: {
      gap: spacing.sm,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      minHeight: 56,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: spacing.md,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginTop: spacing.xl,
      paddingVertical: spacing.md,
      backgroundColor: colors.error + '15',
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.thin,
      borderColor: colors.error,
      minHeight: 48,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.error,
    },
    versionInfo: {
      alignItems: 'center',
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    versionText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Courier',
      color: colors.textTertiary,
    },
    copyrightText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Courier',
      color: colors.textTertiary,
      marginTop: 4,
    },
  }),
  _colors: colors,
});
