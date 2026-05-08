import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';

export function LoadingScreen({ message = 'Preparing your safety space...' }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: theme.spacing.xl,
      }}
    >
      <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg }}>
        <Ionicons name="shield-checkmark" size={38} color={theme.colors.primary} />
      </View>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text
        style={{
          marginTop: theme.spacing.md,
          color: theme.colors.textMuted,
          fontSize: theme.typography.body,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
}
