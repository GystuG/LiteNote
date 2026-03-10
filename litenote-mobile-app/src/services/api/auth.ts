/**
 * 认证相关API服务
 */
import { httpService } from '../http';
import type { ApiResponse } from '../../types/api';
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  UpdateProfileData,
  ChangePasswordData,
  AvatarUploadResponse,
} from '../../types/user';

class AuthService {
  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return httpService.post('/auth/login', credentials);
  }

  /**
   * 用户注册
   */
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return httpService.post('/auth/register', data);
  }

  /**
   * 获取当前用户信息
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return httpService.get('/auth/profile');
  }

  /**
   * 更新用户资料
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    return httpService.patch('/auth/profile', data);
  }

  /**
   * 修改密码
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse<void>> {
    return httpService.patch('/auth/password', data);
  }

  /**
   * 上传头像
   */
  async uploadAvatar(imageUri: string): Promise<ApiResponse<AvatarUploadResponse>> {
    const formData = new FormData();

    // 从 URI 中提取文件名和类型
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('avatar', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    return httpService.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const authService = new AuthService();
