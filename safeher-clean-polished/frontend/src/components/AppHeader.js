import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';

export function AppHeader({ title, subtitle, eyebrow, onBack, rightElement = null }) {
  const { theme } = useTheme();

  return (
    <View style={{ marginBottom: theme.spacing.xl, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: pressed ? theme.colors.surfaceAlt : theme.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
            })}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </Pressable>
        ) : null}

        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <Text style={{ color: theme.colors.primary, fontWeight: '900', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              {eyebrow}
            </Text>
          ) : null}
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.title, fontWeight: '900', letterSpacing: -0.7 }}>{title}</Text>
          {subtitle ? (
            <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 21 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {rightElement ? <View style={{ marginLeft: theme.spacing.md }}>{rightElement}</View> : null}
    </View>
  );
}
