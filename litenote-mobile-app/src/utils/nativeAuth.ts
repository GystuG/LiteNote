/**
 * Auth Token Native Module
 * 用于在 React Native 和 Android 原生层之间共享认证 Token
 */
import { NativeModules, Platform } from 'react-native';

const { AuthTokenModule } = NativeModules;

/**
 * 保存 Token 到原生层
 * Android: SharedPreferences
 * iOS: Keychain (未实现)
 */
export async function setNativeToken(token: string): Promise<boolean> {
  if (Platform.OS === 'android' && AuthTokenModule) {
    try {
      return await AuthTokenModule.setToken(token);
    } catch (error) {
      console.error('[AuthToken] 保存 Token 到原生层失败:', error);
      return false;
    }
  }
  // iOS 暂不支持
  return true;
}

/**
 * 从原生层获取 Token
 */
export async function getNativeToken(): Promise<string | null> {
  if (Platform.OS === 'android' && AuthTokenModule) {
    try {
      return await AuthTokenModule.getToken();
    } catch (error) {
      console.error('[AuthToken] 从原生层获取 Token 失败:', error);
      return null;
    }
  }
  return null;
}

/**
 * 清除原生层的 Token
 */
export async function clearNativeToken(): Promise<boolean> {
  if (Platform.OS === 'android' && AuthTokenModule) {
    try {
      return await AuthTokenModule.clearToken();
    } catch (error) {
      console.error('[AuthToken] 清除原生层 Token 失败:', error);
      return false;
    }
  }
  return true;
}

export default {
  setNativeToken,
  getNativeToken,
  clearNativeToken,
};
