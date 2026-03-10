/**
 * useStyles Hook
 * 简化动态主题样式的创建
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../providers';
import { ThemeColors } from '../theme/colors';

type StyleCreator<T> = (colors: ThemeColors) => T;

/**
 * 创建响应主题变化的动态样式
 * @param styleCreator 样式创建函数，接收 colors 参数
 * @returns 动态样式对象
 *
 * @example
 * const styles = useStyles((colors) => StyleSheet.create({
 *   container: { backgroundColor: colors.background },
 *   text: { color: colors.textPrimary },
 * }));
 */
export function useStyles<T>(styleCreator: StyleCreator<T>): T {
  const { colors } = useTheme();
  return useMemo(() => styleCreator(colors), [colors, styleCreator]);
}

/**
 * 创建带有静态样式和动态样式的组合
 * @param staticStyles 静态样式（不依赖主题）
 * @param dynamicStyleCreator 动态样式创建函数
 * @returns { static, dynamic } 样式对象
 *
 * @example
 * const { static: s, dynamic: d } = useThemedStyles(
 *   StyleSheet.create({ flex: { flex: 1 } }),
 *   (colors) => StyleSheet.create({ bg: { backgroundColor: colors.background } })
 * );
 */
export function useThemedStyles<S, D>(
  staticStyles: S,
  dynamicStyleCreator: StyleCreator<D>
): { static: S; dynamic: D } {
  const { colors } = useTheme();
  const dynamic = useMemo(() => dynamicStyleCreator(colors), [colors, dynamicStyleCreator]);
  return { static: staticStyles, dynamic };
}
