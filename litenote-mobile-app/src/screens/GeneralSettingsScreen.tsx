/**
 * 通用配置屏幕 - Neo-Brutalism 风格
 * 描边配置卡片 + 粗标签 + 糖果色强调
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors } from '../theme/colors';
import { spacing, borderRadius, borderWidth, shadow } from '../theme';
import { PaymentNotificationSettings } from '../components/business';
import { paymentNotificationService } from '../services/paymentNotification';
import { useStyles } from '../hooks';
import { useAlert } from '../providers';
import { aiService } from '../services/api/ai';
import type {
  AIModelConfig,
  AIProvider,
  CreateAIConfigDto,
  UpdateAIConfigDto,
} from '../types/ai';
import { AI_PROVIDERS } from '../types/ai';
import { ProviderIcon } from '../components/icons';

interface GeneralSettingsScreenProps {
  navigation?: any;
}

interface MonitoredApp {
  id: string;
  packageName: string;
  appName: string;
  enabled: boolean;
}

interface AppConfig {
  monitoredApps: MonitoredApp[];
  filterKeywords: string[];
}

// AI 模型配置编辑弹窗
interface AIConfigModalProps {
  visible: boolean;
  config: AIModelConfig | null;
  onClose: () => void;
  onSave: (data: CreateAIConfigDto | UpdateAIConfigDto) => void;
  isSaving: boolean;
  colors: ThemeColors;
}

function AIConfigModal({
  visible,
  config,
  onClose,
  onSave,
  isSaving,
  colors,
}: AIConfigModalProps) {
  const { alert: showConfigAlert } = useAlert();
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<AIProvider>('claude');
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [supportsVision, setSupportsVision] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [showProviderPicker, setShowProviderPicker] = useState(false);

  useEffect(() => {
    if (config) {
      setName(config.name);
      setProvider(config.provider);
      setApiKey(config.apiKey || '');
      setApiBaseUrl(config.apiBaseUrl || '');
      setModel(config.model);
      setSupportsVision(config.supportsVision);
      setIsDefault(config.isDefault);
    } else {
      setName('');
      setProvider('claude');
      setApiKey('');
      setApiBaseUrl('');
      setModel(AI_PROVIDERS.claude.models[0]);
      setSupportsVision(true);
      setIsDefault(false);
    }
  }, [config, visible]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    if (!config) {
      setModel(AI_PROVIDERS[newProvider].models[0]);
    }
    setSupportsVision(AI_PROVIDERS[newProvider].supportsVision);
    setShowProviderPicker(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showConfigAlert('提示', '请输入配置名称');
      return;
    }
    if (!apiKey.trim()) {
      showConfigAlert('提示', '请输入 API Key');
      return;
    }
    if (!model.trim()) {
      showConfigAlert('提示', '请输入模型名称');
      return;
    }

    const data: CreateAIConfigDto | UpdateAIConfigDto = {
      name: name.trim(),
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      supportsVision,
      isDefault,
    };

    if (apiBaseUrl.trim()) {
      data.apiBaseUrl = apiBaseUrl.trim();
    }

    onSave(data);
  };

  const modalStyles = createModalStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.content}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{config ? '编辑模型配置' : '添加模型配置'}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Text style={modalStyles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false}>
            {/* 名称 */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>名称</Text>
              <TextInput
                style={modalStyles.input}
                value={name}
                onChangeText={setName}
                placeholder="如: 我的 Claude"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* 服务商 */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>服务商</Text>
              <TouchableOpacity
                style={modalStyles.picker}
                onPress={() => setShowProviderPicker(true)}
              >
                <View style={modalStyles.pickerContent}>
                  <ProviderIcon provider={provider} size={18} />
                  <Text style={modalStyles.pickerText}>{AI_PROVIDERS[provider].name}</Text>
                </View>
                <Text style={modalStyles.pickerArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* API Key */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>API Key</Text>
              <TextInput
                style={modalStyles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="请输入 API Key"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* API 地址 */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>API 地址（可选）</Text>
              <TextInput
                style={modalStyles.input}
                value={apiBaseUrl}
                onChangeText={setApiBaseUrl}
                placeholder={`默认: ${AI_PROVIDERS[provider].defaultUrl}`}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* 模型 */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>模型</Text>
              <TextInput
                style={modalStyles.input}
                value={model}
                onChangeText={setModel}
                placeholder={`如: ${AI_PROVIDERS[provider].models[0]}`}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* 支持图片 */}
            <View style={modalStyles.switchRow}>
              <View style={modalStyles.switchLeft}>
                <Text style={modalStyles.switchLabel}>支持图片识别</Text>
                <Text style={modalStyles.switchHint}>
                  {AI_PROVIDERS[provider].supportsVision
                    ? '此服务商支持图片'
                    : '此服务商不支持图片'}
                </Text>
              </View>
              <Switch
                value={supportsVision}
                onValueChange={setSupportsVision}
                trackColor={{ false: colors.divider, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={!AI_PROVIDERS[provider].supportsVision}
              />
            </View>

            {/* 设为默认 */}
            <View style={modalStyles.switchRow}>
              <View style={modalStyles.switchLeft}>
                <Text style={modalStyles.switchLabel}>设为默认</Text>
                <Text style={modalStyles.switchHint}>AI 助手将优先使用此配置</Text>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: colors.divider, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.cancelButton]}
              onPress={onClose}
            >
              <Text style={modalStyles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.saveButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={modalStyles.saveButtonText}>保存</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 服务商选择器 */}
        <Modal
          visible={showProviderPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowProviderPicker(false)}
        >
          <TouchableOpacity
            style={modalStyles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowProviderPicker(false)}
          >
            <View style={modalStyles.pickerList}>
              {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[modalStyles.pickerItem, provider === p && modalStyles.pickerItemActive]}
                  onPress={() => handleProviderChange(p)}
                >
                  <View style={modalStyles.pickerItemRow}>
                    <ProviderIcon provider={p} size={18} />
                    <Text
                      style={[
                        modalStyles.pickerItemText,
                        provider === p && modalStyles.pickerItemTextActive,
                      ]}
                    >
                      {AI_PROVIDERS[p].name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
}

const createModalStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    content: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.card,
      borderTopRightRadius: borderRadius.card,
      borderTopWidth: borderWidth.thick,
      borderLeftWidth: borderWidth.thick,
      borderRightWidth: borderWidth.thick,
      borderColor: colors.stroke,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: borderWidth.thin,
      borderBottomColor: colors.stroke,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    closeButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.background,
    },
    closeIcon: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    body: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    field: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    input: {
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    picker: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      backgroundColor: colors.background,
    },
    pickerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    pickerText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    pickerArrow: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    switchLeft: {
      flex: 1,
      marginRight: spacing.md,
    },
    switchLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    switchHint: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 2,
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
    },
    button: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.button,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      ...shadow.small,
    },
    saveButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pickerList: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.medium,
      borderColor: colors.stroke,
      padding: spacing.sm,
      minWidth: 200,
      ...shadow.medium,
    },
    pickerItem: {
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.small,
    },
    pickerItemActive: {
      backgroundColor: colors.accent,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    pickerItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    pickerItemText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    pickerItemTextActive: {
      color: colors.textPrimary,
      fontWeight: '800',
    },
  });

export default function GeneralSettingsScreen({ navigation }: GeneralSettingsScreenProps) {
  const styles = useStyles(createStyles);
  const { alert, confirm } = useAlert();

  // 基础配置
  const [config, setConfig] = useState<AppConfig>({
    monitoredApps: [
      { id: '1', packageName: 'com.tencent.mm', appName: '微信', enabled: true },
      { id: '2', packageName: 'com.eg.android.AlipayGphone', appName: '支付宝', enabled: true },
    ],
    filterKeywords: ['支付', '付款', '消费', '扣款', '支出', '交易提醒', '花呗', '余额宝', '已支付'],
  });

  // AI 模型配置
  const [aiConfigs, setAiConfigs] = useState<AIModelConfig[]>([]);
  const [loadingAiConfigs, setLoadingAiConfigs] = useState(false);
  const [showAiConfigModal, setShowAiConfigModal] = useState(false);
  const [editingAiConfig, setEditingAiConfig] = useState<AIModelConfig | null>(null);
  const [savingAiConfig, setSavingAiConfig] = useState(false);
  const [testingConfigId, setTestingConfigId] = useState<number | null>(null);

  // 其他状态
  const [newAppName, setNewAppName] = useState('');
  const [newPackageName, setNewPackageName] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [installedApps, setInstalledApps] = useState<Array<{ packageName: string; appName: string }>>(
    []
  );
  const [loadingApps, setLoadingApps] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载配置
  useEffect(() => {
    loadConfig();
    loadAiConfigs();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem('appGeneralConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const loadAiConfigs = async () => {
    setLoadingAiConfigs(true);
    try {
      const response = await aiService.getConfigs();
      if (response.success && response.data) {
        setAiConfigs(response.data);
      }
    } catch (error) {
      console.error('加载 AI 配置失败:', error);
    } finally {
      setLoadingAiConfigs(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await AsyncStorage.setItem('appGeneralConfig', JSON.stringify(config));
      await paymentNotificationService.saveMonitoringConfig(
        config.monitoredApps,
        config.filterKeywords
      );
      console.log('配置已保存');
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };

  // AI 配置相关操作
  const handleAddAiConfig = () => {
    setEditingAiConfig(null);
    setShowAiConfigModal(true);
  };

  const handleEditAiConfig = async (cfg: AIModelConfig) => {
    try {
      const response = await aiService.getConfig(cfg.id);
      if (response.success && response.data) {
        setEditingAiConfig(response.data);
      } else {
        setEditingAiConfig(cfg);
      }
    } catch {
      setEditingAiConfig(cfg);
    }
    setShowAiConfigModal(true);
  };

  const handleDeleteAiConfig = (cfg: AIModelConfig) => {
    confirm(
      '确认删除',
      `确定要删除配置 "${cfg.name}" 吗？`,
      async () => {
        try {
          await aiService.deleteConfig(cfg.id);
          loadAiConfigs();
        } catch (error) {
          alert('错误', '删除失败');
        }
      },
      undefined,
      { confirmText: '删除', destructive: true },
    );
  };

  const handleSaveAiConfig = async (data: CreateAIConfigDto | UpdateAIConfigDto) => {
    setSavingAiConfig(true);
    try {
      if (editingAiConfig) {
        await aiService.updateConfig(editingAiConfig.id, data);
      } else {
        await aiService.createConfig(data as CreateAIConfigDto);
      }
      setShowAiConfigModal(false);
      loadAiConfigs();
    } catch (error: any) {
      alert('错误', error.message || '保存失败');
    } finally {
      setSavingAiConfig(false);
    }
  };

  const handleTestAiConfig = async (cfg: AIModelConfig) => {
    setTestingConfigId(cfg.id);
    try {
      const response = await aiService.testConfig(cfg.id);
      if (response.success && response.data) {
        alert(
          response.data.success ? '连接成功' : '连接失败',
          response.data.message
        );
      }
    } catch (error: any) {
      alert('测试失败', error.message || '无法连接');
    } finally {
      setTestingConfigId(null);
    }
  };

  const handleSetDefaultAiConfig = async (cfg: AIModelConfig) => {
    try {
      await aiService.setDefaultConfig(cfg.id);
      loadAiConfigs();
    } catch (error) {
      alert('错误', '设置默认配置失败');
    }
  };

  // 监听应用相关操作
  const addMonitoredApp = () => {
    if (!newAppName.trim() || !newPackageName.trim()) {
      return;
    }
    const newApp: MonitoredApp = {
      id: Date.now().toString(),
      packageName: newPackageName.trim(),
      appName: newAppName.trim(),
      enabled: true,
    };
    const newConfig = { ...config, monitoredApps: [...config.monitoredApps, newApp] };
    setConfig(newConfig);
    setNewAppName('');
    setNewPackageName('');
    saveConfigToStorage(newConfig);
  };

  const removeMonitoredApp = (id: string) => {
    const newConfig = {
      ...config,
      monitoredApps: config.monitoredApps.filter((app) => app.id !== id),
    };
    setConfig(newConfig);
    saveConfigToStorage(newConfig);
  };

  const toggleAppEnabled = (id: string) => {
    const newConfig = {
      ...config,
      monitoredApps: config.monitoredApps.map((app) =>
        app.id === id ? { ...app, enabled: !app.enabled } : app
      ),
    };
    setConfig(newConfig);
    saveConfigToStorage(newConfig);
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) {
      return;
    }
    if (config.filterKeywords.includes(newKeyword.trim())) {
      return;
    }
    const newConfig = {
      ...config,
      filterKeywords: [...config.filterKeywords, newKeyword.trim()],
    };
    setConfig(newConfig);
    setNewKeyword('');
    saveConfigToStorage(newConfig);
  };

  const removeKeyword = (keyword: string) => {
    const newConfig = {
      ...config,
      filterKeywords: config.filterKeywords.filter((k) => k !== keyword),
    };
    setConfig(newConfig);
    saveConfigToStorage(newConfig);
  };

  const saveConfigToStorage = async (configToSave: AppConfig) => {
    try {
      await AsyncStorage.setItem('appGeneralConfig', JSON.stringify(configToSave));
      await paymentNotificationService.saveMonitoringConfig(
        configToSave.monitoredApps,
        configToSave.filterKeywords
      );
      console.log('配置已自动保存');
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };

  const openAppPicker = async () => {
    setLoadingApps(true);
    try {
      const apps = await paymentNotificationService.getInstalledApps();
      if (apps.length === 0) {
        alert('提示', '未获取到已安装应用，请确认已授予相关权限后重试');
        return;
      }
      setInstalledApps(apps.sort((a, b) => a.appName.localeCompare(b.appName)));
      setShowAppPicker(true);
    } catch (error) {
      console.error('获取已安装应用失败:', error);
      alert('提示', '获取已安装应用列表失败，请检查权限设置');
    } finally {
      setLoadingApps(false);
    }
  };

  const selectApp = (app: { packageName: string; appName: string }) => {
    setNewAppName(app.appName);
    setNewPackageName(app.packageName);
    setShowAppPicker(false);
    setSearchQuery('');
  };

  const filteredApps = installedApps.filter(
    (app) =>
      app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <PaymentNotificationSettings style={styles.card} />

        {/* AI 模型配置 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 AI 模型配置</Text>

          {loadingAiConfigs ? (
            <ActivityIndicator size="small" color={styles._colors.primary} />
          ) : aiConfigs.length === 0 ? (
            <Text style={styles.emptyText}>暂无配置，点击下方按钮添加</Text>
          ) : (
            aiConfigs.map((cfg) => (
              <View key={cfg.id} style={styles.aiConfigItem}>
                <View style={styles.aiConfigHeader}>
                  <View style={styles.aiConfigInfo}>
                    <View style={styles.aiConfigNameRow}>
                      <ProviderIcon provider={cfg.provider} size={18} />
                      <Text style={styles.aiConfigName}>
                        {cfg.name}
                        {cfg.isDefault && (
                          <Text style={styles.defaultBadge}> 默认</Text>
                        )}
                      </Text>
                    </View>
                    <Text style={styles.aiConfigModel}>{cfg.model}</Text>
                  </View>
                </View>
                <View style={styles.aiConfigActions}>
                  {!cfg.isDefault && (
                    <TouchableOpacity
                      style={styles.aiConfigActionBtn}
                      onPress={() => handleSetDefaultAiConfig(cfg)}
                    >
                      <Text style={[styles.aiConfigActionText, { color: styles._colors.primary }]}>
                        设为默认
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.aiConfigActionBtn}
                    onPress={() => handleTestAiConfig(cfg)}
                    disabled={testingConfigId === cfg.id}
                  >
                    {testingConfigId === cfg.id ? (
                      <ActivityIndicator size="small" color={styles._colors.primary} />
                    ) : (
                      <Text style={[styles.aiConfigActionText, { color: styles._colors.primary }]}>
                        测试
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.aiConfigActionBtn}
                    onPress={() => handleEditAiConfig(cfg)}
                  >
                    <Text style={[styles.aiConfigActionText, { color: styles._colors.primary }]}>
                      编辑
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.aiConfigActionBtn}
                    onPress={() => handleDeleteAiConfig(cfg)}
                  >
                    <Text style={[styles.aiConfigActionText, { color: styles._colors.error }]}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity style={styles.addAiConfigButton} onPress={handleAddAiConfig}>
            <Text style={styles.addAiConfigButtonText}>+ 添加模型配置</Text>
          </TouchableOpacity>
        </View>

        {/* 监听应用配置 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 监听应用配置</Text>

          {config.monitoredApps.map((app) => (
            <View key={app.id} style={styles.appItem}>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{app.appName}</Text>
                <Text style={styles.appPackage}>{app.packageName}</Text>
              </View>
              <View style={styles.appActions}>
                <Switch
                  value={app.enabled}
                  onValueChange={() => toggleAppEnabled(app.id)}
                  trackColor={{ false: styles._colors.divider, true: styles._colors.primary }}
                  thumbColor="#FFFFFF"
                />
                <TouchableOpacity
                  onPress={() => removeMonitoredApp(app.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>添加新的监听应用</Text>
            <TouchableOpacity
              onPress={openAppPicker}
              style={[styles.selectAppButton, loadingApps && styles.selectAppButtonDisabled]}
              disabled={loadingApps}
            >
              {loadingApps ? (
                <View style={styles.selectAppButtonContent}>
                  <ActivityIndicator size="small" color={styles._colors.stroke} />
                  <Text style={styles.selectAppButtonText}>正在获取应用列表...</Text>
                </View>
              ) : (
                <Text style={styles.selectAppButtonText}>从已安装应用选择</Text>
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={newAppName}
              onChangeText={setNewAppName}
              placeholder="应用名称（如：微信）"
              placeholderTextColor={styles._colors.textTertiary}
            />
            <TextInput
              style={[styles.input, styles.inputMargin]}
              value={newPackageName}
              onChangeText={setNewPackageName}
              placeholder="应用包名（如：com.tencent.mm）"
              placeholderTextColor={styles._colors.textTertiary}
            />
            <TouchableOpacity onPress={addMonitoredApp} style={styles.addButton}>
              <Text style={styles.addButtonIcon}>+</Text>
              <Text style={styles.addButtonText}>添加应用</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 过滤关键词配置 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 过滤关键词配置</Text>

          <View style={styles.keywordList}>
            {config.filterKeywords.map((keyword) => (
              <View key={keyword} style={styles.keywordTag}>
                <Text style={styles.keywordText}>{keyword}</Text>
                <TouchableOpacity
                  onPress={() => removeKeyword(keyword)}
                  style={styles.keywordDelete}
                >
                  <Text style={styles.keywordDeleteIcon}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.keywordForm}>
            <TextInput
              style={[styles.input, styles.keywordInput]}
              value={newKeyword}
              onChangeText={setNewKeyword}
              placeholder="输入关键词"
              placeholderTextColor={styles._colors.textTertiary}
              onSubmitEditing={addKeyword}
            />
            <TouchableOpacity onPress={addKeyword} style={styles.keywordAddButton}>
              <Text style={styles.keywordAddIcon}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleSaveConfig} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>保存配置</Text>
        </TouchableOpacity>

        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionTitle}>📋 配置说明</Text>
          <View style={styles.descriptionList}>
            <Text style={styles.descriptionItem}>• AI 模型配置：管理 AI 智能记账所需的模型</Text>
            <Text style={styles.descriptionItem}>• 监听应用：配置需要监听通知的应用包名</Text>
            <Text style={styles.descriptionItem}>• 过滤关键词：用于识别支付通知的关键词</Text>
          </View>
        </View>
      </ScrollView>

      {/* AI 配置弹窗 */}
      <AIConfigModal
        visible={showAiConfigModal}
        config={editingAiConfig}
        onClose={() => setShowAiConfigModal(false)}
        onSave={handleSaveAiConfig}
        isSaving={savingAiConfig}
        colors={styles._colors}
      />

      {/* 应用选择器 Modal */}
      <Modal
        visible={showAppPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAppPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择应用</Text>
              <TouchableOpacity
                onPress={() => setShowAppPicker(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseIcon}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="搜索应用名称或包名"
                placeholderTextColor={styles._colors.textTertiary}
              />
            </View>
            {filteredApps.length === 0 ? (
              <View style={styles.modalLoading}>
                <Text style={styles.modalLoadingText}>
                  {searchQuery ? '未找到匹配的应用' : '未找到已安装的应用'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredApps}
                keyExtractor={(item) => item.packageName}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.appPickerItem}
                    onPress={() => selectApp(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.appPickerInfo}>
                      <Text style={styles.appPickerName}>{item.appName}</Text>
                      <Text style={styles.appPickerPackage}>{item.packageName}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.appPickerList}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
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
    card: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      padding: spacing.lg,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    // AI Config styles
    aiConfigItem: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    aiConfigHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    aiConfigInfo: {
      flex: 1,
    },
    aiConfigNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    aiConfigName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    defaultBadge: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '800',
    },
    aiConfigModel: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Courier',
      color: colors.textSecondary,
      marginTop: 2,
    },
    aiConfigActions: {
      flexDirection: 'row',
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    aiConfigActionBtn: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.surface,
    },
    aiConfigActionText: {
      fontSize: 13,
      fontWeight: '700',
    },
    addAiConfigButton: {
      backgroundColor: colors.accent,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderRadius: borderRadius.button,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    addAiConfigButtonText: {
      fontSize: 15,
      color: colors.stroke,
      fontWeight: '800',
    },
    // Input styles
    input: {
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    inputMargin: {
      marginTop: spacing.sm,
    },
    // App item styles
    appItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    appInfo: {
      flex: 1,
    },
    appName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    appPackage: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Courier',
      color: colors.textSecondary,
      marginTop: 2,
    },
    appActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    deleteButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.error,
      backgroundColor: colors.error + '15',
    },
    deleteText: {
      fontSize: 13,
      color: colors.error,
      fontWeight: '700',
    },
    addForm: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
    },
    addFormTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    selectAppButton: {
      backgroundColor: colors.accent,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderRadius: borderRadius.button,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
    },
    selectAppButtonDisabled: {
      opacity: 0.7,
    },
    selectAppButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    selectAppButtonText: {
      fontSize: 15,
      color: colors.stroke,
      fontWeight: '700',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderRadius: borderRadius.button,
      backgroundColor: colors.surface,
      minHeight: 48,
    },
    addButtonIcon: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    // Keyword styles
    keywordList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    keywordTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    keywordText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
      marginRight: spacing.xs,
    },
    keywordDelete: {
      width: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keywordDeleteIcon: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
    },
    keywordForm: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    keywordInput: {
      flex: 1,
    },
    keywordAddButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderRadius: borderRadius.button,
      backgroundColor: colors.accent,
    },
    keywordAddIcon: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.stroke,
    },
    // Save button
    saveButton: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      ...shadow.small,
    },
    saveButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    // Description box
    descriptionBox: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    descriptionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    descriptionList: {
      gap: spacing.xs,
    },
    descriptionItem: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    // App picker modal
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.card,
      borderTopRightRadius: borderRadius.card,
      borderTopWidth: borderWidth.thick,
      borderLeftWidth: borderWidth.thick,
      borderRightWidth: borderWidth.thick,
      borderColor: colors.stroke,
      height: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: borderWidth.thin,
      borderBottomColor: colors.stroke,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalCloseButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.background,
    },
    modalCloseIcon: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    searchContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: borderWidth.thin,
      borderBottomColor: colors.stroke,
    },
    searchInput: {
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      borderRadius: borderRadius.input,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    modalLoading: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    modalLoadingText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    appPickerList: {
      flex: 1,
    },
    appPickerItem: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: borderWidth.thin,
      borderBottomColor: colors.stroke,
    },
    appPickerInfo: {
      flex: 1,
    },
    appPickerName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    appPickerPackage: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Courier',
      color: colors.textSecondary,
    },
  }),
  _colors: colors,
});
