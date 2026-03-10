/**
 * Alert 上下文提供者
 * 提供命令式调用弹窗的能力
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertModal, AlertButton } from '../components/modals/AlertModal';

interface AlertOptions {
  title?: string;
  message: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    message: '',
  });

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const alert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    // 如果只传了一个参数，当作 message 处理
    if (message === undefined && buttons === undefined) {
      setOptions({
        message: title,
        buttons: [{ text: '确定', style: 'default' }],
      });
    } else {
      setOptions({
        title,
        message: message || '',
        buttons: buttons || [{ text: '确定', style: 'default' }],
      });
    }
    setVisible(true);
  }, []);

  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmOptions?: { confirmText?: string; cancelText?: string; destructive?: boolean }
  ) => {
    const { confirmText = '确定', cancelText = '取消', destructive = false } = confirmOptions || {};

    setOptions({
      title,
      message,
      buttons: [
        {
          text: cancelText,
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ],
    });
    setVisible(true);
  }, []);

  return (
    <AlertContext.Provider value={{ alert, confirm }}>
      {children}
      <AlertModal
        visible={visible}
        title={options.title}
        message={options.message}
        buttons={options.buttons}
        onClose={handleClose}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
