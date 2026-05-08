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
import { cleanText, hasErrors, minLength, required, validateEmail, validatePhone } from '../../utils/validation';

export function SignupScreen({ navigation }) {
  const { register, isSubmitting } = useAuth();
  const { theme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {
      fullName: minLength(fullName, 2, 'Full name'),
      email: required(email, 'Email') || validateEmail(email),
      phone: required(phone, 'Phone') || validatePhone(phone),
      password: minLength(password, 8, 'Password') || (!/[A-Z]/.test(password) ? 'Password must include an uppercase letter.' : '') || (!/[0-9]/.test(password) ? 'Password must include a number.' : ''),
    };
    setErrors(nextErrors);
    return !hasErrors(nextErrors);
  };

  const clearError = (key) => {
    if (errors[key]) setErrors((current) => ({ ...current, [key]: '' }));
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      await register({
        fullName: cleanText(fullName),
        email: cleanText(email).toLowerCase(),
        phone: cleanText(phone),
        password,
      });
    } catch (error) {
      Alert.alert('Signup failed', getApiErrorMessage(error));
    }
  };

  return (
    <ScreenWrapper keyboardAware>
      <Pressable onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg }} accessibilityRole="button" accessibilityLabel="Go back">
        <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
      </Pressable>

      <Card elevated padding="xl">
        <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg }}>
          <Ionicons name="person-add-outline" size={33} color={theme.colors.primary} />
        </View>
        <Text style={{ color: theme.colors.text, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 }}>Create account</Text>
        <Text style={{ color: theme.colors.textMuted, marginTop: 8, lineHeight: 21 }}>
          Set up your safety profile once, then add trusted contacts and use emergency tools when needed.
        </Text>

        <InfoBanner
          tone="info"
          title="Safety data stays purposeful"
          message="Account details help identify you in alerts and keep your trusted-contact network connected to your profile."
          style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.md }}
        />

        <FormInput label="Full name" value={fullName} onChangeText={(value) => { setFullName(value); clearError('fullName'); }} placeholder="Your full name" error={errors.fullName} />
        <FormInput label="Email" value={email} onChangeText={(value) => { setEmail(value); clearError('email'); }} placeholder="you@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" error={errors.email} />
        <FormInput label="Phone" value={phone} onChangeText={(value) => { setPhone(value); clearError('phone'); }} placeholder="+8801XXXXXXXXX" keyboardType="phone-pad" error={errors.phone} />
        <FormInput
          label="Password"
          value={password}
          onChangeText={(value) => { setPassword(value); clearError('password'); }}
          placeholder="Minimum 8 characters"
          secureTextEntry={!showPassword}
          error={errors.password}
          helper="Use 8+ characters with at least one uppercase letter and one number."
          rightElement={
            <Pressable onPress={() => setShowPassword((current) => !current)} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={theme.colors.textMuted} />
            </Pressable>
          }
        />
        <PrimaryButton title="Create account" onPress={handleSignup} loading={isSubmitting} />

        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: theme.spacing.xl }} accessibilityRole="button">
          <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>
            Already have an account? <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>Log in</Text>
          </Text>
        </Pressable>
      </Card>
    </ScreenWrapper>
  );
}
