/**
 * 支付通知服务
 *
 * 用于管理支付通知监听的权限。
 * 实际的支付检测和记账逻辑已移至 Android 原生层处理。
 *
 * @author LiteNote
 * @since 1.0.0
 */

import { NativeModules, Platform } from 'react-native';
import type { PermissionStatus } from './types';

const { PaymentNotificationModule } = NativeModules;

/**
 * 支付通知服务类
 */
class PaymentNotificationService {
  /**
   * 检查当前平台是否支持支付通知功能
   */
  isSupported(): boolean {
    return Platform.OS === 'android' && !!PaymentNotificationModule;
  }

  /**
   * 获取通知监听权限状态
   */
  async getPermissionStatus(): Promise<PermissionStatus> {
    if (!this.isSupported()) {
      return 'unknown';
    }

    try {
      const status = await PaymentNotificationModule.getPermissionStatus();
      return status as PermissionStatus;
    } catch (error) {
      console.error('Failed to get permission status:', error);
      return 'unknown';
    }
  }

  /**
   * 获取悬浮窗权限状态
   */
  async getOverlayPermissionStatus(): Promise<PermissionStatus> {
    if (!this.isSupported()) {
      return 'unknown';
    }

    try {
      const status = await PaymentNotificationModule.getOverlayPermissionStatus();
      return status as PermissionStatus;
    } catch (error) {
      console.error('Failed to get overlay permission status:', error);
      return 'unknown';
    }
  }

  /**
   * 请求通知监听权限
   * 会跳转到系统设置页面
   */
  requestPermission(): void {
    if (!this.isSupported()) {
      return;
    }

    try {
      PaymentNotificationModule.requestPermission();
    } catch (error) {
      console.error('Failed to request permission:', error);
    }
  }

  /**
   * 请求悬浮窗权限
   * 会跳转到系统设置页面
   */
  requestOverlayPermission(): void {
    if (!this.isSupported()) {
      return;
    }

    try {
      PaymentNotificationModule.requestOverlayPermission();
    } catch (error) {
      console.error('Failed to request overlay permission:', error);
    }
  }

  /**
   * 保存监听应用配置
   *
   * @param monitoredApps 监听应用列表
   * @param filterKeywords 过滤关键词列表
   */
  async saveMonitoringConfig(
    monitoredApps: Array<{ packageName: string; appName: string; enabled: boolean }>,
    filterKeywords: string[]
  ): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      await PaymentNotificationModule.saveMonitoringConfig(monitoredApps, filterKeywords);
      return true;
    } catch (error) {
      console.error('Failed to save monitoring config:', error);
      return false;
    }
  }

  /**
   * 获取已安装应用列表
   *
   * @returns 已安装应用列表
   */
  async getInstalledApps(): Promise<Array<{ packageName: string; appName: string }>> {
    if (!this.isSupported()) {
      return [];
    }

    try {
      const apps = await PaymentNotificationModule.getInstalledApps();
      return apps;
    } catch (error) {
      console.error('Failed to get installed apps:', error);
      return [];
    }
  }
}

export const paymentNotificationService = new PaymentNotificationService();
