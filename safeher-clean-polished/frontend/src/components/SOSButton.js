import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';

export function SOSButton({ onTrigger, disabled = false, loading = false }) {
  const { theme } = useTheme();
  const pulseScale = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [isPressing, setIsPressing] = useState(false);

  useEffect(() => {
    if (isPressing) {
      progress.setValue(0);
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseScale, { toValue: 1.05, duration: 520, useNativeDriver: true }),
            Animated.timing(pulseScale, { toValue: 1, duration: 520, useNativeDriver: true }),
          ])
        ),
        Animated.timing(progress, { toValue: 1, duration: 1800, useNativeDriver: false }),
      ]).start();
    } else {
      pulseScale.stopAnimation();
      progress.stopAnimation();
      Animated.spring(pulseScale, { toValue: 1, useNativeDriver: true }).start();
      Animated.timing(progress, { toValue: 0, duration: 160, useNativeDriver: false }).start();
    }
  }, [isPressing, progress, pulseScale]);

  const handleLongPress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsPressing(false);
    onTrigger?.();
  };

  const ringWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View
        style={{
          transform: [{ scale: pulseScale }],
          width: 238,
          height: 238,
          borderRadius: 119,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.primarySoft,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View style={{ position: 'absolute', width: 206, height: 206, borderRadius: 103, backgroundColor: theme.colors.cardOverlay }} />
        <Pressable
          disabled={disabled || loading}
          onPressIn={() => setIsPressing(true)}
          onPressOut={() => setIsPressing(false)}
          onLongPress={handleLongPress}
          delayLongPress={1800}
          accessibilityRole="button"
          accessibilityLabel="Emergency SOS. Long press to send alert."
          accessibilityHint="Hold for two seconds to alert trusted contacts and start live location sharing."
          accessibilityState={{ disabled: disabled || loading, busy: loading }}
          style={({ pressed }) => ({
            width: 178,
            height: 178,
            borderRadius: 89,
            backgroundColor: pressed ? theme.colors.primaryPressed : theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            ...theme.shadow,
          })}
        >
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, backgroundColor: 'rgba(255,255,255,0.24)' }}>
            <Animated.View style={{ width: ringWidth, height: 8, backgroundColor: theme.colors.white }} />
          </View>
          <Ionicons name="shield-checkmark" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={{ color: theme.colors.white, fontSize: 52, fontWeight: '900', letterSpacing: -1, marginTop: 2 }}>SOS</Text>
          <Text style={{ color: 'rgba(255,255,255,0.92)', marginTop: 4, fontWeight: '900' }}>
            {loading ? 'Sending...' : isPressing ? 'Keep holding' : 'Hold 2 sec'}
          </Text>
        </Pressable>
      </Animated.View>
      <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 14, lineHeight: 20, maxWidth: 320 }}>
        Long press to send an emergency alert, start live sharing, and record the SOS event.
      </Text>
    </View>
  );
}
