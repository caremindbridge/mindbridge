import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { fonts, gradients, radius, spacing } from '@/shared/lib/theme';
import { useThemeColors } from '@/shared/lib/useTheme';

export function MiraCard() {
  const c = useThemeColors();
  const router = useRouter();

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <LinearGradient
        colors={[...gradients.miraHero.colors]}
        start={gradients.miraHero.start}
        end={gradients.miraHero.end}
        style={{
          borderRadius: radius['2xl'],
          padding: spacing.xl,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Sparkles size={16} color={c.primary} />
          </View>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: '#FFFFFF' }}>
            Мира ✨
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#FFFFFF' }}>
            Готова когда ты готов
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
            Я здесь чтобы слушать и помочь разобраться
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/chat')}
          style={{
            backgroundColor: '#FFFFFF',
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: '#C4856F' }}>
            Начать сессию →
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}
