/**
 * 支付通知设置组件 - Neo-Brutalism 风格
 * 描边设置卡片 + 粗标签
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme';
import { paymentNotificationService, type PermissionStatus } from '../../services/paymentNotification';
import { useStyles } from '../../hooks';

interface PaymentNotificationSettingsProps {
  style?: object;
}

function getStatusInfo(status: string, colors: ThemeColors): { text: string; color: string; icon: string } {
  switch (status) {
    case 'authorized':
      return { text: '已开启', color: colors.success, icon: '✓' };
    case 'denied':
      return { text: '未开启', color: colors.error, icon: '✗' };
    default:
      return { text: '未知', color: colors.textTertiary, icon: '?' };
  }
}

export const PaymentNotificationSettings: React.FC<PaymentNotificationSettingsProps> = ({
  style,
}) => {
  const styles = useStyles(createStyles);
  const [isSupported] = useState(() => paymentNotificationService.isSupported());
  const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>('unknown');
  const [overlayStatus, setOverlayStatus] = useState<PermissionStatus>('unknown');
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [notifStatus, overlayPerm] = await Promise.all([
        paymentNotificationService.getPermissionStatus(),
        paymentNotificationService.getOverlayPermissionStatus(),
      ]);
      setNotificationStatus(notifStatus);
      setOverlayStatus(overlayPerm);
    } catch (error) {
      console.error('Failed to check permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  useEffect(() => {
    checkPermissions();

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkPermissions();
      }
    });

    return () => subscription.remove();
  }, [checkPermissions]);

  const handleRequestNotificationPermission = () => {
    paymentNotificationService.requestPermission();
  };

  const handleRequestOverlayPermission = () => {
    paymentNotificationService.requestOverlayPermission();
  };

  if (!isSupported) {
    return null;
  }

  const notificationStatusInfo = getStatusInfo(notificationStatus, styles._colors);
  const overlayStatusInfo = getStatusInfo(overlayStatus, styles._colors);
  const isNotificationAuthorized = notificationStatus === 'authorized';
  const isOverlayAuthorized = overlayStatus === 'authorized';
  const isFullyAuthorized = isNotificationAuthorized && isOverlayAuthorized;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBlock}>
            <Text style={styles.icon}>🔔</Text>
          </View>
          <Text style={styles.title}>支付自动记账</Text>
        </View>
        <Text style={styles.description}>
          开启后，微信/支付宝支付时自动弹出记账窗口
        </Text>
      </View>

      {/* 通知监听权限 */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusLabel}>通知监听权限</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={styles._colors.primary} />
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: notificationStatusInfo.color }]}>
              <Text style={styles.statusIcon}>{notificationStatusInfo.icon}</Text>
              <Text style={styles.statusText}>{notificationStatusInfo.text}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isNotificationAuthorized ? styles.actionButtonSecondary : styles.actionButtonPrimary,
          ]}
          onPress={isNotificationAuthorized ? checkPermissions : handleRequestNotificationPermission}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.actionButtonText,
              isNotificationAuthorized ? styles.actionButtonTextSecondary : styles.actionButtonTextPrimary,
            ]}
          >
            {isNotificationAuthorized ? '刷新' : '去开启'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 悬浮窗权限 */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusLabel}>悬浮窗权限</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={styles._colors.primary} />
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: overlayStatusInfo.color }]}>
              <Text style={styles.statusIcon}>{overlayStatusInfo.icon}</Text>
              <Text style={styles.statusText}>{overlayStatusInfo.text}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isOverlayAuthorized ? styles.actionButtonSecondary : styles.actionButtonPrimary,
          ]}
          onPress={isOverlayAuthorized ? checkPermissions : handleRequestOverlayPermission}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.actionButtonText,
              isOverlayAuthorized ? styles.actionButtonTextSecondary : styles.actionButtonTextPrimary,
            ]}
          >
            {isOverlayAuthorized ? '刷新' : '去开启'}
          </Text>
        </TouchableOpacity>
      </View>

      {!isFullyAuthorized && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            💡 需要开启以上权限才能在支付时弹出记账窗口
          </Text>
        </View>
      )}

      
    </View>
  );
};


const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.lg,
      marginHorizontal: spacing.md,
      marginVertical: spacing.sm,
      ...shadow.small,
    },
    header: {
      marginBottom: spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    iconBlock: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    icon: {
      fontSize: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    description: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
      marginLeft: 40,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
    },
    statusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    statusLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginRight: spacing.md,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    statusIcon: {
      fontSize: 12,
      marginRight: 4,
      color: '#FFFFFF',
      fontWeight: '800',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    actionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
    },
    actionButtonSecondary: {
      backgroundColor: colors.surface,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '700',
    },
    actionButtonTextPrimary: {
      color: '#FFFFFF',
    },
    actionButtonTextSecondary: {
      color: colors.textPrimary,
    },
    hint: {
      backgroundColor: colors.accent,
      padding: spacing.md,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      marginTop: spacing.sm,
    },
    hintText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 20,
    },
    supportedApps: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
    },
    supportedAppsTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    appList: {
      flexDirection: 'row',
      gap: spacing.lg,
    },
    appItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    appIcon: {
      fontSize: 16,
      marginRight: spacing.xs,
    },
    appName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  }),
  _colors: colors,
});
