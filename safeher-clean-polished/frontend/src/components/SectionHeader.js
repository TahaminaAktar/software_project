import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';

export function SectionHeader({ title, subtitle, action = null, style }) {
  const { theme } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: theme.spacing.md }, style]}>
      <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.headline, fontWeight: '900', letterSpacing: -0.2 }}>{title}</Text>
        {subtitle ? <Text style={{ color: theme.colors.textMuted, marginTop: 4, lineHeight: 20 }}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}
