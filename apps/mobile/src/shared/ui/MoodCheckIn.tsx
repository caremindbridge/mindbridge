import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

import { fonts, radius, shadows, spacing } from '@/shared/lib/theme';
import { useThemeColors } from '@/shared/lib/useTheme';

const MOODS = [
  { emoji: '😟', label: 'Плохо', value: 1 },
  { emoji: '😔', label: 'Так себе', value: 2 },
  { emoji: '😐', label: 'Норм', value: 3 },
  { emoji: '🙂', label: 'Хорошо', value: 4 },
  { emoji: '😊', label: 'Отлично', value: 5 },
] as const;

interface MoodCheckInProps {
  onMoodSelect: (value: number) => void;
}

/**
 * TODO: Implement handleMoodPress
 *
 * This is where a UX decision matters:
 * - Should selecting a mood immediately submit it (fast, but no undo)?
 * - Or should it highlight the selected mood and wait for confirmation (safer, but adds friction)?
 * - Should there be a visual "pulse" animation on the selected emoji?
 * - Should we debounce rapid taps to prevent double-submission?
 *
 * The mood data goes to the API via useSubmitMood() hook.
 */
function handleMoodPress(
  value: number,
  onMoodSelect: (value: number) => void,
) {
  // TODO: implement — see trade-offs above
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  onMoodSelect(value);
}

export function MoodCheckIn({ onMoodSelect }: MoodCheckInProps) {
  const c = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: radius.xl,
        padding: 18,
        gap: 14,
        ...shadows.card,
      }}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: c.text }}>
        Как ты себя чувствуешь?
      </Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {MOODS.map((mood) => (
          <TouchableOpacity
            key={mood.value}
            onPress={() => handleMoodPress(mood.value, onMoodSelect)}
            style={{ alignItems: 'center', gap: 6 }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.warmBg,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>{mood.emoji}</Text>
            </View>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 11,
                color: c.textSecondary,
              }}
            >
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
