import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowUp, ChevronLeft, Square } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { useChatStream } from '@/shared/api/hooks/use-chat-stream';
import type { DisplayMessage } from '@/shared/api/hooks/use-chat-stream';
import { useSession } from '@/shared/api/hooks/use-sessions';
import { fonts, radius, size, spacing } from '@/shared/lib/theme';
import { useThemeColors } from '@/shared/lib/useTheme';

const LIMIT_CODES = ['session_limit', 'monthly_limit', 'trial_expired', 'no_subscription', 'payment_failed', 'subscription_expired'];

export default function ChatScreen() {
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  const { data: session, isLoading: loadingSession } = useSession(sessionId!);

  const { messages, streamingContent, isStreaming, limitError, error, sendMessage } =
    useChatStream(sessionId!, session?.messages ?? []);

  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll on new message or streaming update
  useEffect(() => {
    if (messages.length > 0 || streamingContent) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length, streamingContent]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    await sendMessage(text);
  }, [input, isStreaming, sendMessage]);

  const handleEndSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/(tabs)/chat/mood', params: { sessionId } });
  };

  const canSend = input.trim().length > 0 && !isStreaming;

  // Build display list: messages + streaming indicator
  const displayMessages: DisplayMessage[] = streamingContent
    ? [...messages, { id: 'streaming', role: 'assistant', content: streamingContent }]
    : messages;

  const renderMessage = ({ item: msg, index }: { item: DisplayMessage; index: number }) => {
    const isUser = msg.role === 'user';
    const isLast = index === displayMessages.length - 1;
    return (
      <Animated.View
        entering={isLast ? FadeIn.duration(200) : undefined}
        style={{
          flexDirection: 'row',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: spacing.sm,
        }}
      >
        {!isUser && (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: c.miraAvatar,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: spacing.sm,
              marginTop: 2,
            }}
          >
            <Text style={{ fontSize: 14 }}>🌿</Text>
          </View>
        )}
        <View
          style={{
            maxWidth: '80%',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: radius.xl,
            backgroundColor: isUser ? c.userBubble : c.miraBubble,
            borderBottomRightRadius: isUser ? radius.sm : radius.xl,
            borderBottomLeftRadius: isUser ? radius.xl : radius.sm,
          }}
        >
          <Text
            style={{
              fontSize: size.sm,
              fontFamily: fonts.regular,
              color: isUser ? '#FFFFFF' : c.text,
              lineHeight: size.sm * 1.55,
            }}
          >
            {msg.content}
            {msg.id === 'streaming' && isStreaming ? '▊' : ''}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm,
          borderBottomWidth: 0.5,
          borderBottomColor: c.borderLight,
          backgroundColor: c.background,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: spacing.sm }}>
          <ChevronLeft size={24} color={c.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: size.base, fontFamily: fonts.semibold, color: c.text }}>
          Mira 🌿
        </Text>

        <TouchableOpacity
          onPress={handleEndSession}
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.full,
            backgroundColor: c.primaryBg,
          }}
        >
          <Text style={{ fontSize: size.xs, fontFamily: fonts.medium, color: c.primary }}>
            {t('chat.end')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loadingSession ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.lg,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}
            >
              <Text style={{ fontSize: 32, marginBottom: spacing.md }}>🌿</Text>
              <Text
                style={{ fontSize: size.sm, color: c.textSecondary, textAlign: 'center' }}
              >
                {t('chat.emptyHint')}
              </Text>
            </View>
          }
        />
      )}

      {/* General error */}
      {error && !LIMIT_CODES.includes(error) && (
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
          <Text style={{ fontSize: size.xs, color: c.danger, textAlign: 'center' }}>{error}</Text>
        </View>
      )}

      {/* Limit banner */}
      {limitError && (
        <View
          style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.sm,
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: c.primaryBg,
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <Text
            style={{
              fontSize: size.sm,
              fontFamily: fonts.medium,
              color: c.text,
              textAlign: 'center',
            }}
          >
            {limitError === 'session_limit'
              ? t('chat.sessionLimit')
              : limitError === 'monthly_limit'
                ? t('chat.monthlyLimit')
                : t('chat.trialExpired')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            style={{
              backgroundColor: c.primary,
              borderRadius: radius.full,
              paddingVertical: spacing.md,
              alignItems: 'center',
              marginTop: spacing.md,
            }}
          >
            <Text style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: size.sm }}>
              {t('chat.upgrade')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
          borderTopWidth: 0.5,
          borderTopColor: c.borderLight,
          backgroundColor: c.background,
          gap: spacing.sm,
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={c.textMuted}
          multiline
          maxLength={2000}
          style={{
            flex: 1,
            maxHeight: 120,
            minHeight: 40,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.borderLight,
            borderRadius: radius.xl,
            paddingHorizontal: spacing.lg,
            paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
            fontSize: size.base,
            fontFamily: fonts.regular,
            color: c.text,
          }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: canSend || isStreaming ? c.primary : c.borderLight,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {isStreaming ? (
            <Square size={14} color="#fff" fill="#fff" />
          ) : (
            <ArrowUp size={20} color={canSend ? '#fff' : c.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
