import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useSubmitMood } from '@/shared/api/hooks/use-mood';
import { useEndSession } from '@/shared/api/hooks/use-sessions';
import { fonts, radius, size, spacing } from '@/shared/lib/theme';
import { useThemeColors } from '@/shared/lib/useTheme';

const MOODS = [
  { value: 2, emoji: '😔', labelKey: 'bad' },
  { value: 4, emoji: '😟', labelKey: 'rough' },
  { value: 6, emoji: '😐', labelKey: 'okay' },
  { value: 8, emoji: '🙂', labelKey: 'good' },
  { value: 10, emoji: '😊', labelKey: 'great' },
] as const;

export default function MoodScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { t } = useTranslation();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  const endSession = useEndSession();
  const submitMood = useSubmitMood();

  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelect = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(value);
  };

  const handleSubmit = async () => {
    if (selected === null || !sessionId) return;
    setSaving(true);
    try {
      await endSession.mutateAsync(sessionId);
      await submitMood.mutateAsync({
        value: selected,
        note: note.trim() || undefined,
        sessionId,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/chat');
    } catch {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      await endSession.mutateAsync(sessionId);
      router.replace('/(tabs)/chat');
    } catch {
      setSaving(false);
    }
  };

  const selectedMood = MOODS.find((m) => m.value === selected);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.background,
        paddingTop: insets.top + spacing['3xl'],
        paddingHorizontal: spacing['2xl'],
        paddingBottom: insets.bottom + spacing.xl,
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: size['2xl'],
            fontFamily: fonts.bold,
            color: c.text,
            textAlign: 'center',
          }}
        >
          {t('mood.title')}
        </Text>
        <Text
          style={{
            fontSize: size.sm,
            color: c.textSecondary,
            marginTop: spacing.sm,
            textAlign: 'center',
          }}
        >
          {t('mood.subtitle')}
        </Text>

        {/* Mood emojis */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: spacing.lg,
            marginTop: spacing['3xl'],
          }}
        >
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.value}
              onPress={() => handleSelect(mood.value)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: selected === mood.value ? c.primaryBg : 'transparent',
                borderWidth: selected === mood.value ? 2 : 0,
                borderColor: c.primary,
                transform: [{ scale: selected === mood.value ? 1.15 : 1 }],
              }}
            >
              <Text style={{ fontSize: 28 }}>{mood.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected label */}
        {selectedMood && (
          <Text
            style={{
              fontSize: size.sm,
              fontFamily: fonts.medium,
              color: c.primary,
              marginTop: spacing.lg,
            }}
          >
            {t(`mood.${selectedMood.labelKey}`)}
          </Text>
        )}

        {/* Note */}
        {selected !== null && (
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('mood.notePlaceholder')}
            placeholderTextColor={c.textMuted}
            multiline
            maxLength={200}
            style={{
              width: '100%',
              maxHeight: 80,
              backgroundColor: c.card,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: radius.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              fontSize: size.sm,
              fontFamily: fonts.regular,
              color: c.text,
              marginTop: spacing.xl,
              textAlignVertical: 'top',
            }}
          />
        )}
      </View>

      {/* Actions */}
      <View style={{ gap: spacing.md }}>
        {selected !== null && (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            style={{
              backgroundColor: c.primary,
              borderRadius: radius.full,
              paddingVertical: spacing.lg,
              alignItems: 'center',
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontSize: size.base, fontFamily: fonts.semibold }}>
              {t('mood.save')}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleSkip}
          disabled={saving}
          style={{ alignItems: 'center', paddingVertical: spacing.md }}
        >
          <Text style={{ fontSize: size.sm, color: c.textMuted }}>{t('mood.skip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
