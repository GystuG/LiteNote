/**
 * Alert Hook
 * 提供全局Alert弹窗功能
 */
import { useState, useCallback } from 'react';
import type { AlertButton } from '../components/ui/Alert';

interface AlertState {
  visible: boolean;
  title?: string;
  message: string;
  buttons: AlertButton[];
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ShowAlertOptions {
  title?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const useAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    message: '',
    buttons: [{ text: '确定' }],
    type: 'info',
  });

  const showAlert = useCallback((message: string, options?: ShowAlertOptions) => {
    setAlertState({
      visible: true,
      title: options?.title,
      message,
      buttons: options?.buttons || [{ text: '确定' }],
      type: options?.type || 'info',
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  // 便捷方法
  const showConfirm = useCallback((
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    title?: string
  ) => {
    showAlert(message, {
      title,
      type: 'warning',
      buttons: [
        { text: '取消', style: 'cancel', onPress: onCancel },
        { text: '确定', style: 'default', onPress: onConfirm },
      ],
    });
  }, [showAlert]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showAlert(message, { title, type: 'success' });
  }, [showAlert]);

  const showError = useCallback((message: string, title?: string) => {
    showAlert(message, { title, type: 'error' });
  }, [showAlert]);

  const showWarning = useCallback((message: string, title?: string) => {
    showAlert(message, { title, type: 'warning' });
  }, [showAlert]);

  const showInfo = useCallback((message: string, title?: string) => {
    showAlert(message, { title, type: 'info' });
  }, [showAlert]);

  return {
    alertState,
    showAlert,
    hideAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
