/**
 * 应用状态管理 Hook
 * 处理应用前台/后台切换时的缓存清理
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { cleanupStaleCache, queryClient } from '../lib/queryClient';

/**
 * 监听应用状态变化，在适当时机清理缓存
 */
export function useAppStateManager() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // 应用从前台切换到后台
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // 清理过期的缓存数据
        cleanupStaleCache();
      }

      // 应用从后台切换到前台
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // 可以在这里触发关键数据的刷新
        // 例如：queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

/**
 * 在组件挂载时预取数据
 * @param queryKey 查询键
 * @param queryFn 查询函数
 */
export function usePrefetchOnMount(
  queryKey: readonly unknown[],
  queryFn: () => Promise<unknown>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (enabled) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
      });
    }
  }, [queryKey, queryFn, enabled]);
}
