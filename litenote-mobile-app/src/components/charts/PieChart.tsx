/**
 * 饼图组件 - Neo-Brutalism 风格
 * SVG 粗描边 + 方形图例点 + Courier 百分比
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth } from '../../theme';
import { useStyles } from '../../hooks';

interface PieChartData {
  value: number;
  color: string;
  label: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  innerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const PieChart: React.FC<PieChartProps> = ({
  data,
  size = screenWidth * 0.6,
  innerRadius = 0,
  showLabels = false,
  showLegend = true,
}) => {
  const styles = useStyles(createStyles);
  const center = size / 2;
  const radius = size / 2;
  const innerR = innerRadius * radius;

  // 计算总值
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  // 计算每个扇形的角度
  let currentAngle = -90; // 从顶部开始
  const arcs = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      angle,
    };
  });

  // 极坐标转笛卡尔坐标
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  // 创建扇形路径
  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    if (innerR > 0) {
      // 环形图
      const innerStart = polarToCartesian(center, center, innerR, endAngle);
      const innerEnd = polarToCartesian(center, center, innerR, startAngle);

      return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        'L', innerEnd.x, innerEnd.y,
        'A', innerR, innerR, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
        'Z',
      ].join(' ');
    } else {
      // 饼图
      return [
        'M', center, center,
        'L', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        'Z',
      ].join(' ');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <G>
            {arcs.map((arc, index) => (
              <Path
                key={index}
                d={createArcPath(arc.startAngle, arc.endAngle)}
                fill={arc.color}
                stroke={styles._colors.stroke}
                strokeWidth={3}
              />
            ))}
          </G>
          {showLabels && (
            <G>
              {arcs.map((arc, index) => {
                if (arc.percentage < 3) return null;
                const labelAngle = (arc.startAngle + arc.endAngle) / 2;
                const labelRadius = innerR > 0 ? radius + 15 : radius * 0.75;
                const labelPos = polarToCartesian(center, center, labelRadius, labelAngle);

                return (
                  <G key={index}>
                    <Circle
                      cx={labelPos.x}
                      cy={labelPos.y}
                      r={16}
                      fill={styles._colors.surface}
                      stroke={styles._colors.stroke}
                      strokeWidth={2}
                    />
                    <SvgText
                      x={labelPos.x}
                      y={labelPos.y}
                      fill={styles._colors.textPrimary}
                      fontSize={10}
                      fontWeight="800"
                      fontFamily="Courier"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {`${arc.percentage.toFixed(0)}%`}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          )}
        </Svg>
      </View>

      {showLegend && (
        <View style={styles.legend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[
                styles.legendColor,
                { backgroundColor: item.color },
              ]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
              <Text style={styles.legendValue}>
                {((item.value / total) * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    chartContainer: {
      marginBottom: spacing.lg,
    },
    legend: {
      width: '100%',
      paddingHorizontal: spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    legendColor: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      marginRight: spacing.sm,
    },
    legendLabel: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    legendValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      fontFamily: 'Courier',
    },
  }),
  _colors: colors,
});
