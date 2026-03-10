/**
 * AI 聊天会话列表屏幕
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MessageCircle, Plus, Trash2, ChevronRight } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAlert } from '../../providers';
import { ThemeColors } from '../../theme/colors';
import { borderRadius, borderWidth, spacing, shadow } from '../../theme/spacing';
import { useStyles } from '../../hooks';
import { aiService } from '../../services/api/ai';
import type { ChatSession } from '../../types/ai';

export default function AIChatSessionsScreen() {
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const { alert, confirm } = useAlert();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await aiService.getChatSessions({ limit: 50 });
      if (response.success && response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadSessions(false);
  };

  const handleNewChat = () => {
    navigation.navigate('AIChat', {});
  };

  const handleOpenSession = (sessionId: number) => {
    navigation.navigate('AIChat', { sessionId });
  };

  const handleDeleteSession = (sessionId: number) => {
    confirm(
      '删除会话',
      '确定要删除这个会话吗？删除后无法恢复。',
      async () => {
        try {
          await aiService.deleteChatSession(sessionId);
          setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (error) {
          alert('错误', '删除失败，请重试');
        }
      },
      undefined,
      { confirmText: '删除', destructive: true },
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const renderSession = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => handleOpenSession(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.sessionIcon}>
        <MessageCircle size={20} color={styles._colors.primary} />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle} numberOfLines={1}>
          {item.title || '新对话'}
        </Text>
        <Text style={styles.sessionMeta}>
          {formatTime(item.updatedAt)}
          {item._count?.messages ? ` · ${item._count.messages} 条消息` : ''}
        </Text>
      </View>
      <View style={styles.sessionActions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteSession(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={16} color={styles._colors.textTertiary} />
        </TouchableOpacity>
        <ChevronRight size={18} color={styles._colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MessageCircle size={48} color={styles._colors.textTertiary} />
      <Text style={styles.emptyText}>还没有对话记录</Text>
      <Text style={styles.emptyHint}>点击右上角开始新对话</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={styles._colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>对话记录</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={handleNewChat}
          activeOpacity={0.7}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.newChatButtonText}>新对话</Text>
        </TouchableOpacity>
      </View>

      {/* 会话列表 */}
      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={sessions.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[styles._colors.primary]}
          />
        }
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => ({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: borderWidth.thin,
      borderBottomColor: colors.stroke,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    newChatButton: {
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
    newChatButtonText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    listContent: {
      padding: spacing.lg,
    },
    emptyList: {
      flex: 1,
    },
    sessionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    sessionIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.small,
      borderWidth: borderWidth.thin,
      borderColor: colors.stroke,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    sessionInfo: {
      flex: 1,
    },
    sessionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    sessionMeta: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Courier',
      color: colors.textTertiary,
    },
    sessionActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    deleteButton: {
      padding: spacing.xs,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 60,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textSecondary,
      marginTop: spacing.lg,
    },
    emptyHint: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
      marginTop: spacing.xs,
    },
  }),
  _colors: colors,
});
