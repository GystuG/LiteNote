/**
 * Neo-Brutalism 字体系统
 * 粗黑/等宽字体，张扬大胆
 */

export const typography = {
  // 字体族
  fontFamily: {
    primary: 'PingFang SC',
    mono: 'Courier',  // 等宽字体 - Neo-Brutalism 特色
    fallback: 'Helvetica Neue, Arial, sans-serif',
  },

  // 字号规范 - 更大更醒目
  fontSize: {
    largeTitle: 36,
    title: 20,
    body: 16,
    small: 14,
    caption: 12,
  },

  // 字重 - 偏向粗黑
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '600',    // medium 提升到 600
    semiBold: '700',  // semiBold 提升到 700
    bold: '800',      // bold 提升到 800
    black: '900',     // 新增: 极粗
  },

  // 行高
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    loose: 1.7,
  },
} as const;

export type FontSizeKey = keyof typeof typography.fontSize;
export type FontWeightKey = keyof typeof typography.fontWeight;
