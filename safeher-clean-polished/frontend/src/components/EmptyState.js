import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';
import { PrimaryButton } from './PrimaryButton';
import { Card } from './Card';

export function EmptyState({ icon = 'sparkles-outline', title, message, actionLabel, onAction }) {
  const { theme } = useTheme();

  return (
    <Card elevated style={{ alignItems: 'center', padding: theme.spacing.xxl }}>
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        <Ionicons name={icon} size={31} color={theme.colors.primary} />
      </View>
      <Text style={{ color: theme.colors.text, fontSize: 19, fontWeight: '900', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 21 }}>{message}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton title={actionLabel} onPress={onAction} style={{ marginTop: theme.spacing.lg, alignSelf: 'stretch' }} />
      ) : null}
    </Card>
  );
}
