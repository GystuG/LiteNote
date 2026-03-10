import axios from 'axios';
import env from './env';

/**
 * API配置
 * 根据环境自动配置API地址和超时时间
 */
export const API_BASE_URL = env.getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: env.getApiTimeout(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // 在开发环境记录请求日志
    if (env.shouldEnableLogs()) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        data: config.data,
      });
    }
    return config;
  },
  (error) => {
    if (env.shouldEnableLogs()) {
      console.error('❌ API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // 在开发环境记录响应日志
    if (env.shouldEnableLogs()) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message;
    
    if (env.shouldEnableLogs()) {
      console.error('❌ API Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: errorMessage,
        data: error.response?.data,
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;
