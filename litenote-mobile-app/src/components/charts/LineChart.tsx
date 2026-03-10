/**
 * 折线图组件 - Neo-Brutalism 风格
 * 粗线条 + 描边数据点 + Courier 轴标签
 */
import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Line, Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { ThemeColors } from '../../theme/colors';
import { spacing } from '../../theme';
import { useStyles } from '../../hooks';

interface LineChartData {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  width?: number;
  height?: number;
  lineColor?: string;
  dotColor?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  formatValue?: (value: number) => string;
}

const { width: screenWidth } = Dimensions.get('window');

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = screenWidth - spacing.lg * 2,
  height = 200,
  lineColor,
  dotColor,
  showGrid = true,
  showLabels = true,
  showValues = false,
  formatValue = (value) => value.toFixed(0),
}) => {
  const styles = useStyles(createStyles);
  const defaultLineColor = lineColor || styles._colors.primary;
  const defaultDotColor = dotColor || styles._colors.primary;

  if (data.length === 0) return null;

  const padding = {
    top: showValues ? 30 : 20,
    right: 20,
    bottom: showLabels ? 40 : 20,
    left: 40,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 计算数据范围
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // 计算网格线
  const gridLines = 5;
  const gridStep = valueRange / (gridLines - 1);
  const grids = Array.from({ length: gridLines }, (_, i) => minValue + gridStep * i);

  // 计算点的位置
  const points = data.map((d, index) => {
    const x = padding.left + (chartWidth / (data.length - 1)) * index;
    const y = padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight;
    return { x, y, value: d.value, label: d.label };
  });

  // 创建路径
  const linePath = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x},${point.y}`;
      return `L ${point.x},${point.y}`;
    })
    .join(' ');

  // 创建渐变区域路径
  const areaPath = `${linePath} L ${points[points.length - 1].x},${padding.top + chartHeight} L ${points[0].x},${padding.top + chartHeight} Z`;

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

        {/* 填充区域 */}
        <Path
          d={areaPath}
          fill={defaultLineColor}
          fillOpacity={0.08}
        />

        {/* 折线 - 粗线条 */}
        <Path
          d={linePath}
          stroke={defaultLineColor}
          strokeWidth={3}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 数据点 - 描边圆点 */}
        <G>
          {points.map((point, index) => (
            <G key={index}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={5}
                fill={defaultDotColor}
                stroke={styles._colors.stroke}
                strokeWidth={2}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={2}
                fill={styles._colors.surface}
              />
            </G>
          ))}
        </G>

        {/* 数值标签 */}
        {showValues && (
          <G>
            {points.map((point, index) => (
              <SvgText
                key={index}
                x={point.x}
                y={point.y - 12}
                fill={styles._colors.textPrimary}
                fontSize={10}
                fontWeight="700"
                fontFamily="Courier"
                textAnchor="middle"
              >
                {formatValue(point.value)}
              </SvgText>
            ))}
          </G>
        )}

        {/* X轴标签 */}
        {showLabels && (
          <G>
            {points.map((point, index) => {
              // 只显示部分标签避免重叠
              if (data.length > 6 && index % 2 !== 0) return null;
              return (
                <SvgText
                  key={index}
                  x={point.x}
                  y={padding.top + chartHeight + 20}
                  fill={styles._colors.textTertiary}
                  fontSize={10}
                  fontWeight="600"
                  fontFamily="Courier"
                  textAnchor="middle"
                >
                  {point.label}
                </SvgText>
              );
            })}
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
