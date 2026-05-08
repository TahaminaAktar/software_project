import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import * as notificationsApi from '../../api/notificationsApi';
import { getApiErrorMessage } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { SettingRow } from '../../components/SettingRow';
import { Card } from '../../components/Card';
import { StatusPill } from '../../components/StatusPill';
import { InfoBanner } from '../../components/InfoBanner';
import { SectionHeader } from '../../components/SectionHeader';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { formatDateTime } from '../../utils/date';

const themeOptions = ['light', 'dark', 'system'];

export function ProfileScreen() {
  const { user, logout, updateSettings, isSubmitting, sessionWarning } = useAuth();
  const { theme, themePreference, setThemePreference } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const initials = useMemo(
    () =>
      (user?.fullName || 'U')
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    [user?.fullName]
  );

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const nextNotifications = await notificationsApi.getNotifications();
      setNotifications(nextNotifications.slice(0, 5));
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const changeTheme = async (value) => {
    try {
      await setThemePreference(value);
      await updateSettings({ themePreference: value });
    } catch (error) {
      Alert.alert('Theme update failed', getApiErrorMessage(error));
    }
  };

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to log in again to access emergency tools linked to this account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScreenWrapper refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNotifications} tintColor={theme.colors.primary} />}>
      <AppHeader title="Profile & settings" subtitle="Manage account identity, appearance, and alert records." />

      {sessionWarning ? <InfoBanner tone="warning" message={sessionWarning} style={{ marginBottom: theme.spacing.lg }} /> : null}

      <Card elevated padding="xl">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: theme.colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.lg,
            }}
          >
            <Text style={{ color: theme.colors.primary, fontWeight: '900', fontSize: 25 }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 22 }}>{user?.fullName}</Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 5 }}>{user?.email}</Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{user?.phone}</Text>
          </View>
        </View>
      </Card>

      <SectionHeader title="Appearance" subtitle="Use a comfortable visual mode in every safety context." style={{ marginTop: theme.spacing.xl }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {themeOptions.map((option) => {
          const selected = themePreference === option;
          return (
            <Pressable
              key={option}
              onPress={() => changeTheme(option)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: theme.radius.pill,
                backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                borderWidth: 1,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: selected ? theme.colors.white : theme.colors.text, fontWeight: '900', textTransform: 'capitalize' }}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <SettingRow
          icon="shield-checkmark-outline"
          title="Privacy & permissions"
          value="Location and photo access are requested only at the moment an existing safety flow needs them."
          onPress={() => Alert.alert('Privacy & permissions', 'SafeHer requests location for SOS, live sharing, nearby help centers, and optional incident context. Photo access is used only when you attach image evidence.')}
        />
        <SettingRow
          icon="notifications-outline"
          title="Alert records"
          value="Safety alert records are stored in the backend. Native delivery providers can be connected for public launch without changing the SOS flow."
          onPress={() => Alert.alert('Alert records', 'SafeHer records SOS confirmations and trusted-contact delivery states. Public launch delivery should use approved native/SMS/email providers configured on the backend.')}
        />
        <SettingRow
          icon="refresh-outline"
          title="Sync appearance"
          value={isSubmitting ? 'Saving your preference...' : 'Save the selected theme to your backend profile.'}
          onPress={() => changeTheme(themePreference)}
        />
      </View>

      <SectionHeader title="Recent alerts" subtitle="Latest backend notification records for this account." style={{ marginTop: theme.spacing.lg }} />
      {loadError ? <InfoBanner tone="warning" message={loadError} style={{ marginBottom: theme.spacing.md }} /> : null}
      {notifications.length === 0 ? (
        <Card>
          <Text style={{ color: theme.colors.text, fontWeight: '900' }}>No alert records yet</Text>
          <Text style={{ color: theme.colors.textMuted, marginTop: 8, lineHeight: 20 }}>SOS confirmations and trusted-contact alert records will appear here.</Text>
        </Card>
      ) : notifications.map((item) => (
        <Card key={item.id} style={{ marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
            <Text style={{ color: theme.colors.text, fontWeight: '900', flex: 1 }}>{item.title}</Text>
            <StatusPill label={item.channel} tone={item.channel === 'sos' ? 'danger' : 'info'} />
          </View>
          <Text style={{ color: theme.colors.textMuted, marginTop: 7, lineHeight: 20 }}>{item.body}</Text>
          <Text style={{ color: theme.colors.textSubtle, marginTop: 8 }}>{formatDateTime(item.created_at)}</Text>
        </Card>
      ))}

      <PrimaryButton title="Log out" variant="secondary" onPress={confirmLogout} style={{ marginTop: theme.spacing.md }} />
    </ScreenWrapper>
  );
}
