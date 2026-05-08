import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon = null,
  variant = 'primary',
  style,
  accessibilityLabel,
}) {
  const { theme } = useTheme();

  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const backgroundColor = isGhost ? 'transparent' : isSecondary ? theme.colors.surfaceAlt : isDanger ? theme.colors.danger : theme.colors.primary;
  const pressedColor = isGhost ? theme.colors.surfaceAlt : isSecondary ? theme.colors.primarySoft : isDanger ? theme.colors.primaryPressed : theme.colors.primaryPressed;
  const textColor = isGhost ? theme.colors.primary : isSecondary ? theme.colors.text : theme.colors.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        {
          opacity: disabled ? 0.55 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          backgroundColor: pressed ? pressedColor : backgroundColor,
          borderRadius: theme.radius.md,
          paddingVertical: 15,
          paddingHorizontal: 18,
          minHeight: 52,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          borderWidth: isSecondary || isGhost ? 1 : 0,
          borderColor: isGhost ? 'transparent' : theme.colors.border,
        },
        !isSecondary && !isGhost ? theme.softShadow : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {icon}
          <Text style={{ color: textColor, fontSize: 15, fontWeight: '900', letterSpacing: 0.1 }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
