/**
 * Neo-Brutalism 色彩系统
 * 饱和糖果色 + 粗描边 + 实心填充
 */

// 浅色模式颜色 - Neo-Brutalism
export const lightColors = {
  // 主色调 - 电光蓝
  primary: '#3B82F6',
  primaryLight: '#DBEAFE',
  primaryDark: '#1D4ED8',

  // 辅助色 - 糖果色块
  secondary: '#A855F7',    // 亮紫
  accent: '#FACC15',       // 明黄
  success: '#22C55E',      // 翠绿
  successLight: '#DEF7EC', // 浅绿背景
  warning: '#FB923C',      // 橙色
  error: '#EF4444',        // 红色

  // Neo-Brutalism 特色色
  pink: '#EC4899',         // 糖果粉
  lime: '#84CC16',         // 柠檬绿
  cyan: '#06B6D4',         // 青色
  orange: '#F97316',       // 亮橙

  // 描边色
  stroke: '#1A1A1A',       // 主描边 - 接近纯黑
  strokeLight: '#404040',  // 轻描边

  // 中性色系统
  textPrimary: '#1A1A1A',
  textSecondary: '#404040',
  textTertiary: '#737373',
  textQuaternary: '#A3A3A3',
  divider: '#E5E5E5',
  background: '#FEF9EF',    // 暖白/米色背景 - 典型 Neo-Brutalism
  surface: '#FFFFFF',

  // 功能色 - 收支
  income: '#22C55E',
  expense: '#EF4444',

  // 卡片和容器
  cardBackground: '#FFFFFF',
  cardBorder: '#1A1A1A',    // 粗描边

  // 透明度变体
  shadow: '#1A1A1A',         // 实心阴影色
  shadowDark: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // 渐变色 (Neo-Brutalism 很少用渐变，保留兼容)
  gradientPrimaryStart: '#3B82F6',
  gradientPrimaryEnd: '#60A5FA',
} as const;

// 深色模式颜色 - Neo-Brutalism Dark
export const darkColors = {
  // 主色调
  primary: '#60A5FA',
  primaryLight: '#1E3A5F',
  primaryDark: '#3B82F6',

  // 辅助色
  secondary: '#C084FC',
  accent: '#FDE047',
  success: '#4ADE80',
  successLight: '#1A3328',
  warning: '#FDBA74',
  error: '#F87171',

  // Neo-Brutalism 特色色
  pink: '#F472B6',
  lime: '#A3E635',
  cyan: '#22D3EE',
  orange: '#FB923C',

  // 描边色
  stroke: '#E5E5E5',        // 深色模式下用浅色描边
  strokeLight: '#A3A3A3',

  // 中性色系统
  textPrimary: '#FAFAFA',
  textSecondary: '#D4D4D4',
  textTertiary: '#A3A3A3',
  textQuaternary: '#737373',
  divider: '#404040',
  background: '#18181B',
  surface: '#27272A',

  // 功能色 - 收支
  income: '#4ADE80',
  expense: '#F87171',

  // 卡片和容器
  cardBackground: '#27272A',
  cardBorder: '#E5E5E5',

  // 透明度变体
  shadow: '#000000',
  shadowDark: '#000000',
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // 渐变色
  gradientPrimaryStart: '#60A5FA',
  gradientPrimaryEnd: '#93C5FD',
} as const;

// 默认导出浅色模式（保持向后兼容）
export const colors = lightColors;

export type ThemeColors = typeof lightColors;
export type ColorKey = keyof ThemeColors;
