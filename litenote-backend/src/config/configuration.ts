/**
 * 应用配置管理
 * 统一管理所有环境变量和配置项，支持类型安全和验证
 */

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface AppConfig {
  name: string;
  version: string;
  port: number;
  environment: 'development' | 'production' | 'test';
  globalPrefix: string;
}

export interface SecurityConfig {
  corsOrigins: string[];
  rateLimitTtl: number;
  rateLimitLimit: number;
}

export interface LogConfig {
  level: string;
  enableConsole: boolean;
  enableFile: boolean;
  filePath: string;
}

export interface Configuration {
  app: AppConfig;
  database: DatabaseConfig;
  security: SecurityConfig;
  log: LogConfig;
}

export default (): Configuration => ({
  app: {
    name: process.env.APP_NAME || '智能记账后端API',
    version: process.env.APP_VERSION || '1.0.0',
    port: parseInt(process.env.PORT, 10) || 3000,
    environment: (process.env.NODE_ENV as any) || 'development',
    globalPrefix: process.env.GLOBAL_PREFIX || 'api',
  },
  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'litenote',
  },
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 100,
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },
});
