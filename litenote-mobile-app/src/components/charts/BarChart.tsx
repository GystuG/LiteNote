/**
 * 柱状图组件 - Neo-Brutalism 风格
 * 粗黑轮廓柱体 + 糖果色填充 + Courier 轴标签
 */
import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { ThemeColors } from '../../theme/colors';
import { spacing } from '../../theme';
import { useStyles } from '../../hooks';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  width?: number;
  height?: number;
  barColor?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  formatValue?: (value: number) => string;
}

const { width: screenWidth } = Dimensions.get('window');

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = screenWidth - spacing.lg * 2,
  height = 200,
  barColor,
  showGrid = true,
  showLabels = true,
  showValues = true,
  formatValue = (value) => value.toFixed(0),
}) => {
  const styles = useStyles(createStyles);
  const defaultBarColor = barColor || styles._colors.primary;

  if (data.length === 0) return null;

  const padding = {
    top: showValues ? 30 : 20,
    right: 20,
    bottom: showLabels ? 40 : 20,
    left: 50,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 计算数据范围
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(0, ...values);
  const valueRange = maxValue - minValue || 1;

  // 计算柱子的宽度和间距
  const barWidth = chartWidth / data.length * 0.6;
  const barSpacing = chartWidth / data.length * 0.4;
  const totalBarWidth = chartWidth / data.length;

  // 计算网格线
  const gridLines = 5;
  const gridStep = valueRange / (gridLines - 1);
  const grids = Array.from({ length: gridLines }, (_, i) => minValue + gridStep * i);

  // 计算柱子的位置
  const bars = data.map((d, index) => {
    const x = padding.left + totalBarWidth * index + barSpacing / 2;
    const barHeight = ((d.value - minValue) / valueRange) * chartHeight;
    const y = padding.top + chartHeight - barHeight;
    return {
      x,
      y,
      width: barWidth,
      height: barHeight,
      value: d.value,
      label: d.label,
      color: d.color || defaultBarColor,
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* 网格线 */}
        {showGrid && (
          <G>
            {grids.map((value, index) => {
              const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
              return (
                <G key={index}>
                  <Line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke={styles._colors.divider}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <SvgText
                    x={padding.left - 8}
                    y={y + 4}
                    fill={styles._colors.textTertiary}
                    fontSize={10}
                    fontWeight="600"
                    fontFamily="Courier"
                    textAnchor="end"
                  >
                    {formatValue(value)}
                  </SvgText>
                </G>
              );
            })}
          </G>
        )}

        {/* X轴线 */}
        <Line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke={styles._colors.stroke}
          strokeWidth={2}
        />

        {/* 柱子 - 粗黑轮廓 */}
        <G>
          {bars.map((bar, index) => (
            <Rect
              key={index}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.color}
              stroke={styles._colors.stroke}
              strokeWidth={2}
              rx={4}
              ry={4}
            />
          ))}
        </G>

        {/* 数值标签 */}
        {showValues && (
          <G>
            {bars.map((bar, index) => (
              <SvgText
                key={index}
                x={bar.x + bar.width / 2}
                y={bar.y - 6}
                fill={styles._colors.textPrimary}
                fontSize={10}
                fontWeight="700"
                fontFamily="Courier"
                textAnchor="middle"
              >
                {formatValue(bar.value)}
              </SvgText>
            ))}
          </G>
        )}

        {/* X轴标签 */}
        {showLabels && (
          <G>
            {bars.map((bar, index) => (
              <SvgText
                key={index}
                x={bar.x + bar.width / 2}
                y={padding.top + chartHeight + 20}
                fill={styles._colors.textTertiary}
                fontSize={10}
                fontWeight="600"
                fontFamily="Courier"
                textAnchor="middle"
              >
                {bar.label}
              </SvgText>
            ))}
          </G>
        )}
      </Svg>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      alignItems: 'center',
    },
  }),
  _colors: colors,
});
