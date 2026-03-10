/**
 * HTTP请求服务类
 * 基于axios封装，提供拦截器、错误处理、重试机制等功能
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import env from '../config/env';
import { logger } from '../utils/logger';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/app';
import { HTTP_STATUS, RETRY_CONFIG, TIMEOUT_CONFIG } from '../constants/api';
import type { ApiResponse, ApiError, RequestConfig, RequestInterceptor, ResponseInterceptor } from '../types/api';

class HttpService {
  private static instance: HttpService;
  private axiosInstance: AxiosInstance;
  private readonly TAG = 'HttpService';
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: env.get('API_BASE_URL'),
      timeout: env.get('API_TIMEOUT'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  static getInstance(): HttpService {
    if (!HttpService.instance) {
      HttpService.instance = new HttpService();
    }
    return HttpService.instance;
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // 添加认证token
        const token = await storage.getItem<string>(STORAGE_KEYS.USER_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求ID用于追踪
        const requestId = this.generateRequestId();
        config.headers['X-Request-ID'] = requestId;

        // 执行自定义请求拦截器
        let processedConfig = config;
        for (const interceptor of this.requestInterceptors) {
          if (interceptor.onRequest) {
            processedConfig = await interceptor.onRequest(processedConfig as RequestConfig) as any;
          }
        }

        // 记录请求日志
        if (env.get('DEBUG_NETWORK')) {
          logger.logRequest(
            config.method?.toUpperCase() || 'GET',
            config.url || '',
            config.data
          );
        }

        return processedConfig;
      },
      async (error) => {
        // 执行自定义请求错误拦截器
        for (const interceptor of this.requestInterceptors) {
          if (interceptor.onRequestError) {
            await interceptor.onRequestError(error);
          }
        }

        logger.error(this.TAG, 'Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      async (response) => {
        // 记录响应日志
        if (env.get('DEBUG_NETWORK')) {
          logger.logResponse(
            response.config.method?.toUpperCase() || 'GET',
            response.config.url || '',
            response.status,
            response.data
          );
        }

        // 执行自定义响应拦截器
        let processedResponse = response;
        for (const interceptor of this.responseInterceptors) {
          if (interceptor.onResponse) {
            processedResponse = await interceptor.onResponse(processedResponse);
          }
        }

        return processedResponse;
      },
      async (error) => {
        // 记录错误日志
        if (error.response) {
          logger.logError(
            error.config?.method?.toUpperCase() || 'GET',
            error.config?.url || '',
            {
              status: error.response.status,
              data: error.response.data,
            }
          );
        } else {
          logger.error(this.TAG, 'Network error', error);
        }

        // 处理特定错误状态
        await this.handleErrorStatus(error);

        // 执行自定义响应错误拦截器
        for (const interceptor of this.responseInterceptors) {
          if (interceptor.onResponseError) {
            await interceptor.onResponseError(error);
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * 处理错误状态
   */
  private async handleErrorStatus(error: any): Promise<void> {
    if (!error.response) return;

    const status = error.response.status;

    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        // 清除token并跳转到登录页
        await storage.removeItem(STORAGE_KEYS.USER_TOKEN);
        await storage.removeItem(STORAGE_KEYS.USER_INFO);
        // TODO: 导航到登录页
        break;

      case HTTP_STATUS.FORBIDDEN:
        // 权限不足处理
        logger.warn(this.TAG, 'Access forbidden');
        break;

      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        // 服务器错误处理
        logger.error(this.TAG, 'Server error', { status, url: error.config?.url });
        break;
    }
  }

  /**
   * 标准化错误格式
   */
  private normalizeError(error: any): ApiError {
    if (error.response) {
      // 服务器响应错误
      return {
        code: error.response.status,
        message: error.response.data?.message || error.message || '请求失败',
        details: error.response.data,
        timestamp: new Date().toISOString(),
      };
    } else if (error.request) {
      // 网络错误
      return {
        code: 0,
        message: '网络连接失败，请检查网络设置',
        details: error.request,
        timestamp: new Date().toISOString(),
      };
    } else {
      // 其他错误
      return {
        code: -1,
        message: error.message || '未知错误',
        details: error,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * 上传文件
   */
  async upload<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: TIMEOUT_CONFIG.UPLOAD,
      onUploadProgress,
    });
    return response.data;
  }

  /**
   * 下载文件
   */
  async download(url: string, filename?: string): Promise<Blob> {
    const response = await this.axiosInstance.get(url, {
      responseType: 'blob',
      timeout: TIMEOUT_CONFIG.DOWNLOAD,
    });

    // React Native环境下不支持浏览器下载
    // 这里只返回blob数据，由调用方处理文件保存
    if (filename) {
      logger.info(this.TAG, `Downloaded file: ${filename}`);
    }

    return response.data;
  }

  /**
   * 取消请求
   */
  createCancelToken() {
    return axios.CancelToken.source();
  }

  /**
   * 检查是否为取消请求错误
   */
  isCancel(error: any): boolean {
    return axios.isCancel(error);
  }

  /**
   * 设置默认headers
   */
  setDefaultHeader(key: string, value: string): void {
    this.axiosInstance.defaults.headers.common[key] = value;
  }

  /**
   * 移除默认header
   */
  removeDefaultHeader(key: string): void {
    delete this.axiosInstance.defaults.headers.common[key];
  }

  /**
   * 更新baseURL
   */
  updateBaseURL(baseURL: string): void {
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  /**
   * 更新超时时间
   */
  updateTimeout(timeout: number): void {
    this.axiosInstance.defaults.timeout = timeout;
  }
}

export const httpService = HttpService.getInstance();
export default httpService;
