/**
 * Toast Hook
 * 提供全局Toast消息提示功能
 */
import { useState, useCallback } from 'react';
import type { ToastType } from '../components/ui/Toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration: number;
  position: 'top' | 'center' | 'bottom';
}

interface ShowToastOptions {
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
}

export const useToast = () => {
  const [toastState, setToastState] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
    position: 'center',
  });

  const showToast = useCallback((message: string, options?: ShowToastOptions) => {
    setToastState({
      visible: true,
      message,
      type: options?.type || 'info',
      duration: options?.duration || 3000,
      position: options?.position || 'center',
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastState(prev => ({ ...prev, visible: false }));
  }, []);

  // 便捷方法
  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'success', duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'error', duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'warning', duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'info', duration });
  }, [showToast]);

  return {
    toastState,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
