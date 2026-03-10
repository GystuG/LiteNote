/**
 * 认证上下文提供者
 * 管理用户登录状态、Token存储和自动登录
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/app';
import { authService } from '../services/api/auth';
import { httpService } from '../services/http';
import { logger } from '../utils/logger';
import { setNativeToken, clearNativeToken } from '../utils/nativeAuth';
import type { User, LoginCredentials, RegisterData, AuthState } from '../types/user';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TAG = 'AuthProvider';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
    user: null,
    token: null,
  });

  // 从存储中恢复登录状态
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        logger.info(TAG, '正在恢复登录状态...');

        const token = await storage.getItem<string>(STORAGE_KEYS.USER_TOKEN);
        const userInfo = await storage.getItem<User>(STORAGE_KEYS.USER_INFO);

        if (token && userInfo) {
          logger.info(TAG, '发现已保存的登录状态，正在验证...');

          // 验证 token 是否有效
          try {
            const response = await authService.getProfile();
            if (response.success && response.data) {
              logger.info(TAG, '登录状态验证成功');
              // 同步 Token 到原生层（供 Android 悬浮窗使用）
              await setNativeToken(token);
              setState({
                isLoggedIn: true,
                isLoading: false,
                user: response.data,
                token,
              });
              return;
            }
          } catch (error) {
            logger.warn(TAG, 'Token 验证失败，清除登录状态');
            await storage.removeItem(STORAGE_KEYS.USER_TOKEN);
            await storage.removeItem(STORAGE_KEYS.USER_INFO);
            await clearNativeToken();
          }
        }

        logger.info(TAG, '未找到有效的登录状态');
        setState({
          isLoggedIn: false,
          isLoading: false,
          user: null,
          token: null,
        });
      } catch (error) {
        logger.error(TAG, '恢复登录状态失败', error);
        setState({
          isLoggedIn: false,
          isLoading: false,
          user: null,
          token: null,
        });
      }
    };

    restoreAuth();
  }, []);

  // 登录
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      logger.info(TAG, `正在登录: ${credentials.username}`);

      const response = await authService.login(credentials);

      if (!response.success || !response.data) {
        throw new Error(response.message || '登录失败');
      }

      const { user, token } = response.data;

      // 保存到存储
      await storage.setItem(STORAGE_KEYS.USER_TOKEN, token);
      await storage.setItem(STORAGE_KEYS.USER_INFO, user);

      // 同步 Token 到原生层（供 Android 悬浮窗使用）
      await setNativeToken(token);

      logger.info(TAG, '登录成功');

      setState({
        isLoggedIn: true,
        isLoading: false,
        user,
        token,
      });
    } catch (error: any) {
      logger.error(TAG, '登录失败', error);
      throw error;
    }
  }, []);

  // 注册
  const register = useCallback(async (data: RegisterData) => {
    try {
      logger.info(TAG, `正在注册: ${data.username}`);

      const response = await authService.register(data);

      if (!response.success || !response.data) {
        throw new Error(response.message || '注册失败');
      }

      const { user, token } = response.data;

      // 保存到存储
      await storage.setItem(STORAGE_KEYS.USER_TOKEN, token);
      await storage.setItem(STORAGE_KEYS.USER_INFO, user);

      // 同步 Token 到原生层（供 Android 悬浮窗使用）
      await setNativeToken(token);

      logger.info(TAG, '注册成功');

      setState({
        isLoggedIn: true,
        isLoading: false,
        user,
        token,
      });
    } catch (error: any) {
      logger.error(TAG, '注册失败', error);
      throw error;
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      logger.info(TAG, '正在登出...');

      // 清除存储
      await storage.removeItem(STORAGE_KEYS.USER_TOKEN);
      await storage.removeItem(STORAGE_KEYS.USER_INFO);

      // 清除原生层的 Token
      await clearNativeToken();

      logger.info(TAG, '登出成功');

      setState({
        isLoggedIn: false,
        isLoading: false,
        user: null,
        token: null,
      });
    } catch (error) {
      logger.error(TAG, '登出失败', error);
      throw error;
    }
  }, []);

  // 刷新用户信息
  const refreshProfile = useCallback(async () => {
    try {
      const response = await authService.getProfile();

      if (response.success && response.data) {
        const userData = response.data;
        await storage.setItem(STORAGE_KEYS.USER_INFO, userData);
        setState(prev => ({
          ...prev,
          user: userData,
        }));
      }
    } catch (error) {
      logger.error(TAG, '刷新用户信息失败', error);
    }
  }, []);

  // 添加响应拦截器处理 401 错误
  useEffect(() => {
    httpService.addResponseInterceptor({
      onResponseError: async (error: any) => {
        if (error.code === 401) {
          logger.warn(TAG, '收到 401 错误，自动登出');
          await logout();
        }
      },
    });
  }, [logout]);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    login,
    register,
    logout,
    refreshProfile,
  }), [state, login, register, logout, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 获取认证上下文的 Hook
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
