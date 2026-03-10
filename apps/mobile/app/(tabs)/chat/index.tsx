import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useCreateSession, useSessions } from '@/shared/api/hooks/use-sessions';
import type { Session } from '@/shared/api/hooks/use-sessions';
import { fonts, radius, size, spacing } from '@/shared/lib/theme';
import { useThemeColors } from '@/shared/lib/useTheme';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface SessionGroup {
  key: string;
  label: string;
  sessions: Session[];
}

function groupByDate(sessions: Session[]): SessionGroup[] {
  const groups: Record<string, Session[]> = {};
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  for (const session of sorted) {
    const key = new Date(session.createdAt).toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(session);
  }
  return Object.entries(groups).map(([key, items]) => ({
    key,
    label: formatDateLabel(key),
    sessions: items,
  }));
}

export default function SessionsScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  const { data: sessions, isLoading, refetch } = useSessions();
  const createSession = useCreateSession();

  const handleNewSession = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const session = await createSession.mutateAsync();
      router.push(`/(tabs)/chat/${session.id}`);
    } catch {
      // ignore
    }
  };

  const grouped = groupByDate(sessions ?? []);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: size.xl, fontFamily: fonts.bold, color: c.text }}>
          {t('sessions.title')}
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : !sessions?.length ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing['2xl'],
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>🌿</Text>
          <Text
            style={{
              fontSize: size.lg,
              fontFamily: fonts.semibold,
              color: c.text,
              textAlign: 'center',
            }}
          >
            {t('sessions.empty')}
          </Text>
          <Text
            style={{
              fontSize: size.sm,
              color: c.textSecondary,
              textAlign: 'center',
              marginTop: spacing.sm,
            }}
          >
            {t('sessions.emptyDesc')}
          </Text>
          <TouchableOpacity
            onPress={handleNewSession}
            disabled={createSession.isPending}
            style={{
              backgroundColor: c.primary,
              borderRadius: radius.full,
              paddingHorizontal: spacing['2xl'],
              paddingVertical: spacing.lg,
              marginTop: spacing['2xl'],
            }}
          >
            {createSession.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: size.base }}>
                {t('sessions.startFirst')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
          onRefresh={refetch}
          refreshing={isLoading}
          renderItem={({ item: group }) => (
            <View style={{ marginBottom: spacing.xl }}>
              <Text
                style={{
                  fontSize: size.xs,
                  fontFamily: fonts.medium,
                  color: c.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: spacing.sm,
                }}
              >
                {group.label}
              </Text>
              {group.sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/(tabs)/chat/${session.id}`);
                  }}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: c.card,
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    marginBottom: spacing.sm,
                    borderWidth: 1,
                    borderColor: c.borderLight,
                  }}
                >
                  <Text
                    style={{ fontSize: size.sm, fontFamily: fonts.medium, color: c.text }}
                    numberOfLines={1}
                  >
                    {session.title || t('sessions.untitled')}
                  </Text>
                  <Text style={{ fontSize: size.xs, color: c.textMuted, marginTop: 2 }}>
                    {formatTime(session.createdAt)}
                    {session.status === 'completed' && ' · ✓'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      )}

      {/* FAB */}
      {(sessions?.length ?? 0) > 0 && (
        <TouchableOpacity
          onPress={handleNewSession}
          disabled={createSession.isPending}
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            bottom: insets.bottom + 80,
            right: spacing.xl,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: c.primary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {createSession.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Plus size={24} color="#fff" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
