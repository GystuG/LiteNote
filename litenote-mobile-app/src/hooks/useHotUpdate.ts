/**
 * 热更新 Hook
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  checkForUpdate,
  downloadAndApplyUpdate,
  getCurrentBundleVersion,
  getNativeVersion,
  markBundleLoaded,
  type HotUpdateState,
  type UpdateStatus,
} from '../services/hotUpdate';
import type { HotUpdateBundleInfo } from '../services/api/hotUpdate';

interface UseHotUpdateOptions {
  /** 是否在 hook 挂载时自动检查热更新，默认 true */
  autoCheck?: boolean;
}

export function useHotUpdate(options: UseHotUpdateOptions = {}) {
  const { autoCheck = true } = options;
  const [state, setState] = useState<HotUpdateState>({
    status: 'idle',
    hasUpdate: false,
    bundleInfo: null,
    progress: 0,
    error: null,
    patchMode: null,
  });
  const isChecking = useRef(false);

  const bundleVersion = getCurrentBundleVersion();
  const nativeVersion = getNativeVersion();

  // 启动时标记 bundle 加载成功
  useEffect(() => {
    markBundleLoaded();
  }, []);

  const checkUpdate = useCallback(async () => {
    if (Platform.OS !== 'android' || isChecking.current) return;

    isChecking.current = true;
    setState(prev => ({ ...prev, status: 'checking', error: null }));

    try {
      const result = await checkForUpdate();

      setState(prev => ({
        ...prev,
        status: result.hasUpdate ? 'idle' : 'idle',
        hasUpdate: result.hasUpdate,
        bundleInfo: result.bundle || null,
      }));
    } catch (error: any) {
      console.log('[useHotUpdate] 检查热更新失败:', error.message);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    } finally {
      isChecking.current = false;
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!state.bundleInfo) return;

    const bundle = state.bundleInfo;
    setState(prev => ({
      ...prev,
      status: 'downloading',
      progress: 0,
      patchMode: bundle.patchAvailable ? 'diff' : 'full',
    }));

    const success = await downloadAndApplyUpdate(
      bundle,
      (progress) => {
        setState(prev => ({ ...prev, progress }));
      },
    );

    if (success) {
      setState(prev => ({
        ...prev,
        status: 'done',
        progress: 100,
      }));
    } else {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: '更新失败，请稍后重试',
      }));
    }
  }, [state.bundleInfo]);

  const skipUpdate = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasUpdate: false,
      bundleInfo: null,
      status: 'idle',
    }));
  }, []);

  // 启动时自动检查
  useEffect(() => {
    if (autoCheck) {
      checkUpdate();
    }
  }, [autoCheck, checkUpdate]);

  return {
    ...state,
    bundleVersion,
    nativeVersion,
    checkUpdate,
    applyUpdate,
    skipUpdate,
  };
}
