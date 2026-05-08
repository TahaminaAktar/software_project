import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  error = '',
  helper = '',
  rightElement = null,
  returnKeyType,
  accessibilityLabel,
}) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      {label ? (
        <Text style={{ color: theme.colors.text, fontWeight: '800', marginBottom: 8 }}>{label}</Text>
      ) : null}
      <View
        style={{
          borderWidth: 1.4,
          borderColor: error ? theme.colors.danger : focused ? theme.colors.primary : theme.colors.border,
          backgroundColor: theme.colors.input,
          borderRadius: theme.radius.md,
          minHeight: 56,
          paddingHorizontal: 15,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSubtle}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          accessibilityLabel={accessibilityLabel || label || placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            color: theme.colors.text,
            fontSize: theme.typography.body,
            paddingVertical: multiline ? 14 : 0,
            minHeight: multiline ? 116 : 56,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {rightElement}
      </View>
      {error ? (
        <Text style={{ color: theme.colors.danger, marginTop: 7, fontSize: 12, fontWeight: '700' }}>{error}</Text>
      ) : helper ? (
        <Text style={{ color: theme.colors.textSubtle, marginTop: 7, fontSize: 12, lineHeight: 17 }}>{helper}</Text>
      ) : null}
    </View>
  );
}
