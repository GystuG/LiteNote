/**
 * 隐私政策页面 - Neo-Brutalism 风格
 * 描边内容卡片 + 粗标题
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth } from '../../theme/spacing';
import { useStyles } from '../../hooks';

export default function PrivacyPolicyScreen() {
  const styles = useStyles(createStyles);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.updateDate}>更新日期：2026年1月1日</Text>

          <Text style={styles.sectionTitle}>引言</Text>
          <Text style={styles.paragraph}>
            智能记账应用（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规要求，采取相应安全保护措施，尽力保护您的个人信息安全可控。
          </Text>

          <Text style={styles.sectionTitle}>一、我们收集的信息</Text>
          <Text style={styles.paragraph}>
            为向您提供服务，我们可能收集以下信息：{'\n\n'}
            <Text style={styles.subTitle}>1. 账户信息</Text>{'\n'}
            • 用户名、昵称{'\n'}
            • 邮箱地址（可选）{'\n'}
            • 头像（可选）{'\n\n'}
            <Text style={styles.subTitle}>2. 财务数据</Text>{'\n'}
            • 您记录的收入和支出信息{'\n'}
            • 账单分类和标签{'\n'}
            • 预算设置{'\n\n'}
            <Text style={styles.subTitle}>3. 设备信息</Text>{'\n'}
            • 设备型号、操作系统版本{'\n'}
            • 应用版本号{'\n'}
            • 网络状态
          </Text>

          <Text style={styles.sectionTitle}>二、我们如何使用您的信息</Text>
          <Text style={styles.paragraph}>
            我们收集的信息将用于：{'\n'}
            • 提供、维护和改进我们的服务{'\n'}
            • 为您提供个性化的财务分析和建议{'\n'}
            • 保护您的账户安全{'\n'}
            • 发送服务通知和更新信息{'\n'}
            • 进行数据分析以改善用户体验
          </Text>

          <Text style={styles.sectionTitle}>三、信息存储与安全</Text>
          <Text style={styles.paragraph}>
            1. 您的数据存储在安全的云服务器上，采用加密传输和存储。{'\n'}
            2. 我们采取合理的技术和管理措施保护您的个人信息。{'\n'}
            3. 我们会定期审查安全措施，确保信息安全。{'\n'}
            4. 密码等敏感信息经过加密处理后存储。
          </Text>

          <Text style={styles.sectionTitle}>四、信息共享</Text>
          <Text style={styles.paragraph}>
            我们不会将您的个人信息出售、出租或以其他方式提供给第三方，除非：{'\n'}
            • 获得您的明确同意{'\n'}
            • 根据法律法规要求或政府机关的合法要求{'\n'}
            • 为保护我们的合法权益而必要的情况
          </Text>

          <Text style={styles.sectionTitle}>五、您的权利</Text>
          <Text style={styles.paragraph}>
            您对个人信息享有以下权利：{'\n'}
            • 访问和查看您的个人信息{'\n'}
            • 更正不准确的信息{'\n'}
            • 删除您的账户和相关数据{'\n'}
            • 导出您的财务数据{'\n'}
            • 撤回同意
          </Text>

          <Text style={styles.sectionTitle}>六、未成年人保护</Text>
          <Text style={styles.paragraph}>
            本应用主要面向成年人。如果您是未成年人，请在监护人的指导下使用本应用并阅读本隐私政策。
          </Text>

          <Text style={styles.sectionTitle}>七、隐私政策更新</Text>
          <Text style={styles.paragraph}>
            我们可能会不时更新本隐私政策。重大变更将通过应用内通知告知您。继续使用我们的服务即表示您同意更新后的隐私政策。
          </Text>

          <Text style={styles.sectionTitle}>八、联系我们</Text>
          <Text style={styles.paragraph}>
            如您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：{'\n'}
            邮箱：privacy@litenote.app
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    contentCard: {
      backgroundColor: colors.surface,
      margin: spacing.lg,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.xl,
    },
    updateDate: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Courier',
      color: colors.textTertiary,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    subTitle: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    paragraph: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      lineHeight: 22,
    },
    bottomSpacing: {
      height: spacing.xxl,
    },
  }),
  _colors: colors,
});
