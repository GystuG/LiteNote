/**
 * 用户相关类型定义
 */

// 用户信息
export interface User {
  id: string;
  username: string;
  email?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// 登录凭证
export interface LoginCredentials {
  username: string;
  password: string;
}

// 注册数据
export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
}

// 登录/注册响应
export interface AuthResponse {
  user: User;
  token: string;
}

// 认证状态
export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
}

// 更新资料数据
export interface UpdateProfileData {
  username?: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}

// 修改密码数据
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// 头像上传响应
export interface AvatarUploadResponse {
  avatar: string;
  user: User;
}
