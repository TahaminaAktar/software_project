import React, { useCallback, useState } from 'react';
import { Alert, Image, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import * as incidentsApi from '../../api/incidentsApi';
import { getApiErrorMessage } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Card } from '../../components/Card';
import { StatusPill } from '../../components/StatusPill';
import { InfoBanner } from '../../components/InfoBanner';
import { InlineLoader } from '../../components/InlineLoader';
import { useTheme } from '../../hooks/useTheme';
import { getAssetUrl, formatCoordinates } from '../../utils/format';
import { formatDateTime } from '../../utils/date';

export function IncidentsScreen({ navigation }) {
  const { theme } = useTheme();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const nextIncidents = await incidentsApi.getIncidents();
      setIncidents(nextIncidents);
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadIncidents();
    }, [loadIncidents])
  );

  return (
    <ScreenWrapper refreshControl={<RefreshControl refreshing={loading} onRefresh={loadIncidents} tintColor={theme.colors.primary} />}>
      <AppHeader title="Incidents" subtitle="Save clear reports and image evidence for follow-up." />
      <PrimaryButton title="Report incident" onPress={() => navigation.getParent()?.navigate('ReportIncident')} />

      {loadError ? <InfoBanner tone="warning" title="Unable to load incident history" message={loadError} style={{ marginTop: theme.spacing.lg }} /> : null}
      {loading && incidents.length === 0 ? <InlineLoader label="Loading incidents..." /> : null}

      {incidents.length === 0 && !loading ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <EmptyState
            icon="warning-outline"
            title="No incidents yet"
            message="Record harassment, suspicious activity, unsafe places, or image evidence in a structured way."
            actionLabel="Create report"
            onAction={() => navigation.getParent()?.navigate('ReportIncident')}
          />
        </View>
      ) : (
        <View style={{ marginTop: theme.spacing.xl }}>
          {incidents.map((incident) => (
            <Card key={incident.id} elevated style={{ marginBottom: theme.spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md }}>
                <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 18, flex: 1 }}>{incident.title}</Text>
                <StatusPill label={incident.category} tone="warning" />
              </View>
              <Text style={{ color: theme.colors.textMuted, marginTop: 9, lineHeight: 21 }}>{incident.description}</Text>
              {incident.image_url ? (
                <Image source={{ uri: getAssetUrl(incident.image_url) }} style={{ width: '100%', height: 180, borderRadius: theme.radius.md, marginTop: theme.spacing.md, backgroundColor: theme.colors.surfaceAlt }} />
              ) : null}
              <View style={{ marginTop: theme.spacing.md, gap: 5 }}>
                <Text style={{ color: theme.colors.textSubtle }}>Reported: {formatDateTime(incident.created_at)}</Text>
                {incident.latitude && incident.longitude ? <Text style={{ color: theme.colors.textSubtle }}>Location: {formatCoordinates(incident.latitude, incident.longitude)}</Text> : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}
