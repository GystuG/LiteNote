/**
 * Neo-Brutalism 间距与阴影系统
 * 粗描边 + 实心偏移阴影 + 硬边
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export const borderRadius = {
  none: 0,
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
  round: 50,
  card: 16,       // Neo-Brutalism: 中等圆角
  button: 12,
  input: 12,
} as const;

// Neo-Brutalism 描边宽度
export const borderWidth = {
  thin: 2,
  medium: 3,
  thick: 4,
} as const;

// Neo-Brutalism 核心: 实心偏移阴影（无模糊）
export const shadow = {
  small: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  medium: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  large: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
