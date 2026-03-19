const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { createHash } = require('crypto');

/**
 * 稳定的模块 ID 工厂
 * 基于文件路径的 hash 生成模块 ID，而非 Metro 默认的递增数字
 * 这确保了热更新时模块 ID 不会因为新增/删除文件而整体偏移
 */
function createStableModuleIdFactory() {
  return (path) => {
    const hash = createHash('md5').update(path).digest('hex').substring(0, 8);
    return parseInt(hash, 16);
  };
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  serializer: {
    createModuleIdFactory: createStableModuleIdFactory,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
