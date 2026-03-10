/**
 * 用户协议页面 - Neo-Brutalism 风格
 * 描边内容卡片 + 粗标题
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth } from '../../theme/spacing';
import { useStyles } from '../../hooks';

export default function UserAgreementScreen() {
  const styles = useStyles(createStyles);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.updateDate}>更新日期：2026年1月1日</Text>

          <Text style={styles.sectionTitle}>一、服务条款的确认和接纳</Text>
          <Text style={styles.paragraph}>
            欢迎使用智能记账应用（以下简称"本应用"）。在使用本应用前，请您仔细阅读本用户协议（以下简称"本协议"）的全部内容。如您不同意本协议的任何内容，请勿注册或使用本应用。一旦您注册、登录或以其他方式使用本应用，即视为您已阅读并同意本协议的全部条款。
          </Text>

          <Text style={styles.sectionTitle}>二、服务内容</Text>
          <Text style={styles.paragraph}>
            本应用为用户提供个人财务记账管理服务，包括但不限于：{'\n'}
            • 收入与支出记录{'\n'}
            • 账单分类管理{'\n'}
            • 财务统计分析{'\n'}
            • 预算管理{'\n'}
            • 数据云端同步
          </Text>

          <Text style={styles.sectionTitle}>三、用户注册</Text>
          <Text style={styles.paragraph}>
            1. 用户在使用本应用服务前需要注册账号。用户在注册时应提供真实、准确、完整的个人信息。{'\n'}
            2. 用户有责任妥善保管账号和密码，并对其账号下的所有行为负责。{'\n'}
            3. 用户不得将账号转让、出租或借给他人使用。
          </Text>

          <Text style={styles.sectionTitle}>四、用户行为规范</Text>
          <Text style={styles.paragraph}>
            用户在使用本应用时，应遵守相关法律法规，不得：{'\n'}
            • 上传、发布违法、有害或侵权内容{'\n'}
            • 干扰、破坏本应用的正常运行{'\n'}
            • 利用本应用进行任何违法活动
          </Text>

          <Text style={styles.sectionTitle}>五、知识产权</Text>
          <Text style={styles.paragraph}>
            本应用的所有内容，包括但不限于文字、图片、软件、音频、视频等，其知识产权均归本应用所有或其合法授权方所有。未经授权，用户不得复制、修改、传播上述内容。
          </Text>

          <Text style={styles.sectionTitle}>六、免责声明</Text>
          <Text style={styles.paragraph}>
            1. 本应用提供的财务数据仅供参考，不构成投资建议。{'\n'}
            2. 因不可抗力或系统维护等原因导致的服务中断，本应用不承担责任。{'\n'}
            3. 用户因违反本协议或相关法律法规而造成的损失，由用户自行承担。
          </Text>

          <Text style={styles.sectionTitle}>七、协议修改</Text>
          <Text style={styles.paragraph}>
            本应用有权在必要时修改本协议条款。协议修改后，将通过应用内通知等方式告知用户。如用户继续使用本应用，则视为接受修改后的协议。
          </Text>

          <Text style={styles.sectionTitle}>八、联系我们</Text>
          <Text style={styles.paragraph}>
            如您对本协议有任何疑问，请通过以下方式联系我们：{'\n'}
            邮箱：support@litenote.app
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
