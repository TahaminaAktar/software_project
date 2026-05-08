import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';

export function InlineLoader({ label = 'Loading...' }) {
  const { theme } = useTheme();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xl }}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.sm }}>{label}</Text>
    </View>
  );
}
