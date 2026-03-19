import React, { useEffect } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, invalidateCache } from './src/lib/queryClient';
import { useAppStateManager, useAppUpdate, useHotUpdate } from './src/hooks';
import { UpdateModal } from './src/components/UpdateModal';
import { ThemeProvider, useTheme, AuthProvider, AlertProvider } from './src/providers';
import AppNavigator from './src/navigation/AppNavigator';

const { PaymentNotificationModule } = NativeModules;

function AppContent() {
  // 管理应用状态，处理后台缓存清理
  useAppStateManager();

  // 获取主题
  const { isDark, colors } = useTheme();

  // 检查应用更新
  const {
    showModal,
    latestVersion,
    downloading,
    progress,
    hideModal,
    downloadAndInstall,
  } = useAppUpdate();

  // 热更新（静默检查，非强制更新下次启动生效）
  const hotUpdate = useHotUpdate();

  // 有热更新且不是强制更新时自动静默下载
  useEffect(() => {
    if (hotUpdate.hasUpdate && hotUpdate.bundleInfo && hotUpdate.status === 'idle') {
      hotUpdate.applyUpdate();
    }
  }, [hotUpdate.hasUpdate, hotUpdate.bundleInfo, hotUpdate.status]);

  // 监听账单创建成功事件
  useEffect(() => {
    console.log('[App] 开始注册账单创建事件监听器...');

    if (!PaymentNotificationModule) {
      console.warn('[App] PaymentNotificationModule 不可用');
      return;
    }

    console.log('[App] PaymentNotificationModule 可用，创建事件监听器');
    const eventEmitter = new NativeEventEmitter(PaymentNotificationModule);

    const subscription = eventEmitter.addListener('onBillCreated', () => {
      console.log('========================================');
      console.log('[App] ✓ 收到账单创建成功事件！');
      console.log('[App] 开始刷新数据...');
      console.log('========================================');

      // 使账单相关的所有缓存失效
      invalidateCache.bills();

      console.log('[App] 缓存失效完成，等待重新获取数据');
    });

    console.log('[App] ✓ 事件监听器注册成功');

    return () => {
      console.log('[App] 注销事件监听器');
      subscription.remove();
    };
  }, []);

  // 配置 Paper 主题
  const paperTheme = isDark
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, primary: colors.primary } }
    : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: colors.primary } };

  return (
    <PaperProvider theme={paperTheme}>
      <AppNavigator />
      <UpdateModal
        visible={showModal}
        versionInfo={latestVersion}
        downloading={downloading}
        progress={progress}
        onConfirm={downloadAndInstall}
        onCancel={hideModal}
      />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AlertProvider>
              <AppContent />
            </AlertProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
