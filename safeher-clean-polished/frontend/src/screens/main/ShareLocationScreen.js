import React, { useCallback, useState } from 'react';
import { Alert, Linking, Platform, Pressable, RefreshControl, Switch, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import * as locationApi from '../../api/locationApi';
import { getApiErrorMessage } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Card } from '../../components/Card';
import { StatusPill } from '../../components/StatusPill';
import { InfoBanner } from '../../components/InfoBanner';
import { PermissionPrimer } from '../../components/PermissionPrimer';
import { useTheme } from '../../hooks/useTheme';
import {
  disableBackgroundTracking,
  enableBackgroundTracking,
  ensureForegroundLocationPermission,
  getBackgroundTrackingState,
  getBestEffortLocation,
  toLocationPayload,
} from '../../services/locationService';
import { formatCoordinates } from '../../utils/format';
import { formatDateTime } from '../../utils/date';
import { getCachedValue, removeCachedValue, setCachedValue } from '../../utils/cache';
import { STORAGE_KEYS } from '../../constants/storage';

const DEFAULT_NOTE = 'Share my live location with trusted contacts.';

export function ShareLocationScreen() {
  const { theme } = useTheme();
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [activeShare, setActiveShare] = useState(null);
  const [latestLocation, setLatestLocation] = useState(null);
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadShareState = useCallback(async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const cachedShare = await getCachedValue(STORAGE_KEYS.activeShare, null);
      if (cachedShare) {
        setActiveShare(cachedShare);
        setNote(cachedShare.note || DEFAULT_NOTE);
      }

      const [share, location, backgroundState] = await Promise.all([
        locationApi.getActiveShare(),
        locationApi.getLatestLocation(),
        getBackgroundTrackingState(),
      ]);

      setActiveShare(share);
      setLatestLocation(location);
      setBackgroundEnabled(backgroundState);
      if (share) {
        setNote(share.note || DEFAULT_NOTE);
        await setCachedValue(STORAGE_KEYS.activeShare, share);
      } else {
        await removeCachedValue(STORAGE_KEYS.activeShare);
      }
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadShareState();
    }, [loadShareState])
  );

  const refreshLocation = async () => {
    try {
      setLoading(true);
      setStatusMessage('');
      await ensureForegroundLocationPermission('Location permission is required to refresh your live position.');

      const location = await getBestEffortLocation();
      const payload = toLocationPayload(location, 'manual-refresh');

      const savedLocation = await locationApi.postCurrentLocation(payload);
      setLatestLocation(savedLocation);

      if (activeShare) {
        const updatedShare = await locationApi.updateShare(payload);
        setActiveShare(updatedShare);
        await setCachedValue(STORAGE_KEYS.activeShare, updatedShare);
      }
      setStatusMessage('Location updated successfully.');
    } catch (error) {
      Alert.alert('Refresh failed', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const startSharing = async () => {
    try {
      setLoading(true);
      setStatusMessage('');
      await ensureForegroundLocationPermission('Location permission is required to start live sharing.');

      const location = await getBestEffortLocation();
      const payload = {
        ...toLocationPayload(location, 'share-start'),
        note,
      };

      const share = await locationApi.startShare(payload);
      setActiveShare(share);
      setLatestLocation({
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy,
        created_at: new Date().toISOString(),
      });
      await setCachedValue(STORAGE_KEYS.activeShare, share);
      setStatusMessage('Live sharing is active. Copy the private link for trusted people only.');
    } catch (error) {
      Alert.alert('Start failed', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const confirmStopSharing = () => {
    Alert.alert('Stop live sharing?', 'Trusted contacts with the link will no longer see live updates after you stop this session.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop sharing', style: 'destructive', onPress: stopSharing },
    ]);
  };

  const stopSharing = async () => {
    try {
      setLoading(true);
      await locationApi.stopShare();
      await disableBackgroundTracking();
      setBackgroundEnabled(false);
      setActiveShare(null);
      await removeCachedValue(STORAGE_KEYS.activeShare);
      setStatusMessage('Live sharing has been stopped.');
    } catch (error) {
      Alert.alert('Stop failed', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const toggleBackground = async (value) => {
    if (value && !activeShare) {
      Alert.alert('Start sharing first', 'Background tracking can only run while a live share session is active.');
      return;
    }

    try {
      if (value) {
        await enableBackgroundTracking();
      } else {
        await disableBackgroundTracking();
      }
      setBackgroundEnabled(value);
    } catch (error) {
      Alert.alert('Background tracking', getApiErrorMessage(error));
      setBackgroundEnabled(false);
    }
  };

  const copyShareLink = async () => {
    if (!activeShare?.shareUrl) return;
    await Clipboard.setStringAsync(activeShare.shareUrl);
    setStatusMessage('Live sharing link copied to clipboard.');
  };

  const openLink = () => {
    if (activeShare?.shareUrl) {
      Linking.openURL(activeShare.shareUrl);
    }
  };

  return (
    <ScreenWrapper refreshControl={<RefreshControl refreshing={loading} onRefresh={loadShareState} tintColor={theme.colors.primary} />}>
      <AppHeader title="Live location" subtitle="Share your route with trusted contacts when you want visibility." />

      <PermissionPrimer
        icon="location-outline"
        title="Location permission is requested only for sharing"
        body="SafeHer uses your position to update the active share link and help contacts understand where you are."
        points={['You control when sharing starts and stops.', 'The public link is private by token and should be shared only with trusted people.', 'Background updates require a development or production build for best reliability.']}
      />

      {statusMessage ? (
        <InfoBanner tone={statusMessage.includes('success') || statusMessage.includes('active') || statusMessage.includes('copied') || statusMessage.includes('stopped') ? 'success' : 'warning'} message={statusMessage} style={{ marginBottom: theme.spacing.lg }} />
      ) : null}

      <Card elevated>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <StatusPill label={activeShare ? 'Sharing active' : 'Not sharing'} tone={activeShare ? 'success' : 'neutral'} icon={activeShare ? 'radio-outline' : 'location-outline'} />
            <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 18, marginTop: theme.spacing.md }}>Current location</Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 8, lineHeight: 20 }}>
              {latestLocation ? formatCoordinates(latestLocation.latitude, latestLocation.longitude) : 'No location captured yet.'}
            </Text>
            <Text style={{ color: theme.colors.textSubtle, marginTop: 6 }}>
              Last updated: {latestLocation?.created_at ? formatDateTime(latestLocation.created_at) : 'Never'}
            </Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: activeShare ? theme.colors.successSoft : theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={activeShare ? 'navigate' : 'navigate-outline'} size={23} color={activeShare ? theme.colors.success : theme.colors.textMuted} />
          </View>
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        <FormInput
          label="Sharing note"
          value={note}
          onChangeText={setNote}
          placeholder="I am going home, follow my route if needed."
          multiline
          helper="This note appears with your share session. Avoid adding private details you do not want viewers to see."
        />
      </View>

      <PrimaryButton title="Refresh location now" variant="secondary" onPress={refreshLocation} loading={loading && !activeShare} />

      {!activeShare ? (
        <PrimaryButton title="Start live sharing" onPress={startSharing} loading={loading} style={{ marginTop: theme.spacing.md }} />
      ) : (
        <View style={{ marginTop: theme.spacing.md }}>
          <Card style={{ backgroundColor: theme.colors.successSoft, borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.success, fontWeight: '900' }}>Private share link active</Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 8, lineHeight: 20 }}>{activeShare.note}</Text>
            <Text style={{ color: theme.colors.text, marginTop: 8, fontWeight: '700' }} numberOfLines={2}>{activeShare.shareUrl}</Text>
          </Card>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
            <PrimaryButton title="Copy link" variant="secondary" onPress={copyShareLink} style={{ flex: 1 }} />
            <PrimaryButton title="Open" variant="secondary" onPress={openLink} style={{ flex: 1 }} />
          </View>
          <PrimaryButton title="Stop live sharing" variant="danger" onPress={confirmStopSharing} loading={loading} style={{ marginTop: theme.spacing.md }} />
        </View>
      )}

      <Card elevated style={{ marginTop: theme.spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
            <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 17 }}>Background tracking</Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
              Keep sending updates while minimized. Expo Go may limit this; production builds are more reliable.
            </Text>
            <Text style={{ color: theme.colors.textSubtle, marginTop: 8 }}>Platform: {Platform.OS}</Text>
          </View>
          <Switch value={backgroundEnabled} onValueChange={toggleBackground} disabled={!activeShare} />
        </View>
      </Card>
    </ScreenWrapper>
  );
}
