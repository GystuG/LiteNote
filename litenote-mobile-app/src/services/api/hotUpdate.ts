/**
 * 热更新 API 服务
 */
import httpService from '../http';

export interface HotUpdateBundleInfo {
  bundleVersion: number;
  bundleType: 'full' | 'business';
  downloadUrl: string;
  fileHash: string;
  fileSize: number;
  patchAvailable: boolean;
  patchUrl?: string;
  patchHash?: string;
  patchSize?: number;
  updateLog: string;
  forceUpdate: boolean;
}

export interface CheckHotUpdateResponse {
  hasUpdate: boolean;
  bundle?: HotUpdateBundleInfo;
}

export const hotUpdateApi = {
  /**
   * 检查热更新
   */
  async checkUpdate(
    nativeVersion: string,
    bundleVersion: number,
    platform = 'android',
  ): Promise<CheckHotUpdateResponse> {
    console.log('[HotUpdate] 检查热更新, nativeVersion:', nativeVersion, 'bundleVersion:', bundleVersion);
    const response = await httpService.get<CheckHotUpdateResponse>(
      '/hot-update/check',
      { params: { nativeVersion, bundleVersion, platform } },
    );
    const result = (response as any).data || response;
    console.log('[HotUpdate] 检查结果:', JSON.stringify(result));
    return result;
  },
};
