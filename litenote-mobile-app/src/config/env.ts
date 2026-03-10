/**
 * 企业级环境配置管理器
 * 支持开发环境和生产环境
 */
import Config from 'react-native-config';

export type Environment = 'development' | 'production';

export interface AppConfig {
  NODE_ENV: Environment;
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENABLE_LOGS: boolean;
  ENABLE_FLIPPER: boolean;
  DEBUG_NETWORK: boolean;
  DEBUG_REDUX: boolean;
  MOCK_API: boolean;
  APP_NAME: string;
  APP_VERSION: string;
  BUILD_NUMBER: string;
}

class EnvironmentConfig {
  private config: AppConfig;

  constructor() {
    // 从环境变量读取配置，提供合理的默认值
    const nodeEnv = (Config.NODE_ENV || 'development') as Environment;
    
    this.config = {
      NODE_ENV: nodeEnv,
      API_BASE_URL: Config.API_BASE_URL || this.getDefaultApiUrl(nodeEnv),
      API_TIMEOUT: parseInt(Config.API_TIMEOUT || '10000', 10),
      ENABLE_LOGS: Config.ENABLE_LOGS === 'true',
      ENABLE_FLIPPER: Config.ENABLE_FLIPPER === 'true',
      DEBUG_NETWORK: Config.DEBUG_NETWORK === 'true',
      DEBUG_REDUX: Config.DEBUG_REDUX === 'true',
      MOCK_API: Config.MOCK_API === 'true',
      APP_NAME: Config.APP_NAME || 'LiteNote',
      APP_VERSION: Config.APP_VERSION || '1.0.0',
      BUILD_NUMBER: Config.BUILD_NUMBER || '1',
    };

    this.validateConfig();
    this.logEnvironmentInfo();
  }

  /**
   * 根据环境获取默认API地址
   */
  private getDefaultApiUrl(env: Environment): string {
    // 实际地址由 .env 文件提供，此处仅为缺失时的安全 fallback
    return 'http://localhost:3006/';
  }

  /**
   * 验证配置的有效性
   */
  private validateConfig(): void {
    if (!this.config.API_BASE_URL) {
      throw new Error('API_BASE_URL is required in environment configuration');
    }

    if (this.config.API_TIMEOUT < 1000) {
      console.warn('API_TIMEOUT is too low, setting to minimum 1000ms');
      this.config.API_TIMEOUT = 1000;
    }

    // 验证环境类型
    if (!['development', 'production'].includes(this.config.NODE_ENV)) {
      console.warn(`Invalid NODE_ENV: ${this.config.NODE_ENV}, defaulting to development`);
      this.config.NODE_ENV = 'development';
    }
  }

  /**
   * 记录环境信息（仅在开发环境）
   */
  private logEnvironmentInfo(): void {
    if (this.isDevelopment()) {
      console.log('🚀 Environment Configuration:');
      console.log(`📍 Environment: ${this.config.NODE_ENV}`);
      console.log(`🌐 API Base URL: ${this.config.API_BASE_URL}`);
      console.log(`⏱️  API Timeout: ${this.config.API_TIMEOUT}ms`);
      console.log(`📝 Logs Enabled: ${this.config.ENABLE_LOGS}`);
      console.log(`🔧 Debug Mode: ${this.shouldEnableDebug()}`);
    }
  }

  /**
   * 获取指定配置项
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  /**
   * 获取所有配置
   */
  getAll(): AppConfig {
    return { ...this.config };
  }

  /**
   * 是否为开发环境
   */
  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  /**
   * 是否为生产环境
   */
  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  /**
   * 是否启用日志
   */
  shouldEnableLogs(): boolean {
    return this.config.ENABLE_LOGS;
  }

  /**
   * 是否启用调试功能
   */
  shouldEnableDebug(): boolean {
    return this.config.DEBUG_NETWORK || this.config.DEBUG_REDUX;
  }

  /**
   * 获取API基础URL
   */
  getApiBaseUrl(): string {
    return this.config.API_BASE_URL;
  }

  /**
   * 获取API超时时间（单位：毫秒）
   */
  getApiTimeout(): number {
    return this.config.API_TIMEOUT;
  }
}

export const env = new EnvironmentConfig();
export default env;
