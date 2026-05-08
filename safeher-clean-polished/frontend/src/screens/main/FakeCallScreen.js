import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppHeader } from '../../components/AppHeader';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Card } from '../../components/Card';
import { InfoBanner } from '../../components/InfoBanner';
import { StatusPill } from '../../components/StatusPill';
import { useTheme } from '../../hooks/useTheme';
import { scheduleLocalNotification } from '../../services/notificationService';

export function FakeCallScreen({ navigation }) {
  const { theme } = useTheme();
  const [callerName, setCallerName] = useState('Mom');
  const [delaySeconds, setDelaySeconds] = useState('10');
  const [countdown, setCountdown] = useState(null);
  const [ringing, setRinging] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCountdown((current) => {
        if (current === null) return null;
        if (current <= 1) {
          clearInterval(interval);
          setRinging(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);


  const startFakeCall = async () => {
    const seconds = Math.max(3, Math.min(120, Number(delaySeconds) || 10));
    setCountdown(seconds);
    setRinging(false);
    setCallAccepted(false);

    await Haptics.selectionAsync();
    await scheduleLocalNotification({
      title: callerName || 'Incoming call',
      body: 'Incoming call',
      data: { type: 'fake-call' },
      seconds,
    });
  };

  const cancelFakeCall = () => {
    setCountdown(null);
    setRinging(false);
    setCallAccepted(false);
  };

  const acceptCall = () => {
    setCallAccepted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (ringing) {
    return (
      <ScreenWrapper scrollable={false} contentContainerStyle={{ justifyContent: 'space-between', paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}>
        <View style={{ alignItems: 'center', marginTop: theme.spacing.xxxl }}>
          <StatusPill label={callAccepted ? 'Connected' : 'Incoming call'} tone={callAccepted ? 'success' : 'info'} icon="call-outline" />
          <View style={{ width: 128, height: 128, borderRadius: 64, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.xl }}>
            <Ionicons name="call" size={48} color={theme.colors.primary} />
          </View>
          <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.xl, fontWeight: '700' }}>{callAccepted ? 'Call in progress' : 'Incoming call'}</Text>
          <Text style={{ color: theme.colors.text, fontSize: 36, fontWeight: '900', marginTop: 8, textAlign: 'center' }}>{callerName || 'Mom'}</Text>
          {callAccepted ? <Text style={{ color: theme.colors.success, marginTop: 16, fontWeight: '900' }}>00:01</Text> : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Pressable onPress={cancelFakeCall} accessibilityRole="button" style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
              <Ionicons name={callAccepted ? 'call-outline' : 'close'} size={28} color={theme.colors.danger} />
            </View>
            <Text style={{ color: theme.colors.textMuted, marginTop: 8, fontWeight: '800' }}>{callAccepted ? 'End' : 'Decline'}</Text>
          </Pressable>
          <Pressable onPress={callAccepted ? undefined : acceptCall} disabled={callAccepted} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', opacity: callAccepted ? 0.5 : 1 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.success, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="call" size={28} color={theme.colors.white} />
            </View>
            <Text style={{ color: theme.colors.textMuted, marginTop: 8, fontWeight: '800' }}>{callAccepted ? 'Talking' : 'Accept'}</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper keyboardAware>
      <AppHeader title="Fake call" subtitle="Create a believable interruption to help you leave uncomfortable situations." onBack={() => navigation.goBack()} />

      <InfoBanner
        tone="info"
        title="Discreet escape support"
        message="The fake call appears inside SafeHer. Keep your phone unlocked and visible if you plan to use this as an exit cue."
        style={{ marginBottom: theme.spacing.lg }}
      />

      <Card elevated>
        <FormInput label="Caller name" value={callerName} onChangeText={setCallerName} placeholder="Mom" />
        <FormInput label="Delay in seconds" value={delaySeconds} onChangeText={setDelaySeconds} placeholder="10" keyboardType="number-pad" helper="Minimum 3 seconds, maximum 120 seconds." />
        <PrimaryButton title="Start fake call" onPress={startFakeCall} />
      </Card>

      {countdown !== null ? (
        <InfoBanner
          tone="warning"
          title={`Incoming fake call in ${countdown} second(s)`}
          message="Stay on this screen. The in-app call screen will appear automatically."
          style={{ marginTop: theme.spacing.lg }}
        />
      ) : null}

      {countdown !== null ? <PrimaryButton title="Cancel sequence" variant="secondary" onPress={() => { cancelFakeCall(); Alert.alert('Canceled', 'The fake call sequence was canceled.'); }} style={{ marginTop: theme.spacing.md }} /> : null}
    </ScreenWrapper>
  );
}
