/**
 * AI 助手聊天屏幕
 * 支持拍照/上传图片、语音、文本输入识别账单
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Image,
} from 'react-native';
import { Camera, Mic, Send, X, Check, Edit2, Trash2, Keyboard, Menu, SquarePen, ChevronLeft, Pin, ChevronDown, Plus } from 'lucide-react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import ImageViewing from 'react-native-image-viewing';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAlert } from '../../providers';
import { aiService } from '../../services/api/ai';
import { audioRecorderService } from '../../services/audio/audioRecorderService';
import type { RecordingProgress } from '../../services/audio/audioRecorderService';
import { billsService, categoriesService } from '../../services';
import { Skeleton, SkeletonCircle } from '../../components/skeleton/Skeleton';
import type { ParsedBill, AIModelConfig, ChatSession } from '../../types/ai';
import type { CategoryData } from '../../types/category';
import { ProviderIcon } from '../../components/icons';
import storage from '../../utils/storage';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.78;

// 会话分组类型
interface SessionGroup {
  title: string;
  data: ChatSession[];
}

// 账单数据类型（带临时 ID 用于编辑）
interface BillItem extends ParsedBill {
  id: string;
  categoryIcon?: string;
  categoryId?: number;
}

// 流式步骤类型
interface StreamStep {
  id: string;
  type: 'thinking' | 'tool_call';
  label: string;
  startTime: number;
  endTime?: number;
  isActive: boolean;
  thinkingContent?: string;
}

// 工具名称映射
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  create_bills: '记账',
  query_bills: '查询账单',
  delete_bills: '删除账单',
  get_statistics: '统计分析',
};

// 消息类型
interface Message {
  id: string;
  type: 'text' | 'bills' | 'bill_list' | 'statistics' | 'loading' | 'error' | 'streaming';
  content?: string;
  imageUrls?: string[];
  bills?: BillItem[];
  billListData?: any;
  statisticsData?: any;
  isUser: boolean;
  timestamp: Date;
  streamSteps?: StreamStep[];
  streamingText?: string;
  isStreamComplete?: boolean;
  totalThinkingMs?: number;
}

// 编辑账单弹窗
interface EditBillModalProps {
  visible: boolean;
  bill: BillItem | null;
  categories: CategoryData[];
  onClose: () => void;
  onSave: (bill: BillItem) => void;
  colors: ThemeColors;
}

function EditBillModal({
  visible,
  bill,
  categories,
  onClose,
  onSave,
  colors,
}: EditBillModalProps) {
  const { alert: showEditAlert } = useAlert();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();

  useEffect(() => {
    if (bill) {
      setAmount(bill.amount.toString());
      setDescription(bill.description);
      setDate(bill.date);
      setType(bill.type);
      setSelectedCategoryId(bill.categoryId);
    }
  }, [bill]);

  const handleSave = () => {
    if (!bill) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showEditAlert('提示', '请输入有效金额');
      return;
    }

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    onSave({
      ...bill,
      amount: parsedAmount,
      description,
      date,
      type,
      categoryId: selectedCategoryId,
      categoryName: selectedCategory?.name || bill.categoryName,
      categoryIcon: selectedCategory?.icon || bill.categoryIcon,
    });
  };

  const filteredCategories = categories.filter(c => c.type === type);

  const modalStyles = createEditModalStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.content}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>编辑账单</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false}>
            {/* 类型选择 */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>类型</Text>
              <View style={modalStyles.typeSelector}>
                <TouchableOpacity
                  style={[
                    modalStyles.typeButton,
                    type === 'expense' && modalStyles.typeButtonActive,
                  ]}
                  onPress={() => setType('expense')}
                >
                  <Text
                    style={[
                      modalStyles.typeButtonText,
                      type === 'expense' && modalStyles.typeButtonTextActive,
                    ]}
                  >
                    支出
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    modalStyles.typeButton,
                    type === 'income' && modalStyles.typeButtonActiveIncome,
                  ]}
                  onPress={() => setType('income')}
                >
                  <Text
                    style={[
                      modalStyles.typeButtonText,
                      type === 'income' && modalStyles.typeButtonTextActiveIncome,
                    ]}
                  >
                    收入
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 金额 */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>金额</Text>
              <TextInput
                style={modalStyles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* 分类 */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>分类</Text>
              <View style={modalStyles.categoryGrid}>
                {filteredCategories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      modalStyles.categoryItem,
                      selectedCategoryId === category.id && modalStyles.categoryItemActive,
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                  >
                    <Text style={modalStyles.categoryIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        modalStyles.categoryName,
                        selectedCategoryId === category.id && modalStyles.categoryNameActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 描述 */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>描述</Text>
              <TextInput
                style={modalStyles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="账单描述"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* 日期 */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>日期</Text>
              <TextInput
                style={modalStyles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
              <Text style={modalStyles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.saveButton} onPress={handleSave}>
              <Text style={modalStyles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createEditModalStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    content: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.large,
      borderTopRightRadius: borderRadius.large,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.xs,
    },
    body: {
      padding: spacing.lg,
    },
    field: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: borderRadius.medium,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    typeButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.medium,
      borderWidth: 1,
      borderColor: colors.divider,
      alignItems: 'center',
    },
    typeButtonActive: {
      backgroundColor: colors.expense + '1A',
      borderColor: colors.expense,
    },
    typeButtonActiveIncome: {
      backgroundColor: colors.income + '1A',
      borderColor: colors.income,
    },
    typeButtonText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    typeButtonTextActive: {
      color: colors.expense,
      fontWeight: '700',
    },
    typeButtonTextActiveIncome: {
      color: colors.income,
      fontWeight: '700',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    categoryItem: {
      width: '22%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.medium,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    categoryItemActive: {
      backgroundColor: colors.primary + '1A',
      borderColor: colors.primary,
    },
    categoryIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    categoryName: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    categoryNameActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.background,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.divider,
    },
    cancelButtonText: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    saveButton: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

// 账单卡片组件
interface BillCardProps {
  bill: BillItem;
  onEdit: (bill: BillItem) => void;
  onDelete: (id: string) => void;
  colors: ThemeColors;
}

function BillCard({ bill, onEdit, onDelete, colors }: BillCardProps) {
  const isExpense = bill.type === 'expense';

  return (
    <View style={billCardStyles.container}>
      <View
        style={[
          billCardStyles.card,
          { backgroundColor: isExpense ? '#FFF3E0' : '#E8F5E9' },
          { borderColor: isExpense ? '#FFCC80' : '#C8E6C9' },
        ]}
      >
        {/* 日期 */}
        <Text style={billCardStyles.date}>{bill.date}</Text>

        {/* 账单内容 */}
        <View style={billCardStyles.content}>
          <View
            style={[
              billCardStyles.categoryIcon,
              { backgroundColor: isExpense ? '#FFCC80' : '#C8E6C9' },
            ]}
          >
            <Text style={billCardStyles.categoryIconText}>
              {bill.categoryIcon || (isExpense ? '💰' : '💵')}
            </Text>
          </View>
          <View style={billCardStyles.info}>
            <Text style={billCardStyles.categoryName}>{bill.categoryName}</Text>
            <Text style={billCardStyles.description}>{bill.description}</Text>
          </View>
          <Text
            style={[
              billCardStyles.amount,
              isExpense ? billCardStyles.expenseAmount : billCardStyles.incomeAmount,
            ]}
          >
            {isExpense ? '-' : '+'}¥{bill.amount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={billCardStyles.actions}>
        <TouchableOpacity
          style={[billCardStyles.actionButton, { borderColor: colors.primary }]}
          onPress={() => onEdit(bill)}
        >
          <Edit2 size={14} color={colors.primary} />
          <Text style={[billCardStyles.actionButtonText, { color: colors.primary }]}>修改</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[billCardStyles.actionButton, billCardStyles.deleteButton]}
          onPress={() => onDelete(bill.id)}
        >
          <Trash2 size={14} color="#FF3B30" />
          <Text style={[billCardStyles.actionButtonText, billCardStyles.deleteButtonText]}>
            删除
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const billCardStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.large,
    padding: spacing.md,
    borderWidth: 1,
    ...shadow.medium,
  },
  date: {
    fontSize: 12,
    color: '#666666',
    marginBottom: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryIconText: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#666666',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
  },
  expenseAmount: {
    color: '#FF5722',
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  deleteButton: {
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
});

const toolCardStyles = StyleSheet.create({
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  billDate: {
    fontSize: 12,
    color: '#888888',
    width: 80,
  },
  billDesc: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    marginHorizontal: 8,
  },
  billAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    marginTop: spacing.sm,
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.medium,
    padding: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  statsLabel: {
    fontSize: 14,
    color: '#666666',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
});

// 流式步骤行组件
function StreamStepRow({ step, colors }: { step: StreamStep; colors: ThemeColors }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!step.isActive) {
      if (step.endTime) setElapsed(step.endTime - step.startTime);
      return;
    }
    const timer = setInterval(() => setElapsed(Date.now() - step.startTime), 100);
    return () => clearInterval(timer);
  }, [step.isActive, step.startTime, step.endTime]);

  const durationText = elapsed > 100 ? ` ${(elapsed / 1000).toFixed(1)}s` : '';

  return (
    <View>
      <View style={stepStyles.row}>
        {step.isActive ? (
          <View style={stepStyles.spinnerWrap}>
            <ActivityIndicator size="small" color={colors.primary} style={stepStyles.spinner} />
          </View>
        ) : (
          <View style={stepStyles.dotWrap}>
            <View style={[stepStyles.dot, { backgroundColor: colors.textTertiary }]} />
          </View>
        )}
        <Text style={[stepStyles.label, { color: step.isActive ? colors.textSecondary : colors.textTertiary }]}>
          {step.label}{durationText}
        </Text>
      </View>
      {!!step.thinkingContent && (
        <Text
          style={{
            marginLeft: 22,
            fontSize: 13,
            color: colors.textTertiary,
            lineHeight: 18,
            marginTop: 2,
            marginBottom: 4,
          }}
        >
          {step.thinkingContent}
        </Text>
      )}
    </View>
  );
}

// 流式步骤时间线组件
function StreamStepsTimeline({
  steps,
  isComplete,
  totalMs,
  colors,
}: {
  steps: StreamStep[];
  isComplete: boolean;
  totalMs?: number;
  colors: ThemeColors;
}) {
  const [expanded, setExpanded] = useState(false);

  if (steps.length === 0) return null;

  // 流式进行中：直接展示所有步骤
  if (!isComplete) {
    return (
      <View style={stepStyles.container}>
        {steps.map((step) => (
          <StreamStepRow key={step.id} step={step} colors={colors} />
        ))}
      </View>
    );
  }

  // 流式完成后：可折叠
  const seconds = Math.max(1, Math.round((totalMs || 0) / 1000));

  return (
    <View style={stepStyles.container}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={stepStyles.collapseHeader}
        activeOpacity={0.6}
      >
        <Text style={[stepStyles.collapseText, { color: colors.textTertiary }]}>
          已深度思考 (用时 {seconds}秒)
        </Text>
        <ChevronDown
          size={14}
          color={colors.textTertiary}
          style={{ marginLeft: 4, transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={stepStyles.expandedSteps}>
          {steps.map((step) => (
            <StreamStepRow key={step.id} step={step} colors={colors} />
          ))}
        </View>
      )}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  spinnerWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    transform: [{ scale: 0.6 }],
  },
  dotWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontSize: 13,
    marginLeft: 6,
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  collapseText: {
    fontSize: 13,
  },
  expandedSteps: {
    paddingTop: 4,
  },
});

// 聊天骨架屏组件
function ChatSkeleton() {
  return (
    <View style={chatSkeletonStyles.container}>
      {/* AI 消息骨架 */}
      <View style={chatSkeletonStyles.aiBubble}>
        <SkeletonCircle size={28} />
        <View style={chatSkeletonStyles.aiContent}>
          <Skeleton width="90%" height={14} />
          <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
          <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
        </View>
      </View>
      {/* 用户消息骨架 */}
      <View style={chatSkeletonStyles.userBubble}>
        <View style={chatSkeletonStyles.userContent}>
          <Skeleton width={120} height={14} />
        </View>
      </View>
      {/* AI 消息骨架 */}
      <View style={chatSkeletonStyles.aiBubble}>
        <SkeletonCircle size={28} />
        <View style={chatSkeletonStyles.aiContent}>
          <Skeleton width="80%" height={14} />
          <Skeleton width="60%" height={14} style={{ marginTop: 8 }} />
        </View>
      </View>
      {/* 用户消息骨架 */}
      <View style={chatSkeletonStyles.userBubble}>
        <View style={chatSkeletonStyles.userContent}>
          <Skeleton width={160} height={14} />
        </View>
      </View>
      {/* AI 消息骨架 */}
      <View style={chatSkeletonStyles.aiBubble}>
        <SkeletonCircle size={28} />
        <View style={chatSkeletonStyles.aiContent}>
          <Skeleton width="85%" height={14} />
          <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
          <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
}

const chatSkeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  aiBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  aiContent: {
    flex: 1,
    maxWidth: '75%',
    backgroundColor: 'transparent',
    borderRadius: borderRadius.large,
    padding: spacing.md,
  },
  userBubble: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  userContent: {
    padding: spacing.md,
  },
});

export default function AIChatScreen() {
  const styles = useStyles(createStyles);
  const { alert, confirm } = useAlert();
  const route = useRoute();
  const navigation = useNavigation();
  const routeSessionId = (route.params as any)?.sessionId as number | undefined;
  // 是否从会话列表导航过来（stack 模式）
  const isStackMode = routeSessionId !== undefined;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'text',
      content: '你好！我是你的 AI 助手，可以帮你：\n\n📝 记账 — "午餐花了35元"\n🔍 查账 — "今天记了什么"\n📊 统计 — "这个月花了多少"\n🗑️ 删除 — "删掉刚才那条"\n💬 闲聊 — 随便聊什么都行\n\n试着发送一条消息吧！',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [editingBill, setEditingBill] = useState<BillItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingBills, setPendingBills] = useState<BillItem[]>([]);
  const [savingBills, setSavingBills] = useState(false);
  const [defaultAIConfig, setDefaultAIConfig] = useState<AIModelConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionRestoring, setSessionRestoring] = useState(true);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string>('');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // 流式连接引用（用于取消）
  const streamRef = useRef<{ close: () => void } | null>(null);

  // 组件卸载时关闭流式连接
  useEffect(() => {
    return () => {
      streamRef.current?.close();
    };
  }, []);

  // 语音模式状态
  const [isVoiceMode, setIsVoiceMode] = useState(false); // 是否处于语音输入模式
  const [isRecording, setIsRecording] = useState(false); // 是否正在录音
  const [willCancel, setWillCancel] = useState(false); // 是否将要取消（上滑）

  // 侧边栏状态
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renamingSession, setRenamingSession] = useState<ChatSession | null>(null);
  const [renameText, setRenameText] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    session: ChatSession;
    pageY: number;
  } | null>(null);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // 用于 PanResponder 的 ref（避免闭包问题）
  const willCancelRef = useRef(false);
  // 防止 onPanResponderRelease 和 onPanResponderTerminate 双触发
  const gestureHandledRef = useRef(false);

  // 声波动画
  const waveAnims = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.3))
  ).current;
  const waveAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // 取消阈值（上滑距离）
  const CANCEL_THRESHOLD = 80;

  // 启动声波动画
  const startWaveAnimation = () => {
    const animations = waveAnims.map((anim) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 100 + Math.random() * 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 100 + Math.random() * 200,
            useNativeDriver: true,
          }),
        ])
      );
    });
    waveAnimationRef.current = Animated.parallel(animations);
    waveAnimationRef.current.start();
  };

  // 停止声波动画
  const stopWaveAnimation = () => {
    if (waveAnimationRef.current) {
      waveAnimationRef.current.stop();
    }
    waveAnims.forEach(anim => anim.setValue(0.3));
  };

  // 开始录音
  const startRecording = async () => {
    try {
      // 先设置 UI 状态，避免松手时 UI 还没反应
      setIsRecording(true);

      await audioRecorderService.startRecording((progress: RecordingProgress) => {
        // 用实际音量驱动波形动画
        const metering = progress.currentMetering ?? 0.3;
        waveAnims.forEach((anim) => {
          // 给每根波形条加些随机偏移，看起来更自然
          const variation = 0.3 + metering * (0.5 + Math.random() * 0.5);
          anim.setValue(Math.min(1, variation));
        });
      });
    } catch (err: any) {
      setIsRecording(false);
      console.error('[Voice] 录音失败:', err);
      alert('录音失败', err.message || '无法开始录音');
    }
  };

  // 停止录音并发送
  const stopRecordingAndSend = async () => {
    setIsRecording(false);
    stopWaveAnimation();

    // 松开瞬间立刻在聊天区显示"语音识别中"，给用户即时反馈
    const transcribingMsgId = addMessage({
      type: 'streaming',
      isUser: false,
      streamSteps: [{
        id: 'voice-transcribe',
        type: 'thinking',
        label: '语音识别中',
        startTime: Date.now(),
        isActive: true,
      }],
      streamingText: '',
      isStreamComplete: false,
    });

    const removeTranscribingMsg = () => {
      setMessages(prev => prev.filter(m => m.id !== transcribingMsgId));
    };

    try {
      const result = await audioRecorderService.stopRecording();
      if (!result || result.duration < 0.5) {
        removeTranscribingMsg();
        if (result) {
          audioRecorderService.deleteRecordingFile();
        }
        return;
      }

      // 调用 ASR 转写
      const response = await aiService.transcribeAudio(result.base64, result.mimeType);

      // 移除识别状态消息
      removeTranscribingMsg();

      if (response.data?.text) {
        // 转写成功，直接发送给 AI
        handleSend(response.data.text);
      } else {
        alert('识别失败', '未能识别语音内容，请重试');
      }

      // 清理临时文件
      audioRecorderService.deleteRecordingFile();
    } catch (err: any) {
      removeTranscribingMsg();
      console.error('[Voice] 语音处理失败:', err);
      alert('语音识别失败', err.message || '请检查网络后重试');
    }
  };

  // 取消录音
  const cancelRecording = async () => {
    setIsRecording(false);
    setWillCancel(false);
    willCancelRef.current = false;
    stopWaveAnimation();
    try {
      await audioRecorderService.cancelRecording();
    } catch (err) {
      console.error('[Voice] 取消录音失败:', err);
    }
  };

  // 开始新对话（重置状态）
  const handleNewChat = () => {
    const isFresh = sessionId === null && messages.length === 1 && messages[0].id === 'welcome';
    if (isFresh) {
      alert('提示', '当前已经是新对话了');
      return;
    }
    setSessionId(null);
    storage.removeItem(LAST_SESSION_ID_KEY);
    setPendingBills([]);
    setMessages([
      {
        id: 'welcome',
        type: 'text',
        content: '你好！我是你的 AI 助手，可以帮你：\n\n📝 记账 — "午餐花了35元"\n🔍 查账 — "今天记了什么"\n📊 统计 — "这个月花了多少"\n🗑️ 删除 — "删掉刚才那条"\n💬 闲聊 — 随便聊什么都行\n\n试着发送一条消息吧！',
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    closeSidebar();
  };

  // 侧边栏：打开
  const openSidebar = () => {
    setSidebarVisible(true);
    loadSessions();
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 侧边栏：关闭
  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSidebarVisible(false);
    });
  };

  // 加载会话列表
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await aiService.getChatSessions({ limit: 50 });
      if (response.success && response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  // 按日期分组会话（置顶优先）
  const groupSessionsByDate = (list: ChatSession[]): SessionGroup[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);

    const pinned: ChatSession[] = [];
    const dateGroups: Record<string, ChatSession[]> = {
      '今天': [],
      '昨天': [],
      '7天内': [],
      '更早': [],
    };

    for (const s of list) {
      if (s.isPinned) {
        pinned.push(s);
        continue;
      }
      const d = new Date(s.updatedAt);
      if (d >= today) {
        dateGroups['今天'].push(s);
      } else if (d >= yesterday) {
        dateGroups['昨天'].push(s);
      } else if (d >= sevenDaysAgo) {
        dateGroups['7天内'].push(s);
      } else {
        dateGroups['更早'].push(s);
      }
    }

    const result: SessionGroup[] = [];
    if (pinned.length > 0) {
      result.push({ title: '置顶', data: pinned });
    }
    for (const [title, data] of Object.entries(dateGroups)) {
      if (data.length > 0) {
        result.push({ title, data });
      }
    }
    return result;
  };

  // 选择会话
  const handleSelectSession = (sid: number) => {
    closeSidebar();
    if (sid === sessionId) return;
    loadSessionHistory(sid);
  };

  // 长按会话 — 显示上下文菜单
  const handleSessionLongPress = (session: ChatSession, event: any) => {
    const { pageY } = event.nativeEvent;
    setContextMenu({ session, pageY });
  };

  // 上下文菜单：重命名
  const handleActionRename = () => {
    if (!contextMenu) return;
    setRenamingSession(contextMenu.session);
    setRenameText(contextMenu.session.title || '');
    setContextMenu(null);
    setRenameModalVisible(true);
  };

  // 上下文菜单：置顶/取消置顶
  const handleActionTogglePin = async () => {
    if (!contextMenu) return;
    const sid = contextMenu.session.id;
    setContextMenu(null);
    try {
      const response = await aiService.togglePinChatSession(sid);
      if (response.success && response.data) {
        setSessions(prev =>
          prev.map(s => (s.id === sid ? { ...s, isPinned: response.data!.isPinned } : s)),
        );
      }
    } catch (error) {
      alert('错误', '操作失败，请重试');
    }
  };

  // 上下文菜单：删除
  const handleActionDelete = () => {
    if (!contextMenu) return;
    const sid = contextMenu.session.id;
    setContextMenu(null);
    handleDeleteSession(sid);
  };

  // 删除会话
  const handleDeleteSession = async (sid: number) => {
    try {
      await aiService.deleteChatSession(sid);
      setSessions(prev => prev.filter(s => s.id !== sid));
      // 如果删除的是当前会话，重置为新对话
      if (sid === sessionId) {
        handleNewChat();
      }
    } catch (error) {
      alert('错误', '删除失败，请重试');
    }
  };

  // 确认重命名
  const handleRenameConfirm = async () => {
    if (!renamingSession || !renameText.trim()) return;
    try {
      await aiService.renameChatSession(renamingSession.id, renameText.trim());
      setSessions(prev =>
        prev.map(s => (s.id === renamingSession.id ? { ...s, title: renameText.trim() } : s)),
      );
      setRenameModalVisible(false);
      setRenamingSession(null);
    } catch (error) {
      alert('错误', '重命名失败，请重试');
    }
  };

  // 返回上一页（stack 模式）
  const handleGoBack = () => {
    navigation.goBack();
  };

  // 按住说话的手势处理
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        console.log('[Gesture] 按下');
        willCancelRef.current = false;
        gestureHandledRef.current = false;
        startRecording().catch(() => {});
      },
      onPanResponderMove: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // 检测上滑距离
        if (gestureState.dy < -CANCEL_THRESHOLD) {
          if (!willCancelRef.current) {
            console.log('[Gesture] 上滑超过阈值，准备取消');
            willCancelRef.current = true;
            setWillCancel(true);
          }
        } else {
          if (willCancelRef.current) {
            willCancelRef.current = false;
            setWillCancel(false);
          }
        }
      },
      onPanResponderRelease: () => {
        if (gestureHandledRef.current) return;
        gestureHandledRef.current = true;
        console.log('[Gesture] 松开, willCancel:', willCancelRef.current);
        if (willCancelRef.current) {
          cancelRecording().catch(() => {});
        } else {
          stopRecordingAndSend().catch(() => {});
        }
        willCancelRef.current = false;
      },
      onPanResponderTerminate: () => {
        if (gestureHandledRef.current) return;
        gestureHandledRef.current = true;
        console.log('[Gesture] 手势终止');
        willCancelRef.current = false;
        cancelRecording().catch(() => {});
      },
    })
  ).current;

  // 切换语音/文字模式
  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
  };

  const AI_CONFIG_CACHE_KEY = 'ai_default_config';
  const LAST_SESSION_ID_KEY = 'ai_last_session_id';

  // sessionId 变化时持久化到 storage
  useEffect(() => {
    if (sessionId !== null) {
      storage.setItem(LAST_SESSION_ID_KEY, sessionId);
    }
  }, [sessionId]);

  // 加载分类和默认AI配置
  useEffect(() => {
    loadCategories();
    loadDefaultAIConfigWithCache();
    if (routeSessionId) {
      // 从会话列表导航过来，加载指定会话
      loadSessionHistory(routeSessionId).finally(() => setSessionRestoring(false));
    } else {
      // 普通进入：恢复上次会话
      restoreLastSession();
    }
  }, []);

  // 恢复上次会话
  const restoreLastSession = async () => {
    try {
      const lastSid = await storage.getItem<number>(LAST_SESSION_ID_KEY);
      if (lastSid) {
        await loadSessionHistory(lastSid);
      }
    } catch (error) {
      console.error('恢复上次会话失败:', error);
    } finally {
      setSessionRestoring(false);
    }
  };

  // 加载历史会话消息
  const loadSessionHistory = async (sid: number) => {
    try {
      const response = await aiService.getChatSession(sid);
      if (response.success && response.data) {
        setSessionId(sid);
        const { messages: dbMessages } = response.data;
        const displayMessages: Message[] = [];
        for (const msg of dbMessages) {
          if (msg.role === 'user') {
            let imageUrls: string[] | undefined;
            if (msg.imageUrl) {
              try {
                const parsed = JSON.parse(msg.imageUrl);
                imageUrls = Array.isArray(parsed) ? parsed : [msg.imageUrl];
              } catch {
                imageUrls = [msg.imageUrl];
              }
            }
            displayMessages.push({
              id: `db-${msg.id}`,
              type: 'text',
              content: msg.imageUrl ? (msg.content || '') : (msg.content || ''),
              imageUrls,
              isUser: true,
              timestamp: new Date(msg.createdAt),
            });
          } else if (msg.role === 'assistant') {
            if (msg.content) {
              displayMessages.push({
                id: `db-${msg.id}`,
                type: 'text',
                content: msg.content,
                isUser: false,
                timestamp: new Date(msg.createdAt),
              });
            }
          }
          // tool messages are represented by their results in assistant responses
        }
        if (displayMessages.length > 0) {
          setMessages(displayMessages);
        }
      }
    } catch (error) {
      console.error('加载会话历史失败:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  // SWR 模式：先读缓存立即显示，再请求接口静默更新
  const loadDefaultAIConfigWithCache = async () => {
    // 1. 先从缓存读取，立即展示（避免闪烁）
    try {
      const cached = await storage.getItem<AIModelConfig>(AI_CONFIG_CACHE_KEY);
      if (cached) {
        setDefaultAIConfig(cached);
        setConfigLoaded(true);
      }
    } catch (error) {
      console.error('读取AI配置缓存失败:', error);
    }

    // 2. 后台请求最新数据（revalidate）
    try {
      const response = await aiService.getConfigs();
      if (response.success && response.data) {
        const latestConfig = response.data.find(c => c.isDefault) || response.data[0];
        if (latestConfig) {
          setDefaultAIConfig(latestConfig);
          // 更新缓存
          await storage.setItem(AI_CONFIG_CACHE_KEY, latestConfig);
        }
      }
    } catch (error) {
      console.error('加载AI配置失败:', error);
    } finally {
      setConfigLoaded(true);
    }
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const handleSend = (overrideText?: string) => {
    const text = (overrideText || inputText).trim();
    const images = [...pendingImages];
    if ((!text && images.length === 0) || isLoading) return;

    if (!overrideText) {
      setInputText('');
    }
    setPendingImages([]);

    // 添加用户消息
    addMessage({
      type: 'text',
      content: text || undefined,
      imageUrls: images.length > 0 ? images : undefined,
      isUser: true,
    });

    // 添加流式消息（直接带初始思考步骤，消除"连接中..."）
    const streamStartTime = Date.now();
    const initialStep: StreamStep = {
      id: 'think-1',
      type: 'thinking',
      label: '思考中',
      startTime: streamStartTime,
      isActive: true,
    };
    const streamMsgId = addMessage({
      type: 'streaming',
      isUser: false,
      streamSteps: [initialStep],
      streamingText: '',
      isStreamComplete: false,
    });

    setIsLoading(true);

    let accumulatedText = '';
    let firstTextDelta = true;
    let currentSteps: StreamStep[] = [initialStep];

    const finishActiveSteps = () => {
      currentSteps = currentSteps.map(s =>
        s.isActive ? { ...s, isActive: false, endTime: Date.now() } : s,
      );
    };

    // 在流式消息前面插入工具结果消息
    const insertBeforeStream = (message: Omit<Message, 'id' | 'timestamp'>) => {
      const newMessage: Message = {
        ...message,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      };
      setMessages(prev => {
        const streamIdx = prev.findIndex(m => m.id === streamMsgId);
        if (streamIdx === -1) {
          return [...prev, newMessage];
        }
        const updated = [...prev];
        updated.splice(streamIdx, 0, newMessage);
        return updated;
      });
    };

    const stream = aiService.streamMessage(
      {
        content: text || '请描述这张图片',
        sessionId: sessionId || undefined,
        imageBase64List: images.length > 0 ? images : undefined,
      },
      {
        onSessionCreated: (data) => {
          if (!sessionId) {
            setSessionId(data.sessionId);
          }
        },
        onThinking: (data) => {
          // 第 1 轮已在创建消息时初始化，只处理后续轮次
          if (data.round <= 1) return;
          finishActiveSteps();
          const step: StreamStep = {
            id: `think-${data.round}`,
            type: 'thinking',
            label: '思考中',
            startTime: Date.now(),
            isActive: true,
          };
          currentSteps = [...currentSteps, step];
          updateMessage(streamMsgId, { streamSteps: [...currentSteps] });
        },
        onThinkingDelta: (data) => {
          // 将思维链内容追加到当前活跃的 thinking 步骤
          const activeIdx = currentSteps.findIndex(s => s.type === 'thinking' && s.isActive);
          if (activeIdx !== -1) {
            const step = currentSteps[activeIdx];
            currentSteps = currentSteps.map((s, i) =>
              i === activeIdx
                ? { ...s, thinkingContent: (s.thinkingContent || '') + data.content }
                : s,
            );
            updateMessage(streamMsgId, { streamSteps: [...currentSteps] });
          }
        },
        onTextDelta: (data) => {
          if (firstTextDelta) {
            finishActiveSteps();
            firstTextDelta = false;
          }
          accumulatedText += data.content;
          updateMessage(streamMsgId, {
            streamSteps: [...currentSteps],
            streamingText: accumulatedText,
          });
        },
        onToolCallStart: (data) => {
          finishActiveSteps();
          const displayName = TOOL_DISPLAY_NAMES[data.toolName] || data.toolName;
          const step: StreamStep = {
            id: `tool-${data.toolCallId}`,
            type: 'tool_call',
            label: `调用 ${displayName}`,
            startTime: Date.now(),
            isActive: true,
          };
          currentSteps = [...currentSteps, step];
          updateMessage(streamMsgId, { streamSteps: [...currentSteps] });
        },
        onToolResult: (data) => {
          finishActiveSteps();
          updateMessage(streamMsgId, { streamSteps: [...currentSteps] });

          // 重置文本累积（工具结果后 AI 会继续回复）
          accumulatedText = '';
          firstTextDelta = true;

          // 根据工具类型添加对应消息（插入到流式消息前面）
          if (data.toolName === 'create_bills' && data.result.success) {
            const bills = (data.result.data?.bills || []) as any[];
            const billsWithIds: BillItem[] = bills.map((bill: any, index: number) => ({
              amount: bill.amount,
              type: bill.type,
              description: bill.description || '',
              categoryName: bill.categoryName || '',
              date: bill.date || new Date().toISOString().split('T')[0],
              id: `${Date.now()}-${index}`,
              categoryIcon: bill.categoryIcon || getCategoryIcon(bill.categoryName),
              categoryId: bill.categoryId || getCategoryId(bill.categoryName, bill.type),
            }));

            setPendingBills(prev => [...prev, ...billsWithIds]);
            insertBeforeStream({
              type: 'bills',
              bills: billsWithIds,
              content: data.result.message,
              isUser: false,
            });
          } else if (data.toolName === 'query_bills' && data.result.success) {
            insertBeforeStream({
              type: 'bill_list',
              billListData: data.result.data,
              content: data.result.message,
              isUser: false,
            });
          } else if (data.toolName === 'get_statistics' && data.result.success) {
            insertBeforeStream({
              type: 'statistics',
              statisticsData: data.result.data,
              content: data.result.message,
              isUser: false,
            });
          } else if (data.toolName === 'delete_bills') {
            insertBeforeStream({
              type: 'text',
              content: data.result.message,
              isUser: false,
            });
          } else if (!data.result.success) {
            insertBeforeStream({
              type: 'error',
              content: data.result.message,
              isUser: false,
            });
          }
        },
        onDone: (data) => {
          finishActiveSteps();
          const totalMs = data.thinkingTimeMs || (Date.now() - streamStartTime);

          if (!accumulatedText && currentSteps.length === 0) {
            setMessages(prev => prev.filter(m => m.id !== streamMsgId));
          } else {
            updateMessage(streamMsgId, {
              streamSteps: [...currentSteps],
              streamingText: accumulatedText || undefined,
              isStreamComplete: true,
              totalThinkingMs: totalMs,
            });
          }

          setIsLoading(false);
          streamRef.current = null;
        },
        onError: (data) => {
          updateMessage(streamMsgId, {
            type: 'error',
            content: data.message || '请求失败',
            streamSteps: undefined,
            streamingText: undefined,
          });
          setIsLoading(false);
          streamRef.current = null;
        },
      },
    );

    streamRef.current = stream;
  };

  const handleImagePress = () => {
    alert('选择图片来源', '', [
      {
        text: '拍照',
        onPress: () => pickImage('camera'),
      },
      {
        text: '从相册选择',
        onPress: () => pickImage('library'),
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      includeBase64: true,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    const callback = (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.base64) {
        alert('错误', '无法读取图片');
        return;
      }
      const base64Data = `data:image/jpeg;base64,${asset.base64}`;
      setPendingImages(prev => [...prev, base64Data]);
    };

    if (source === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: Record<string, string> = {
      餐饮: '🍽️',
      交通: '🚗',
      购物: '🛍️',
      居住: '🏠',
      娱乐: '🎮',
      医疗: '💊',
      教育: '📚',
      工资: '💵',
      理财: '📈',
      其他: '📦',
    };
    return iconMap[categoryName] || '📦';
  };

  const getCategoryId = (categoryName: string, type: 'income' | 'expense'): number | undefined => {
    const category = categories.find(c => c.name === categoryName && c.type === type);
    return category?.id;
  };

  const handleEditBill = (bill: BillItem) => {
    setEditingBill(bill);
    setShowEditModal(true);
  };

  const handleSaveBill = (updatedBill: BillItem) => {
    setPendingBills(prev => prev.map(b => (b.id === updatedBill.id ? updatedBill : b)));
    setMessages(prev =>
      prev.map(m => {
        if (m.bills) {
          return {
            ...m,
            bills: m.bills.map(b => (b.id === updatedBill.id ? updatedBill : b)),
          };
        }
        return m;
      })
    );
    setShowEditModal(false);
    setEditingBill(null);
  };

  const handleDeleteBill = (id: string) => {
    confirm(
      '确认删除',
      '确定要删除这条账单吗？',
      () => {
        setPendingBills(prev => prev.filter(b => b.id !== id));
        setMessages(prev =>
          prev.map(m => {
            if (m.bills) {
              const newBills = m.bills.filter(b => b.id !== id);
              if (newBills.length === 0) {
                return { ...m, type: 'text' as const, content: '所有账单已删除', bills: undefined };
              }
              return { ...m, bills: newBills };
            }
            return m;
          })
        );
      },
      undefined,
      { confirmText: '删除', destructive: true },
    );
  };

  const handleSaveAllBills = async () => {
    if (pendingBills.length === 0) {
      alert('提示', '没有待保存的账单');
      return;
    }

    setSavingBills(true);
    let successCount = 0;
    let failCount = 0;

    for (const bill of pendingBills) {
      try {
        await billsService.createBill({
          amount: bill.amount,
          type: bill.type,
          description: bill.description,
          date: bill.date,
          categoryId: bill.categoryId,
        });
        successCount++;
      } catch (error) {
        failCount++;
        console.error('保存账单失败:', error);
      }
    }

    setSavingBills(false);

    if (failCount === 0) {
      alert('保存成功', `已成功保存 ${successCount} 条账单`);
      setPendingBills([]);
      // 添加成功消息
      addMessage({
        type: 'text',
        content: `✅ 已成功保存 ${successCount} 条账单到账本`,
        isUser: false,
      });
    } else {
      alert('保存完成', `成功 ${successCount} 条，失败 ${failCount} 条`);
    }
  };

  // 渲染 AI 头像
  const renderAIAvatar = () => {
    if (defaultAIConfig?.provider) {
      return (
        <View style={styles.aiAvatarContainer}>
          <ProviderIcon provider={defaultAIConfig.provider} size={24} />
        </View>
      );
    }
    // 配置未加载完成时显示占位圆形，避免从🤖闪烁到供应商图标
    if (!configLoaded) {
      return <View style={styles.aiAvatarPlaceholder} />;
    }
    return <Text style={styles.aiAvatar}>🤖</Text>;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === 'loading') {
      return (
        <View style={[styles.messageBubble, styles.aiBubble]}>
          {renderAIAvatar()}
          <View style={[styles.messageContent, styles.aiContent]}>
            <ActivityIndicator size="small" color={styles._colors.primary} />
            <Text style={styles.loadingText}>思考中...</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'streaming') {
      const hasText = !!item.streamingText;
      const hasSteps = (item.streamSteps || []).length > 0;
      return (
        <View style={[styles.messageBubble, styles.aiBubble]}>
          {renderAIAvatar()}
          <View style={[styles.messageContent, styles.aiContent]}>
            {hasSteps && (
              <StreamStepsTimeline
                steps={item.streamSteps!}
                isComplete={item.isStreamComplete || false}
                totalMs={item.totalThinkingMs}
                colors={styles._colors}
              />
            )}
            {hasText && (
              <Text style={styles.messageText}>{item.streamingText}</Text>
            )}
            {!hasText && !hasSteps && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={styles._colors.primary} />
                <Text style={{ fontSize: 14, color: styles._colors.textSecondary }}>连接中...</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    if (item.type === 'bills' && item.bills && item.bills.length > 0) {
      return (
        <View style={styles.billsContainer}>
          <View style={[styles.messageBubble, styles.aiBubble]}>
            {renderAIAvatar()}
            <View style={[styles.messageContent, styles.aiContent]}>
              <Text style={styles.messageText}>{item.content}</Text>
            </View>
          </View>
          {item.bills.map(bill => (
            <BillCard
              key={bill.id}
              bill={bill}
              onEdit={handleEditBill}
              onDelete={handleDeleteBill}
              colors={styles._colors}
            />
          ))}
        </View>
      );
    }

    if (item.type === 'bill_list' && item.billListData) {
      const bills = item.billListData?.data || [];
      return (
        <View style={styles.billsContainer}>
          <View style={[styles.messageBubble, styles.aiBubble]}>
            {renderAIAvatar()}
            <View style={[styles.messageContent, styles.aiContent]}>
              <Text style={styles.messageText}>{item.content}</Text>
              {bills.length > 0 ? (
                <View style={{ marginTop: spacing.sm }}>
                  {bills.map((bill: any) => (
                    <View key={bill.id} style={toolCardStyles.billRow}>
                      <Text style={toolCardStyles.billDate}>{bill.date?.substring(0, 10)}</Text>
                      <Text style={toolCardStyles.billDesc} numberOfLines={1}>{bill.description || '-'}</Text>
                      <Text style={[
                        toolCardStyles.billAmount,
                        { color: bill.type === 'expense' ? '#FF5722' : '#4CAF50' },
                      ]}>
                        {bill.type === 'expense' ? '-' : '+'}¥{Number(bill.amount).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.messageText, { marginTop: spacing.xs }]}>暂无账单记录</Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    if (item.type === 'statistics' && item.statisticsData) {
      const stats = item.statisticsData;
      return (
        <View style={styles.billsContainer}>
          <View style={[styles.messageBubble, styles.aiBubble]}>
            {renderAIAvatar()}
            <View style={[styles.messageContent, styles.aiContent]}>
              <Text style={styles.messageText}>{item.content}</Text>
              <View style={toolCardStyles.statsContainer}>
                <View style={toolCardStyles.statsRow}>
                  <Text style={toolCardStyles.statsLabel}>总支出</Text>
                  <Text style={[toolCardStyles.statsValue, { color: '#FF5722' }]}>
                    ¥{Number(stats.totalExpense || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={toolCardStyles.statsRow}>
                  <Text style={toolCardStyles.statsLabel}>总收入</Text>
                  <Text style={[toolCardStyles.statsValue, { color: '#4CAF50' }]}>
                    ¥{Number(stats.totalIncome || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={[toolCardStyles.statsRow, { borderBottomWidth: 0 }]}>
                  <Text style={toolCardStyles.statsLabel}>结余</Text>
                  <Text style={[toolCardStyles.statsValue, { fontWeight: '700' }]}>
                    ¥{(Number(stats.totalIncome || 0) - Number(stats.totalExpense || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (item.type === 'error') {
      return (
        <View style={[styles.messageBubble, styles.aiBubble]}>
          {renderAIAvatar()}
          <View style={[styles.messageContent, styles.errorContent]}>
            <Text style={styles.errorText}>❌ {item.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.aiBubble]}
      >
        {!item.isUser && renderAIAvatar()}
        <View
          style={[
            styles.messageContent,
            item.isUser ? styles.userContent : styles.aiContent,
          ]}
        >
          {item.imageUrls && item.imageUrls.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chatImageList}>
              {item.imageUrls.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => {
                    setImageViewerUrl(uri);
                    setImageViewerVisible(true);
                  }}
                >
                  <Image
                    source={{ uri }}
                    style={[styles.chatImage, idx > 0 && { marginLeft: spacing.xs }]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {item.content && (
            <Text style={[styles.messageText, item.isUser && styles.userText]}>
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* 顶部导航栏 */}
      <View style={styles.chatHeader}>
        {isStackMode ? (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={styles._colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={openSidebar}
            activeOpacity={0.7}
          >
            <Menu size={22} color={styles._colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>AI 助手</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleNewChat}
          activeOpacity={0.7}
        >
          <SquarePen size={20} color={styles._colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 消息列表 */}
      {sessionRestoring ? (
        <ChatSkeleton />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      {/* 待保存账单提示 */}
      {pendingBills.length > 0 && (
        <View style={styles.pendingBar}>
          <Text style={styles.pendingText}>
            {pendingBills.length} 条账单待保存
          </Text>
          <TouchableOpacity
            style={styles.saveAllButton}
            onPress={handleSaveAllBills}
            disabled={savingBills}
          >
            {savingBills ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.saveAllButtonText}>全部保存</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 语音录音中的提示和声波 */}
      {isRecording && (
        <View style={styles.recordingOverlay}>
          <Text style={[styles.recordingHint, willCancel && styles.recordingHintCancel]}>
            {willCancel ? '松开取消' : '松开发送  上移取消'}
          </Text>
          <View style={styles.waveContainer}>
            {waveAnims.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  willCancel && styles.waveBarCancel,
                  { transform: [{ scaleY: anim }] },
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* 待发送图片预览栏 */}
      {pendingImages.length > 0 && (
        <View style={styles.pendingImagesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pendingImagesScroll}>
            {pendingImages.map((uri, index) => (
              <View key={index} style={styles.pendingImageWrapper}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setImageViewerUrl(uri);
                    setImageViewerVisible(true);
                  }}
                >
                  <Image
                    source={{ uri }}
                    style={styles.pendingImageThumb}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pendingImageRemove}
                  onPress={() => setPendingImages(prev => prev.filter((_, i) => i !== index))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color="#FFFFFF" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.pendingImageAdd}
              onPress={handleImagePress}
              activeOpacity={0.7}
            >
              <Plus size={24} color={styles._colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        {/* 图片上传按钮 */}
        <TouchableOpacity
          style={[styles.mediaButton, isRecording && styles.buttonDisabled]}
          onPress={handleImagePress}
          activeOpacity={0.7}
          disabled={isLoading || isRecording}
        >
          <Camera size={24} color={styles._colors.primary} strokeWidth={2} />
        </TouchableOpacity>

        {/* 语音模式：按住说话按钮 */}
        {isVoiceMode ? (
          <View
            style={[
              styles.voiceInputWrapper,
              isRecording && styles.voiceInputWrapperActive,
              willCancel && styles.voiceInputWrapperCancel,
            ]}
            {...panResponder.panHandlers}
          >
            <Text style={[
              styles.voiceInputText,
              isRecording && styles.voiceInputTextActive,
            ]}>
              {isRecording ? (willCancel ? '松开取消' : '松开发送') : '按住说话'}
            </Text>
          </View>
        ) : (
          /* 文字模式：文本输入框 */
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="点击输入文字"
              placeholderTextColor={styles._colors.textTertiary}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
          </View>
        )}

        {/* 右侧按钮：发送/语音切换 */}
        {!isVoiceMode && (inputText.trim() || pendingImages.length > 0) ? (
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.buttonDisabled]}
            onPress={() => handleSend()}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Send size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.modeButton, isRecording && styles.buttonDisabled]}
            onPress={toggleVoiceMode}
            activeOpacity={0.7}
            disabled={isRecording}
          >
            {isVoiceMode ? (
              <Keyboard size={22} color={styles._colors.textSecondary} strokeWidth={2} />
            ) : (
              <Mic size={22} color={styles._colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 编辑账单弹窗 */}
      <EditBillModal
        visible={showEditModal}
        bill={editingBill}
        categories={categories}
        onClose={() => {
          setShowEditModal(false);
          setEditingBill(null);
        }}
        onSave={handleSaveBill}
        colors={styles._colors}
      />

      {/* 侧边栏抽屉 */}
      {sidebarVisible && (
        <View style={sidebarStyles.overlay}>
          <Animated.View
            style={[
              sidebarStyles.overlayBg,
              { opacity: overlayAnim },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeSidebar}
            />
          </Animated.View>
          <Animated.View
            style={[
              sidebarStyles.panel,
              { width: SIDEBAR_WIDTH, backgroundColor: styles._colors.surface, borderRightColor: styles._colors.stroke },
              { transform: [{ translateX: sidebarAnim }] },
            ]}
          >
            {/* 侧边栏头部 */}
            <View style={[sidebarStyles.panelHeader, { borderBottomColor: styles._colors.stroke }]}>
              <Text style={[sidebarStyles.panelTitle, { color: styles._colors.textPrimary }]}>
                对话记录
              </Text>
              <TouchableOpacity
                onPress={handleNewChat}
                activeOpacity={0.7}
                style={[sidebarStyles.newChatBtn, { borderColor: styles._colors.stroke, backgroundColor: styles._colors.accent }]}
              >
                <SquarePen size={18} color={styles._colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 会话列表 */}
            {sessionsLoading ? (
              <View style={sidebarStyles.loadingContainer}>
                <ActivityIndicator size="small" color={styles._colors.primary} />
              </View>
            ) : sessions.length === 0 ? (
              <View style={sidebarStyles.emptyContainer}>
                <Text style={[sidebarStyles.emptyText, { color: styles._colors.textTertiary }]}>
                  暂无对话记录
                </Text>
              </View>
            ) : (
              <ScrollView style={sidebarStyles.sessionList} showsVerticalScrollIndicator={false}>
                {groupSessionsByDate(sessions).map(group => (
                  <View key={group.title}>
                    <Text style={[sidebarStyles.groupTitle, { color: styles._colors.textTertiary }]}>
                      {group.title}
                    </Text>
                    {group.data.map(s => (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          sidebarStyles.sessionItem,
                          s.id === sessionId && {
                            backgroundColor: styles._colors.primaryLight,
                            borderColor: styles._colors.stroke,
                          },
                        ]}
                        onPress={() => handleSelectSession(s.id)}
                        onLongPress={(e) => handleSessionLongPress(s, e)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            sidebarStyles.sessionTitle,
                            { color: styles._colors.textPrimary },
                            s.id === sessionId && { color: styles._colors.primary, fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {s.title || '新对话'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      )}

      {/* 重命名弹窗 */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={sidebarStyles.renameOverlay}>
          <View style={[sidebarStyles.renameCard, { backgroundColor: styles._colors.surface, borderColor: styles._colors.stroke }]}>
            <Text style={[sidebarStyles.renameTitle, { color: styles._colors.textPrimary }]}>
              重命名会话
            </Text>
            <TextInput
              style={[
                sidebarStyles.renameInput,
                {
                  color: styles._colors.textPrimary,
                  borderColor: styles._colors.stroke,
                  backgroundColor: styles._colors.background,
                },
              ]}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="输入新标题"
              placeholderTextColor={styles._colors.textTertiary}
              autoFocus
              maxLength={50}
            />
            <View style={sidebarStyles.renameActions}>
              <TouchableOpacity
                style={[sidebarStyles.renameCancelBtn, { borderColor: styles._colors.stroke }]}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={{ color: styles._colors.textSecondary, fontSize: 15, fontWeight: '700' }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sidebarStyles.renameConfirmBtn, { backgroundColor: styles._colors.primary, borderColor: styles._colors.stroke }]}
                onPress={handleRenameConfirm}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 长按上下文菜单 */}
      <Modal
        visible={contextMenu !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setContextMenu(null)}
      >
        <TouchableOpacity
          style={sidebarStyles.contextOverlay}
          activeOpacity={1}
          onPress={() => setContextMenu(null)}
        >
          <View
            style={[
              sidebarStyles.contextCard,
              {
                backgroundColor: styles._colors.surface,
                borderColor: styles._colors.stroke,
                top: Math.min(
                  (contextMenu?.pageY ?? 0) - 20,
                  Dimensions.get('window').height - 220,
                ),
              },
            ]}
          >
            <TouchableOpacity
              style={[sidebarStyles.contextItem, { borderBottomColor: styles._colors.stroke }]}
              onPress={handleActionRename}
              activeOpacity={0.6}
            >
              <Edit2 size={17} color={styles._colors.textPrimary} />
              <Text style={[sidebarStyles.contextItemText, { color: styles._colors.textPrimary }]}>
                重命名
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[sidebarStyles.contextItem, { borderBottomColor: styles._colors.stroke }]}
              onPress={handleActionTogglePin}
              activeOpacity={0.6}
            >
              <Pin size={17} color={styles._colors.textPrimary} />
              <Text style={[sidebarStyles.contextItemText, { color: styles._colors.textPrimary }]}>
                {contextMenu?.session.isPinned ? '取消置顶' : '置顶'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={sidebarStyles.contextItem}
              onPress={handleActionDelete}
              activeOpacity={0.6}
            >
              <Trash2 size={17} color="#FF3B30" />
              <Text style={[sidebarStyles.contextItemText, { color: '#FF3B30' }]}>
                删除
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <ImageViewing
        images={imageViewerUrl ? [{ uri: imageViewerUrl }] : []}
        imageIndex={0}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: borderWidth.thin,
      borderBottomColor: colors.stroke,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    headerButton: {
      padding: spacing.sm,
    },
    messageList: {
      padding: spacing.lg,
      paddingBottom: spacing.md,
    },
    billsContainer: {
      marginBottom: spacing.md,
    },
    messageBubble: {
      flexDirection: 'row',
      marginBottom: spacing.md,
      alignItems: 'flex-start',
    },
    userBubble: {
      justifyContent: 'flex-end',
    },
    aiBubble: {
      justifyContent: 'flex-start',
    },
    aiAvatar: {
      fontSize: 24,
      marginRight: spacing.sm,
    },
    aiAvatarContainer: {
      width: 28,
      height: 28,
      marginRight: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiAvatarPlaceholder: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: spacing.sm,
      backgroundColor: colors.divider,
    },
    messageContent: {
      maxWidth: '80%',
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.md,
    },
    userContent: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: spacing.xs,
    },
    aiContent: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: spacing.xs,
    },
    errorContent: {
      backgroundColor: '#FFEBEE',
      borderBottomLeftRadius: spacing.xs,
    },
    messageText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 22,
    },
    userText: {
      color: '#FFFFFF',
    },
    chatImage: {
      width: 200,
      height: 200,
      borderRadius: borderRadius.small,
      marginBottom: spacing.xs,
    },
    chatImageList: {
      flexDirection: 'row',
      marginBottom: spacing.xs,
    },
    errorText: {
      fontSize: 15,
      color: '#D32F2F',
      lineHeight: 22,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
    },
    pendingBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.primary + '1A',
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
    },
    pendingText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    saveAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    saveAllButtonText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    pendingImagesContainer: {
      backgroundColor: colors.surface,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    pendingImagesScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    pendingImageWrapper: {
      position: 'relative',
      padding: 6,
      paddingBottom: 0,
    },
    pendingImageThumb: {
      width: 72,
      height: 72,
      borderRadius: borderRadius.small,
    },
    pendingImageRemove: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pendingImageAdd: {
      width: 72,
      height: 72,
      borderRadius: borderRadius.small,
      backgroundColor: colors.background,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.stroke,
      gap: spacing.sm,
    },
    mediaButton: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: borderRadius.input,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      minHeight: 48,
      justifyContent: 'center',
    },
    input: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      maxHeight: 100,
      paddingVertical: spacing.sm,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.income,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voiceButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voiceButtonActive: {
      backgroundColor: '#FF3B30',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    listeningBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: '#FF3B30' + '1A',
      borderTopWidth: 1,
      borderTopColor: '#FF3B30' + '33',
    },
    listeningDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF3B30',
      marginRight: spacing.sm,
    },
    listeningText: {
      fontSize: 14,
      color: '#FF3B30',
      fontWeight: '500',
      flex: 1,
    },
    // 语音录音覆盖层
    recordingOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 100,
      alignItems: 'center',
      paddingVertical: spacing.lg,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      borderRadius: borderRadius.large,
      marginHorizontal: spacing.lg,
    },
    recordingHint: {
      fontSize: 14,
      color: '#FFFFFF',
      marginBottom: spacing.md,
    },
    recordingHintCancel: {
      color: '#FF3B30',
    },
    waveContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 40,
      gap: 3,
    },
    waveBar: {
      width: 3,
      height: 30,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    waveBarCancel: {
      backgroundColor: '#FF3B30',
    },
    voicePreviewText: {
      fontSize: 14,
      color: '#FFFFFF',
      marginTop: spacing.md,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
    },
    // 按住说话按钮
    voiceInputWrapper: {
      flex: 1,
      height: 48,
      backgroundColor: colors.background,
      borderRadius: borderRadius.input,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
    voiceInputWrapperActive: {
      backgroundColor: colors.primary + '1A',
      borderColor: colors.primary,
    },
    voiceInputWrapperCancel: {
      backgroundColor: '#FF3B30' + '1A',
      borderColor: '#FF3B30',
    },
    voiceInputText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    voiceInputTextActive: {
      color: colors.primary,
    },
    // 模式切换按钮
    modeButton: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
    },
  }),
  _colors: colors,
});

const sidebarStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRightWidth: borderWidth.thick,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: borderWidth.thin,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  newChatBtn: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.small,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sessionList: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Courier',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sessionItem: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.small,
    borderWidth: borderWidth.thin,
    borderColor: 'transparent',
    marginBottom: spacing.xs,
  },
  sessionItemActive: {
    borderWidth: borderWidth.thin,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  // 重命名弹窗
  renameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  renameCard: {
    width: '100%',
    borderRadius: borderRadius.card,
    borderWidth: borderWidth.thick,
    padding: spacing.lg,
    ...shadow.medium,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  renameInput: {
    borderWidth: borderWidth.thin,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  renameActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  renameCancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.button,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
  },
  renameConfirmBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.button,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    ...shadow.small,
  },
  // 长按上下文菜单（浮层）
  contextOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  contextCard: {
    position: 'absolute',
    left: spacing.md,
    width: SIDEBAR_WIDTH * 0.45,
    borderRadius: borderRadius.small,
    borderWidth: borderWidth.medium,
    paddingVertical: spacing.xs,
    ...shadow.medium,
    elevation: 8,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: borderWidth.thin,
  },
  contextItemText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
