import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';
import { PressableCard } from './Card';

export function ActionCard({ icon, title, subtitle, onPress, tone = 'primary' }) {
  const { theme } = useTheme();
  const iconColor = tone === 'success' ? theme.colors.success : tone === 'warning' ? theme.colors.warning : theme.colors.primary;
  const bgColor = tone === 'success' ? theme.colors.successSoft : tone === 'warning' ? theme.colors.warningSoft : theme.colors.primarySoft;

  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={`${title}. ${subtitle}`}
      style={{ flex: 1, minWidth: '47%', marginBottom: theme.spacing.md }}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        <Ionicons name={icon} size={21} color={iconColor} />
      </View>
      <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 15 }}>{title}</Text>
      <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 19 }}>{subtitle}</Text>
    </PressableCard>
  );
}
