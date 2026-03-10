/**
 * 本地存储工具类
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

class StorageManager {
  private static instance: StorageManager;
  private readonly TAG = 'StorageManager';

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * 存储数据
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      logger.debug(this.TAG, `Stored item with key: ${key}`);
    } catch (error) {
      logger.error(this.TAG, `Failed to store item with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取数据
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        logger.debug(this.TAG, `No item found for key: ${key}`);
        return null;
      }
      
      const value = JSON.parse(jsonValue) as T;
      logger.debug(this.TAG, `Retrieved item with key: ${key}`);
      return value;
    } catch (error) {
      logger.error(this.TAG, `Failed to retrieve item with key: ${key}`, error);
      return null;
    }
  }

  /**
   * 删除数据
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      logger.debug(this.TAG, `Removed item with key: ${key}`);
    } catch (error) {
      logger.error(this.TAG, `Failed to remove item with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      logger.info(this.TAG, 'Cleared all storage');
    } catch (error) {
      logger.error(this.TAG, 'Failed to clear storage', error);
      throw error;
    }
  }

  /**
   * 获取所有键名
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      logger.debug(this.TAG, `Retrieved ${keys.length} keys`);
      return [...keys]; // 创建可变副本
    } catch (error) {
      logger.error(this.TAG, 'Failed to get all keys', error);
      return [];
    }
  }

  /**
   * 批量操作
   */
  async multiSet(keyValuePairs: Array<[string, any]>): Promise<void> {
    try {
      const jsonPairs: Array<[string, string]> = keyValuePairs.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      
      await AsyncStorage.multiSet(jsonPairs);
      logger.debug(this.TAG, `Batch stored ${keyValuePairs.length} items`);
    } catch (error) {
      logger.error(this.TAG, 'Failed to batch store items', error);
      throw error;
    }
  }

  async multiGet<T>(keys: string[]): Promise<Array<[string, T | null]>> {
    try {
      const results = await AsyncStorage.multiGet(keys);
      const parsedResults: Array<[string, T | null]> = results.map(([key, value]) => [
        key,
        value ? JSON.parse(value) as T : null,
      ]);
      
      logger.debug(this.TAG, `Batch retrieved ${keys.length} items`);
      return parsedResults;
    } catch (error) {
      logger.error(this.TAG, 'Failed to batch retrieve items', error);
      return keys.map(key => [key, null]);
    }
  }

  /**
   * 检查键是否存在
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      logger.error(this.TAG, `Failed to check if key exists: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取存储大小信息
   */
  async getStorageSize(): Promise<{ used: number; available: number } | null> {
    try {
      // React Native AsyncStorage 没有直接的大小API
      // 这里提供一个估算方法
      const keys = await this.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
      
      return {
        used: totalSize,
        available: -1, // 无法准确获取可用空间
      };
    } catch (error) {
      logger.error(this.TAG, 'Failed to get storage size', error);
      return null;
    }
  }
}

export const storage = StorageManager.getInstance();
export default storage;
