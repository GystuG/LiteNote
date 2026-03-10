/**
 * 日志工具类
 */
import env from '../config/env';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enableLogs: boolean;

  private constructor() {
    this.enableLogs = env.shouldEnableLogs();
    this.logLevel = env.isDevelopment() ? LogLevel.DEBUG : LogLevel.INFO;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.enableLogs && level >= this.logLevel;
  }

  private formatMessage(level: string, tag: string, message: string, extra?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] [${tag}] ${message}`;
    
    if (extra) {
      return `${baseMessage}\n${JSON.stringify(extra, null, 2)}`;
    }
    
    return baseMessage;
  }

  debug(tag: string, message: string, extra?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', tag, message, extra));
    }
  }

  info(tag: string, message: string, extra?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', tag, message, extra));
    }
  }

  warn(tag: string, message: string, extra?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', tag, message, extra));
    }
  }

  error(tag: string, message: string, error?: Error | any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorInfo = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      
      console.error(this.formatMessage('ERROR', tag, message, errorInfo));
    }
  }

  // 网络请求日志
  logRequest(method: string, url: string, data?: any): void {
    this.debug('HTTP', `${method} ${url}`, data);
  }

  logResponse(method: string, url: string, status: number, data?: any): void {
    this.debug('HTTP', `${method} ${url} - ${status}`, data);
  }

  logError(method: string, url: string, error: any): void {
    this.error('HTTP', `${method} ${url} - Request failed`, error);
  }
}

export const logger = Logger.getInstance();
export default logger;
