import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fonts, size, spacing } from '@/shared/lib/theme';
import { useThemeColors } from '@/shared/lib/useTheme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.background,
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.xl,
      }}
    >
      <Text style={{ fontSize: size.xl, fontFamily: fonts.bold, color: c.text }}>
        {t('home.greeting')}
      </Text>
      <Text
        style={{
          fontSize: size.sm,
          fontFamily: fonts.regular,
          color: c.textSecondary,
          marginTop: spacing.sm,
        }}
      >
        {t('home.placeholder')}
      </Text>
    </View>
  );
}
