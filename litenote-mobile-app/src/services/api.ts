/**
 * API服务层
 * 提供通用的API调用方法和基础服务
 */
import httpService from './http';
import { API_ENDPOINTS } from '../constants/api';
import type { ApiResponse } from '../types/api';

/**
 * 基础API服务
 * 提供通用的CRUD操作方法
 */
export class BaseApiService {
  /**
   * 获取系统状态
   */
  static async getSystemStatus(): Promise<any> {
    const response = await httpService.get(API_ENDPOINTS.ROOT);
    return response.data || response;
  }

  /**
   * 健康检查
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await httpService.get(API_ENDPOINTS.ROOT);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 通用GET请求
   */
  static async get<T = any>(endpoint: string, params?: any): Promise<T> {
    const response = await httpService.get<T>(endpoint, { params });
    return response.data || response as any;
  }

  /**
   * 通用POST请求
   */
  static async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await httpService.post<T>(endpoint, data);
    return response.data || response as any;
  }

  /**
   * 通用PUT请求
   */
  static async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await httpService.put<T>(endpoint, data);
    return response.data || response as any;
  }

  /**
   * 通用DELETE请求
   */
  static async delete<T = any>(endpoint: string): Promise<T> {
    const response = await httpService.delete<T>(endpoint);
    return response.data || response as any;
  }
}

/**
 * 工具箱服务
 * 管理各种工具模块的状态和配置
 */
export class ToolboxService {
  /**
   * 获取可用的工具模块列表
   */
  static async getAvailableModules(): Promise<any[]> {
    // 这里可以从后端获取动态配置的模块列表
    // 目前返回静态配置
    return [
      { id: 'accounting', name: '记账管理', status: 'planned' },
      { id: 'countdown', name: '倒数日提醒', status: 'planned' },
      { id: 'shipping', name: '闲鱼发货助手', status: 'planned' },
      { id: 'more', name: '更多工具', status: 'planned' },
    ];
  }

  /**
   * 检查模块是否可用
   */
  static async isModuleAvailable(moduleId: string): Promise<boolean> {
    const modules = await this.getAvailableModules();
    const module = modules.find(m => m.id === moduleId);
    return module?.status === 'active';
  }
}

// 导出便捷的API对象
export const systemApi = {
  getStatus: BaseApiService.getSystemStatus,
  healthCheck: BaseApiService.healthCheck,
};

export const toolboxApi = {
  getModules: ToolboxService.getAvailableModules,
  isModuleAvailable: ToolboxService.isModuleAvailable,
};

// 默认导出HTTP服务实例
export default httpService;
