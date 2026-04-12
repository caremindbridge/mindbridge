import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Moon, Sun } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

import { fonts, radius, shadows, spacing } from '@/shared/lib/theme';
import { useThemeColors } from '@/shared/lib/useTheme';
import { MiraCard } from '@/shared/ui/MiraCard';
import { MoodCheckIn } from '@/shared/ui/MoodCheckIn';
import { QuickTools } from '@/shared/ui/QuickTools';

function WeekStats() {
  const c = useThemeColors();

  const stats = [
    { value: '2', label: 'дней подряд', sub: 'Weekly goal' },
    { value: '3', label: 'сессий', sub: '' },
    { value: '+12%', label: 'настроение', sub: '' },
  ];

  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: radius.xl,
        padding: 18,
        gap: 12,
        ...shadows.card,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: c.text }}>На этой неделе</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: c.textSecondary }}>
          Апр 7-12
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {stats.map((stat) => (
          <View key={stat.label} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: c.text }}>
              {stat.value}
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: c.textSecondary }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function InsightCard() {
  const c = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: c.warmBg,
        borderRadius: radius.xl,
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: c.primary }}>
        💡 Инсайт от Миры
      </Text>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 13,
          color: c.textBody,
          lineHeight: 13 * 1.5,
        }}
      >
        Ты чаще чувствуешь себя лучше после утренних сессий. Попробуй планировать следующую до 10
        утра.
      </Text>
    </View>
  );
}

function RecentSession() {
  const c = useThemeColors();

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: c.text }}>
          Последняя сессия
        </Text>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: c.primary }}>Все →</Text>
      </View>

      <View
        style={{
          backgroundColor: c.card,
          borderRadius: radius.xl,
          padding: 16,
          gap: 10,
          ...shadows.card,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.border,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>🧠</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: c.text }}>
              Рабочая тревожность
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: c.textSecondary }}>
              Вчера · 24 мин
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: c.greenLight,
            }}
          >
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: c.green }}>CBT</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const ThemeIcon = colorScheme === 'dark' ? Moon : Sun;
  const themeIconColor = colorScheme === 'dark' ? c.primary : c.textSecondary;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + spacing.xs,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ gap: 2 }}>
              <Text
                style={{ fontFamily: fonts.regular, fontSize: 13, color: c.textSecondary }}
              >
                Доброе утро ✨
              </Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: c.text }}>Alex</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: c.inputBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ThemeIcon size={18} color={themeIconColor} />
              </View>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: c.card,
                  justifyContent: 'center',
                  alignItems: 'center',
                  ...shadows.card,
                }}
              >
                <Bell size={18} color={c.text} />
              </View>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: c.avatarBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: '#8B6B5E' }}>A</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mira Card */}
        <MiraCard />

        {/* Mood + Quick Tools */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: 16 }}>
          <MoodCheckIn onMoodSelect={(value) => console.log('mood:', value)} />
          <QuickTools />
        </View>

        {/* Week Stats */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <WeekStats />
        </View>

        {/* Insight */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <InsightCard />
        </View>

        {/* Recent Session */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <RecentSession />
        </View>
      </ScrollView>
    </View>
  );
}
