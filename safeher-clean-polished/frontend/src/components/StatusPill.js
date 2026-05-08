import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';

const toneMap = {
  danger: ['danger', 'dangerSoft'],
  success: ['success', 'successSoft'],
  warning: ['warning', 'warningSoft'],
  info: ['info', 'infoSoft'],
  neutral: ['textMuted', 'surfaceAlt'],
};

export function StatusPill({ label, tone = 'neutral', icon = null, style }) {
  const { theme } = useTheme();
  const [textKey, bgKey] = toneMap[tone] || toneMap.neutral;

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors[bgKey],
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={13} color={theme.colors[textKey]} /> : null}
      <Text style={{ color: theme.colors[textKey], fontSize: theme.typography.tiny, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}
