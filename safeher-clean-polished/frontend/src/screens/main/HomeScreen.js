import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import * as contactsApi from '../../api/contactsApi';
import * as incidentsApi from '../../api/incidentsApi';
import * as locationApi from '../../api/locationApi';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { AppHeader } from '../../components/AppHeader';
import { ActionCard } from '../../components/ActionCard';
import { SOSButton } from '../../components/SOSButton';
import { StatCard } from '../../components/StatCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { InfoBanner } from '../../components/InfoBanner';
import { StatusPill } from '../../components/StatusPill';
import { SectionHeader } from '../../components/SectionHeader';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getApiErrorMessage } from '../../api/client';
import { getGreeting, formatDateTime } from '../../utils/date';
import { formatCoordinates } from '../../utils/format';
import { ensureForegroundLocationPermission, getBestEffortLocation, getReadableAddress } from '../../services/locationService';
import { scheduleLocalNotification } from '../../services/notificationService';

export function HomeScreen({ navigation }) {
  const { user, sessionWarning } = useAuth();
  const { theme } = useTheme();
  const [contactsCount, setContactsCount] = useState(0);
  const [activeShare, setActiveShare] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [sosResult, setSosResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingSos, setSendingSos] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);
    setDashboardError('');
    try {
      const [contacts, share, incidents] = await Promise.all([
        contactsApi.getContacts(),
        locationApi.getActiveShare(),
        incidentsApi.getIncidents(),
      ]);
      setContactsCount(contacts.length);
      setActiveShare(share);
      setRecentIncidents(incidents.slice(0, 3));
    } catch (error) {
      setDashboardError(getApiErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const handleSos = async () => {
    if (contactsCount === 0) {
      Alert.alert('Add a trusted contact first', 'SOS alerts need at least one trusted contact so SafeHer knows who to notify.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add contact', onPress: () => navigation.navigate('Contacts') },
      ]);
      return;
    }

    try {
      setSendingSos(true);
      await ensureForegroundLocationPermission('Location permission is required to send SOS alerts and share your position.');

      const location = await getBestEffortLocation();
      const address = await getReadableAddress(location.coords);
      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        address: address || 'Address unavailable',
        message: 'Emergency SOS triggered from SafeHer.',
      };

      const response = await locationApi.triggerSos(payload);
      setSosResult(response);
      setActiveShare(response.share);

      await scheduleLocalNotification({
        title: 'SOS alert sent',
        body: `Notified ${response.deliveries.length} trusted contact(s).`,
        data: { type: 'sos-confirmation' },
        seconds: 1,
      });
    } catch (error) {
      Alert.alert('SOS failed', getApiErrorMessage(error));
    } finally {
      setSendingSos(false);
    }
  };

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  return (
    <ScreenWrapper
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboard} tintColor={theme.colors.primary} />}
    >
      <AppHeader
        eyebrow="Safety dashboard"
        title={`${getGreeting()}, ${firstName}`}
        subtitle="Your emergency actions are ready when you need them."
      />

      {sessionWarning ? <InfoBanner tone="warning" title="Limited connectivity" message={sessionWarning} style={{ marginBottom: theme.spacing.lg }} /> : null}
      {dashboardError ? <InfoBanner tone="warning" title="Dashboard partially unavailable" message={dashboardError} style={{ marginBottom: theme.spacing.lg }} /> : null}

      <Card elevated padding="xl" style={{ marginBottom: theme.spacing.xl, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -26, top: -24, width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.primarySoft }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
            <StatusPill label={activeShare ? 'Live sharing on' : 'Ready'} tone={activeShare ? 'success' : 'info'} icon={activeShare ? 'radio-outline' : 'shield-checkmark-outline'} />
            <Text style={{ color: theme.colors.text, fontSize: 25, fontWeight: '900', marginTop: theme.spacing.md, letterSpacing: -0.6 }}>
              Calm, quick protection in one place.
            </Text>
            <Text style={{ color: theme.colors.textMuted, lineHeight: 21, marginTop: 8 }}>
              Long-press SOS for verified intent. SafeHer will use your location, start sharing, and record notification attempts.
            </Text>
          </View>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="shield" size={27} color={theme.colors.primary} />
          </View>
        </View>
      </Card>

      <SOSButton onTrigger={handleSos} loading={sendingSos} disabled={sendingSos} />

      {sosResult ? (
        <InfoBanner
          tone={sosResult.deliveryWarning ? 'warning' : 'success'}
          title={sosResult.deliveryWarning ? 'SOS saved with delivery warning' : 'Latest SOS sent successfully'}
          message={sosResult.deliveryWarning || `Trusted contacts notified: ${sosResult.deliveries.length}. Coordinates: ${formatCoordinates(sosResult.sosEvent.latitude, sosResult.sosEvent.longitude)}.`}
          style={{ marginTop: theme.spacing.lg }}
        />
      ) : null}

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
        <StatCard label="Contacts" value={contactsCount} helper="SOS recipients" tone={contactsCount > 0 ? 'success' : 'danger'} />
        <StatCard label="Live share" value={activeShare ? 'ON' : 'OFF'} helper={activeShare ? 'Route is visible' : 'No active session'} tone={activeShare ? 'success' : 'neutral'} />
      </View>

      {activeShare ? (
        <Card elevated style={{ marginTop: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md }}>
            <View style={{ flex: 1 }}>
              <StatusPill label="Active session" tone="success" icon="radio-outline" />
              <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 17, marginTop: theme.spacing.md }}>Live location is being shared</Text>
              <Text style={{ color: theme.colors.textMuted, lineHeight: 20, marginTop: 7 }}>{activeShare.note || 'Emergency live sharing is active.'}</Text>
              <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>{formatCoordinates(activeShare.last_latitude, activeShare.last_longitude)}</Text>
            </View>
            <Ionicons name="location" size={24} color={theme.colors.success} />
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Quick actions" subtitle="Move fast without searching through menus." style={{ marginTop: theme.spacing.xl }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: theme.spacing.sm }}>
        <ActionCard icon="location-outline" title="Live share" subtitle="Start or stop route sharing" onPress={() => navigation.navigate('LiveShare')} tone="success" />
        <ActionCard icon="people-outline" title="Contacts" subtitle="Manage your safety network" onPress={() => navigation.navigate('Contacts')} />
        <ActionCard icon="call-outline" title="Fake call" subtitle="Create an exit moment" onPress={() => navigation.getParent()?.navigate('FakeCall')} tone="warning" />
        <ActionCard icon="medical-outline" title="Help centers" subtitle="Police and hospitals nearby" onPress={() => navigation.getParent()?.navigate('HelpCenters')} />
      </View>

      <SectionHeader
        title="Recent incidents"
        subtitle="Latest saved reports and evidence."
        style={{ marginTop: theme.spacing.xl }}
        action={<PrimaryButton title="Report" variant="secondary" onPress={() => navigation.getParent()?.navigate('ReportIncident')} style={{ paddingVertical: 10, minHeight: 42 }} />}
      />

      {recentIncidents.length === 0 ? (
        <Card>
          <Text style={{ color: theme.colors.text, fontWeight: '900' }}>No incidents reported yet</Text>
          <Text style={{ color: theme.colors.textMuted, marginTop: 8, lineHeight: 20 }}>Record suspicious activity, unsafe areas, harassment, or supporting image evidence when needed.</Text>
        </Card>
      ) : recentIncidents.map((incident) => (
        <Card key={incident.id} elevated style={{ marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
            <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 16, flex: 1 }}>{incident.title}</Text>
            <StatusPill label={incident.category} tone="warning" />
          </View>
          <Text style={{ color: theme.colors.textMuted, marginTop: 7, lineHeight: 20 }} numberOfLines={2}>{incident.description}</Text>
          <Text style={{ color: theme.colors.textSubtle, marginTop: 8 }}>{formatDateTime(incident.created_at)}</Text>
        </Card>
      ))}
    </ScreenWrapper>
  );
}
