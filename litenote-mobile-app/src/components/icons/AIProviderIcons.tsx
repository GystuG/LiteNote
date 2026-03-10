/**
 * AI 服务商官方 Logo 图标组件
 * 使用 PNG 图片文件
 */
import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface IconProps {
  size?: number;
}

// 图标资源
const icons = {
  claude: require('../../../public/icons/claude-color.png'),
  openai: require('../../../public/icons/openai.png'),
  deepseek: require('../../../public/icons/deepseek-color.png'),
  qwen: require('../../../public/icons/qwen-color.png'),
};

/**
 * 通用服务商图标组件
 */
export const ProviderIcon: React.FC<IconProps & { provider: 'claude' | 'openai' | 'deepseek' | 'qwen' }> = ({
  provider,
  size = 24,
}) => {
  return (
    <Image
      source={icons[provider] || icons.claude}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};

// 单独导出各图标组件（保持兼容性）
export const ClaudeIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image source={icons.claude} style={{ width: size, height: size }} resizeMode="contain" />
);

export const OpenAIIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image source={icons.openai} style={{ width: size, height: size }} resizeMode="contain" />
);

export const DeepSeekIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image source={icons.deepseek} style={{ width: size, height: size }} resizeMode="contain" />
);

export const QwenIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image source={icons.qwen} style={{ width: size, height: size }} resizeMode="contain" />
);

export type { IconProps };
