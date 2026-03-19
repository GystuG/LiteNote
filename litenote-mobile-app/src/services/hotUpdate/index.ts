/**
 * 热更新核心服务
 * 负责下载、校验、解压、应用热更新 bundle
 */
import { NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';
import { hotUpdateApi, HotUpdateBundleInfo } from '../api/hotUpdate';
import bundleMeta from '../../../bundle-version.json';
import packageJson from '../../../package.json';

const { HotUpdate } = NativeModules;

// 热更新文件存储目录
const HOT_UPDATE_DIR = `${RNFS.DocumentDirectoryPath}/hot_update`;
const BUNDLE_FILE = `${HOT_UPDATE_DIR}/index.android.bundle`;
const TEMP_DIR = `${RNFS.DocumentDirectoryPath}/hot_update_temp`;

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'applying'
  | 'done'
  | 'error';

export interface HotUpdateState {
  status: UpdateStatus;
  hasUpdate: boolean;
  bundleInfo: HotUpdateBundleInfo | null;
  progress: number;
  error: string | null;
  patchMode: 'full' | 'diff' | null;
}

/**
 * 获取当前 bundle 版本号（编译时嵌入）
 */
export function getCurrentBundleVersion(): number {
  return bundleMeta.bundleVersion;
}

/**
 * 获取当前原生版本号
 */
export function getNativeVersion(): string {
  return packageJson.version;
}

/**
 * 计算文件 SHA256
 */
async function computeSHA256(filePath: string): Promise<string> {
  return await RNFS.hash(filePath, 'sha256');
}

/**
 * 确保目录存在
 */
async function ensureDir(dir: string): Promise<void> {
  const exists = await RNFS.exists(dir);
  if (!exists) {
    await RNFS.mkdir(dir);
  }
}

/**
 * 清理目录
 */
async function cleanDir(dir: string): Promise<void> {
  const exists = await RNFS.exists(dir);
  if (exists) {
    await RNFS.unlink(dir);
  }
}

/**
 * 检查热更新
 */
export async function checkForUpdate(): Promise<{
  hasUpdate: boolean;
  bundle?: HotUpdateBundleInfo;
}> {
  if (Platform.OS !== 'android') {
    return { hasUpdate: false };
  }

  const nativeVersion = getNativeVersion();
  const bundleVersion = getCurrentBundleVersion();

  return await hotUpdateApi.checkUpdate(nativeVersion, bundleVersion);
}

/**
 * 下载并应用热更新
 */
export async function downloadAndApplyUpdate(
  bundle: HotUpdateBundleInfo,
  onProgress?: (progress: number) => void,
): Promise<boolean> {
  try {
    await ensureDir(HOT_UPDATE_DIR);
    await cleanDir(TEMP_DIR);
    await ensureDir(TEMP_DIR);

    let success = false;

    // 尝试 diff 补丁下载（迭代二）
    if (bundle.patchAvailable && bundle.patchUrl) {
      console.log('[HotUpdate] 尝试 diff 补丁更新...');
      success = await downloadAndApplyPatch(bundle, onProgress);
    }

    // diff 失败或不可用，下载完整包
    if (!success) {
      console.log('[HotUpdate] 下载完整 bundle zip...');
      success = await downloadFullBundle(bundle, onProgress);
    }

    if (success) {
      // 标记 bundle 已成功应用
      if (HotUpdate?.markBundleApplied) {
        HotUpdate.markBundleApplied();
      }

      // 强制更新则立即 reload
      if (bundle.forceUpdate && HotUpdate?.reload) {
        console.log('[HotUpdate] 强制更新，重新加载...');
        // 延迟一点确保文件写入完成
        setTimeout(() => {
          HotUpdate.reload();
        }, 500);
      }
    }

    // 清理临时文件
    await cleanDir(TEMP_DIR);

    return success;
  } catch (error: any) {
    console.error('[HotUpdate] 更新失败:', error.message);
    await cleanDir(TEMP_DIR);
    return false;
  }
}

/**
 * 下载完整 bundle zip 并解压
 */
async function downloadFullBundle(
  bundle: HotUpdateBundleInfo,
  onProgress?: (progress: number) => void,
): Promise<boolean> {
  const tempZipPath = `${TEMP_DIR}/bundle.zip`;

  try {
    // 1. 下载 zip
    const downloadResult = RNFS.downloadFile({
      fromUrl: bundle.downloadUrl,
      toFile: tempZipPath,
      progress: (res) => {
        const progress = Math.round((res.bytesWritten / res.contentLength) * 100);
        onProgress?.(progress);
      },
      progressDivider: 1,
    });

    const result = await downloadResult.promise;
    if (result.statusCode !== 200) {
      throw new Error(`下载失败: HTTP ${result.statusCode}`);
    }

    // 2. 校验 SHA256
    const hash = await computeSHA256(tempZipPath);
    if (hash !== bundle.fileHash) {
      throw new Error(`SHA256 校验失败: 期望 ${bundle.fileHash}, 实际 ${hash}`);
    }
    console.log('[HotUpdate] SHA256 校验通过');

    // 3. 清理旧的热更新目录
    await cleanDir(HOT_UPDATE_DIR);
    await ensureDir(HOT_UPDATE_DIR);

    // 4. 解压 zip 到热更新目录
    //    zip 内结构: index.android.bundle + drawable-*/xxx.png
    const extractPath = await unzip(tempZipPath, HOT_UPDATE_DIR);
    console.log('[HotUpdate] 解压完成:', extractPath);

    // 5. 验证 bundle 文件存在
    const bundleExists = await RNFS.exists(BUNDLE_FILE);
    if (!bundleExists) {
      throw new Error('解压后未找到 index.android.bundle');
    }

    const stat = await RNFS.stat(BUNDLE_FILE);
    console.log(`[HotUpdate] Bundle 已保存: ${(Number(stat.size) / 1024).toFixed(1)} KB`);

    return true;
  } catch (error: any) {
    console.error('[HotUpdate] 完整包下载失败:', error.message);
    return false;
  }
}

/**
 * 下载并应用 diff 补丁（迭代二实现）
 */
async function downloadAndApplyPatch(
  _bundle: HotUpdateBundleInfo,
  _onProgress?: (progress: number) => void,
): Promise<boolean> {
  // 迭代二实现：bspatch 合成
  console.log('[HotUpdate] diff 补丁暂未实现，回退完整包');
  return false;
}

/**
 * 启动时标记 bundle 加载成功
 */
export function markBundleLoaded(): void {
  if (Platform.OS === 'android' && HotUpdate?.markBundleApplied) {
    HotUpdate.markBundleApplied();
    console.log('[HotUpdate] bundle 加载成功，已重置崩溃计数');
  }
}
