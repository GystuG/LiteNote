/**
 * 应用版本 API 服务
 */
import httpService from '../http';

export interface AppVersionInfo {
  id: number;
  version: string;
  versionCode: number;
  downloadUrl: string;
  updateLog: string;
  forceUpdate: boolean;
  platform: string;
  createdAt: string;
}

export interface CheckUpdateResponse {
  hasUpdate: boolean;
  latestVersion?: AppVersionInfo;
}

/**
 * 应用版本服务
 */
export const appVersionApi = {
  /**
   * 检查更新
   */
  async checkUpdate(currentVersion: string): Promise<CheckUpdateResponse> {
    console.log('[AppVersion] 检查更新, 当前版本:', currentVersion);
    const response = await httpService.get<CheckUpdateResponse>(
      '/app-version/check',
      { params: { currentVersion, platform: 'android' } }
    );
    console.log('[AppVersion] 检查更新响应:', JSON.stringify(response));
    // httpService.get 已经返回 response.data，所以直接访问 .data
    const result = (response as any).data || response;
    console.log('[AppVersion] 解析结果:', JSON.stringify(result));
    return result;
  },

  /**
   * 获取最新版本
   */
  async getLatest(): Promise<AppVersionInfo | null> {
    try {
      const response = await httpService.get<AppVersionInfo>(
        '/app-version/latest',
        { params: { platform: 'android' } }
      );
      return (response as any).data || response;
    } catch {
      return null;
    }
  },
};
