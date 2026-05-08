import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import * as helpCentersApi from '../../api/helpCentersApi';
import { getApiErrorMessage } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { HelpCenterCard } from '../../components/HelpCenterCard';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { InfoBanner } from '../../components/InfoBanner';
import { InlineLoader } from '../../components/InlineLoader';
import { useTheme } from '../../hooks/useTheme';
import { getBestEffortLocation, requestForegroundLocationPermission } from '../../services/locationService';
import { getCachedValue, setCachedValue } from '../../utils/cache';
import { STORAGE_KEYS } from '../../constants/storage';

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Police', value: 'police' },
  { label: 'Hospital', value: 'hospital' },
];

export function HelpCentersScreen({ navigation }) {
  const { theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [usedLocation, setUsedLocation] = useState(false);

  const loadCenters = useCallback(async (type = selectedFilter) => {
    setLoading(true);
    setLoadError('');
    try {
      const cachedCenters = await getCachedValue(STORAGE_KEYS.cachedHelpCenters, []);
      if (cachedCenters.length > 0) {
        setCenters(type === 'all' ? cachedCenters : cachedCenters.filter((center) => center.type === type));
      }

      let location = null;
      try {
        const permission = await requestForegroundLocationPermission();
        if (permission.status === 'granted') {
          location = await getBestEffortLocation();
        }
      } catch (_locationError) {
        location = null;
      }

      setUsedLocation(Boolean(location?.coords));
      const nextCenters = await helpCentersApi.getHelpCenters({
        type,
        latitude: location?.coords?.latitude,
        longitude: location?.coords?.longitude,
      });
      setCenters(nextCenters);
      if (type === 'all') {
        await setCachedValue(STORAGE_KEYS.cachedHelpCenters, nextCenters);
      }
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  useFocusEffect(
    useCallback(() => {
      loadCenters();
    }, [loadCenters])
  );

  const handleFilterPress = async (value) => {
    setSelectedFilter(value);
    await loadCenters(value);
  };

  return (
    <ScreenWrapper refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadCenters(selectedFilter)} tintColor={theme.colors.primary} />}>
      <AppHeader title="Nearby help centers" subtitle="Police stations and hospitals sorted by approximate distance when location is available." onBack={() => navigation.goBack()} />

      <InfoBanner
        tone={usedLocation ? 'success' : 'info'}
        title={usedLocation ? 'Sorted by your area' : 'Location improves sorting'}
        message={usedLocation ? 'SafeHer used your approximate location to sort support options.' : 'You can still view seeded help centers without location permission.'}
        style={{ marginBottom: theme.spacing.lg }}
      />

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: theme.spacing.lg }}>
        {filters.map((filter) => {
          const selected = filter.value === selectedFilter;
          return (
            <Pressable
              key={filter.value}
              onPress={() => handleFilterPress(filter.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: theme.radius.pill,
                backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                borderWidth: 1,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
              }}
            >
              <Text style={{ color: selected ? theme.colors.white : theme.colors.text, fontWeight: '800' }}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loadError ? <InfoBanner tone="warning" title="Unable to refresh help centers" message={loadError} style={{ marginBottom: theme.spacing.lg }} /> : null}
      {loading && centers.length === 0 ? <InlineLoader label="Loading help centers..." /> : null}

      {centers.length === 0 && !loading ? (
        <EmptyState icon="medical-outline" title="No help centers found" message="Try again with a different filter or after enabling location permission." />
      ) : centers.map((center) => <HelpCenterCard key={center.id} center={center} />)}
    </ScreenWrapper>
  );
}
