import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, CircleCheck } from 'lucide-react-native';

import { apiClient } from '@/shared/api/client';
import { fonts, radius, size, spacing } from '@/shared/lib/theme';
import { useThemeColors } from '@/shared/lib/useTheme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
    } catch {
      // Don't reveal whether email exists
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing['2xl'],
        }}
      >
        <CircleCheck size={48} color={c.primary} />
        <Text
          style={{
            fontSize: size.lg,
            fontFamily: fonts.semibold,
            color: c.text,
            marginTop: spacing.xl,
            textAlign: 'center',
          }}
        >
          {t('auth.resetEmailSent')}
        </Text>
        <Text
          style={{
            fontSize: size.sm,
            color: c.textSecondary,
            marginTop: spacing.sm,
            textAlign: 'center',
          }}
        >
          {t('auth.resetEmailSentDesc')}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing['3xl'] }}>
          <Text style={{ fontSize: size.sm, fontFamily: fonts.semibold, color: c.primary }}>
            {t('auth.backToLogin')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: spacing['2xl'],
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: spacing['3xl'] }}>
          <ChevronLeft size={24} color={c.text} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: size.xl,
            fontFamily: fonts.bold,
            color: c.text,
            marginBottom: spacing.sm,
          }}
        >
          {t('auth.forgotPasswordTitle')}
        </Text>
        <Text
          style={{ fontSize: size.sm, color: c.textSecondary, marginBottom: spacing['3xl'] }}
        >
          {t('auth.forgotPasswordDesc')}
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: Platform.OS === 'ios' ? spacing.lg : spacing.md,
            fontSize: size.base,
            fontFamily: fonts.regular,
            color: c.text,
            marginBottom: spacing.xl,
          }}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!email.trim() || loading}
          activeOpacity={0.8}
          style={{
            backgroundColor: c.primary,
            borderRadius: radius.full,
            paddingVertical: spacing.lg,
            alignItems: 'center',
            opacity: !email.trim() || loading ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: '#fff', fontSize: size.base, fontFamily: fonts.semibold }}>
              {t('auth.sendResetLink')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
