import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '../../components/ScreenWrapper';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { InfoBanner } from '../../components/InfoBanner';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getApiErrorMessage } from '../../api/client';
import { cleanText, hasErrors, required } from '../../utils/validation';

export function LoginScreen({ navigation }) {
  const { login, isSubmitting } = useAuth();
  const { theme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {
      identifier: required(identifier, 'Email or phone'),
      password: required(password, 'Password'),
    };
    setErrors(nextErrors);
    return !hasErrors(nextErrors);
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await login({ identifier: cleanText(identifier), password });
    } catch (error) {
      Alert.alert('Login failed', getApiErrorMessage(error));
    }
  };

  return (
    <ScreenWrapper keyboardAware contentContainerStyle={{ justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
        <View style={{ width: 86, height: 86, borderRadius: 43, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md }}>
          <Ionicons name="shield-checkmark" size={42} color={theme.colors.primary} />
        </View>
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.display, fontWeight: '900', letterSpacing: -1 }}>SafeHer</Text>
        <Text style={{ color: theme.colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 21 }}>
          Fast emergency actions, trusted contacts, and live safety sharing.
        </Text>
      </View>

      <Card elevated padding="xl">
        <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 }}>Welcome back</Text>
        <Text style={{ color: theme.colors.textMuted, marginTop: 8, lineHeight: 21 }}>
          Log in to access your SOS flow, live location sharing, emergency contacts, and incident history.
        </Text>

        <View style={{ marginTop: theme.spacing.xl }}>
          <FormInput
            label="Email or phone"
            value={identifier}
            onChangeText={(value) => {
              setIdentifier(value);
              if (errors.identifier) setErrors((current) => ({ ...current, identifier: '' }));
            }}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.identifier}
          />
          <FormInput
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (errors.password) setErrors((current) => ({ ...current, password: '' }));
            }}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            error={errors.password}
            rightElement={
              <Pressable onPress={() => setShowPassword((current) => !current)} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={theme.colors.textMuted} />
              </Pressable>
            }
          />
          <PrimaryButton title="Log in" onPress={handleLogin} loading={isSubmitting} />
        </View>

        <Pressable onPress={() => navigation.navigate('Signup')} style={{ marginTop: theme.spacing.xl }} accessibilityRole="button">
          <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>
            New to SafeHer? <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>Create an account</Text>
          </Text>
        </Pressable>
      </Card>

      <InfoBanner
        tone="info"
        icon="lock-closed-outline"
        title="Privacy-first safety tools"
        message="Your location is requested only when a safety action needs it, such as SOS, live sharing, help centers, or incident context."
        style={{ marginTop: theme.spacing.lg }}
      />
    </ScreenWrapper>
  );
}
