/**
 * URL 工具函数
 */
import env from '../config/env';

/**
 * 获取完整的资源 URL
 * 将相对路径转换为完整的服务器 URL
 * @param path 相对路径，如 /uploads/avatars/xxx.png
 * @returns 完整 URL，如 http://server.com/uploads/avatars/xxx.png
 */
export function getFullUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  // 如果已经是完整 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 获取 API 基础 URL 并移除末尾的斜杠
  let baseUrl = env.getApiBaseUrl();
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // 确保路径以斜杠开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

/**
 * 获取头像完整 URL
 * @param avatarPath 头像相对路径
 * @returns 完整头像 URL 或 null
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  return getFullUrl(avatarPath);
}
