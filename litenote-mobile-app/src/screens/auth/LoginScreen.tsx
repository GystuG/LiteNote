/**
 * 登录/注册页面 - Neo-Brutalism 风格
 * 大粗标题 + 描边表单卡片 + 描边输入框 + 糖果色按钮
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../providers';
import { ThemeColors } from '../../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';

type AuthMode = 'login' | 'register';

interface FieldErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export default function LoginScreen() {
  const { login, register } = useAuth();
  const navigation = useNavigation();
  const styles = useStyles(createStyles);

  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!username.trim()) {
      errors.username = '请输入用户名';
    } else if (username.length < 3) {
      errors.username = '用户名至少需要3个字符';
    }

    if (!password) {
      errors.password = '请输入密码';
    } else if (password.length < 6) {
      errors.password = '密码至少需要6个字符';
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        errors.confirmPassword = '请确认密码';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = '两次输入的密码不一致';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      setErrorMessage('请先阅读并同意用户协议和隐私政策');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (mode === 'login') {
        await login({ username, password });
      } else {
        await register({
          username,
          password,
          nickname: nickname || undefined,
        });
      }
    } catch (error: any) {
      const message = error?.message || error?.details?.message || (mode === 'login' ? '登录失败' : '注册失败');
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToRegister = () => {
    setMode('register');
    setErrorMessage('');
    setFieldErrors({});
  };

  const switchToLogin = () => {
    setMode('login');
    setErrorMessage('');
    setFieldErrors({});
    setConfirmPassword('');
    setNickname('');
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    if (fieldErrors.username) {
      setFieldErrors(prev => ({ ...prev, username: undefined }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (fieldErrors.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image source={require('../../../public/icons/logo.jpg')} style={styles.logoImage} />
            </View>
            <Text style={styles.title}>LiteNote</Text>
            <Text style={styles.subtitle}>你的生活理财助手</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
                onPress={switchToLogin}
              >
                <Text style={[styles.modeButtonText, mode === 'login' && styles.modeButtonTextActive]}>
                  登录
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
                onPress={switchToRegister}
              >
                <Text style={[styles.modeButtonText, mode === 'register' && styles.modeButtonTextActive]}>
                  注册
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Fields */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, fieldErrors.username && styles.inputError]}
                  placeholder="用户名"
                  placeholderTextColor={styles._colors.textTertiary}
                  value={username}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {fieldErrors.username && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.username}</Text>
                )}
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, fieldErrors.password && styles.inputError]}
                  placeholder="密码"
                  placeholderTextColor={styles._colors.textTertiary}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry
                />
                {fieldErrors.password && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
                )}
              </View>

              {mode === 'register' && (
                <>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, fieldErrors.confirmPassword && styles.inputError]}
                      placeholder="确认密码"
                      placeholderTextColor={styles._colors.textTertiary}
                      value={confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      secureTextEntry
                    />
                    {fieldErrors.confirmPassword && (
                      <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>
                    )}
                  </View>

                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="昵称（选填）"
                      placeholderTextColor={styles._colors.textTertiary}
                      value={nickname}
                      onChangeText={setNickname}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? '登录' : '注册'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Terms Agreement */}
          <View style={styles.termsSection}>
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={styles.termsText}>
                我已阅读并同意{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('UserAgreement')}
                >
                  《用户协议》
                </Text>
                {' '}和{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('PrivacyPolicy')}
                >
                  《隐私政策》
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
      justifyContent: 'center',
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thick,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      ...shadow.medium,
    },
    logoImage: {
      width: '100%',
      height: '100%',
      borderRadius: borderRadius.small,
    },
    title: {
      fontSize: 32,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      ...shadow.medium,
    },
    modeToggle: {
      flexDirection: 'row',
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      overflow: 'hidden',
      marginBottom: spacing.xl,
    },
    modeButton: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
    },
    modeButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    modeButtonTextActive: {
      color: '#FFFFFF',
    },
    inputGroup: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    inputWrapper: {},
    input: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.input,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      minHeight: 48,
    },
    inputError: {
      borderColor: colors.error,
    },
    fieldErrorText: {
      color: colors.error,
      fontSize: 12,
      fontWeight: '600',
      marginTop: spacing.xs,
      marginLeft: spacing.sm,
    },
    errorContainer: {
      backgroundColor: '#FEE2E2',
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.error,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      ...shadow.small,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    termsSection: {
      alignItems: 'center',
    },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.md,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
      marginTop: 1,
      backgroundColor: colors.surface,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.stroke,
    },
    termsText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      lineHeight: 18,
    },
    termsLink: {
      color: colors.primary,
      fontWeight: '700',
    },
  }),
  _colors: colors,
});
