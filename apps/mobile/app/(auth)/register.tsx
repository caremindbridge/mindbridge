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

export default function RegisterScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { register, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'therapist'>('patient');
  const [error, setError] = useState('');

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    email.trim().length > 0 && password.length >= 6 && passwordsMatch && !loading;

  const handleRegister = async () => {
    setError('');
    if (!passwordsMatch) {
      setError(t('auth.passwordsMismatch'));
      return;
    }
    try {
      await register(email, password, role);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const err = e as { message?: string | string[] };
      const msg = Array.isArray(err?.message)
        ? err.message[0]
        : (err?.message || t('common.error'));
      setError(msg);
    }
  };

  const inputBase = {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
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
        <View style={{ alignItems: 'center', marginBottom: spacing['3xl'] }}>
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
            marginBottom: spacing['2xl'],
          }}
        >
          {t('auth.registerTitle')}
        </Text>

        {/* Role toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: c.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: c.border,
            marginBottom: spacing['2xl'],
            overflow: 'hidden',
          }}
        >
          {(['patient', 'therapist'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => {
                setRole(r);
                Haptics.selectionAsync();
              }}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                alignItems: 'center',
                backgroundColor: role === r ? c.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: size.sm,
                  fontFamily: fonts.semibold,
                  color: role === r ? '#fff' : c.textSecondary,
                }}
              >
                {r === 'patient' ? t('auth.rolePatient') : t('auth.roleTherapist')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
          style={inputBase}
        />

        {/* Password */}
        <Text
          style={{
            fontSize: size.sm,
            fontFamily: fonts.medium,
            color: c.text,
            marginBottom: spacing.xs,
          }}
        >
          {t('auth.password')}
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={c.textMuted}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          style={inputBase}
        />

        {/* Confirm Password */}
        <Text
          style={{
            fontSize: size.sm,
            fontFamily: fonts.medium,
            color: c.text,
            marginBottom: spacing.xs,
          }}
        >
          {t('auth.confirmPassword')}
        </Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          placeholderTextColor={c.textMuted}
          secureTextEntry
          textContentType="newPassword"
          style={{
            ...inputBase,
            borderColor: confirmPassword && !passwordsMatch ? c.danger : c.border,
          }}
        />

        {/* Error */}
        {error ? (
          <Text
            style={{
              fontSize: size.sm,
              color: c.danger,
              marginBottom: spacing.lg,
            }}
          >
            {error}
          </Text>
        ) : null}

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
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
              {t('auth.register')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Login link */}
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ fontSize: size.sm, color: c.textSecondary }}>{t('auth.hasAccount')}{' '}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: size.sm, fontFamily: fonts.semibold, color: c.primary }}>
              {t('auth.login')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
