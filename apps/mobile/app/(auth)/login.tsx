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

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/shared/api/auth-store';
import { fonts, radius, size, spacing } from '@/shared/lib/theme';
import { useThemeColors } from '@/shared/lib/useTheme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { login, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !loading;

  const handleLogin = async () => {
    setError('');
    try {
      await login(email, password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const err = e as { message?: string | string[] };
      const msg = Array.isArray(err?.message)
        ? err.message[0]
        : (err?.message || t('auth.invalidCredentials'));
      setError(msg);
    }
  };

  const inputBase = {
    backgroundColor: c.card,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    fontSize: size.base,
    fontFamily: fonts.regular,
    color: c.text,
    marginBottom: spacing.lg,
  };

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
          paddingTop: insets.top + spacing['2xl'],
          paddingBottom: insets.bottom + spacing['2xl'],
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: spacing['4xl'] }}>
          <Text style={{ fontSize: 28, marginBottom: spacing.sm }}>🌿</Text>
          <Text style={{ fontSize: size['2xl'], fontFamily: fonts.bold, color: c.primary }}>
            MindBridge
          </Text>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: size.xl,
            fontFamily: fonts.bold,
            color: c.text,
            marginBottom: spacing.xs,
          }}
        >
          {t('auth.loginTitle')}
        </Text>
        <Text
          style={{
            fontSize: size.sm,
            fontFamily: fonts.regular,
            color: c.textSecondary,
            marginBottom: spacing['3xl'],
          }}
        >
          {t('auth.loginSubtitle')}
        </Text>

        {/* Email */}
        <Text
          style={{
            fontSize: size.sm,
            fontFamily: fonts.medium,
            color: c.text,
            marginBottom: spacing.xs,
          }}
        >
          {t('auth.email')}
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          style={{ ...inputBase, borderColor: error ? c.danger : c.border }}
        />

        {/* Password */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xs,
          }}
        >
          <Text style={{ fontSize: size.sm, fontFamily: fonts.medium, color: c.text }}>
            {t('auth.password')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={{ fontSize: size.xs, color: c.textMuted }}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={c.textMuted}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          style={{ ...inputBase, borderColor: error ? c.danger : c.border }}
        />

        {/* Error */}
        {error ? (
          <Text
            style={{
              fontSize: size.sm,
              fontFamily: fonts.regular,
              color: c.danger,
              marginBottom: spacing.lg,
            }}
          >
            {error}
          </Text>
        ) : null}

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={!canSubmit}
          activeOpacity={0.8}
          style={{
            backgroundColor: c.primary,
            borderRadius: radius.full,
            paddingVertical: spacing.lg,
            alignItems: 'center',
            opacity: canSubmit ? 1 : 0.5,
            marginBottom: spacing['2xl'],
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: '#fff', fontSize: size.base, fontFamily: fonts.semibold }}>
              {t('auth.login')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          <Text
            style={{
              fontSize: size.sm,
              fontFamily: fonts.regular,
              color: c.textSecondary,
            }}
          >
            {t('auth.noAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={{ fontSize: size.sm, fontFamily: fonts.semibold, color: c.primary }}>
              {t('auth.register')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
