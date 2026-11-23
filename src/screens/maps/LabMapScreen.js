import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import DeviceConditionBanner from '../../components/common/DeviceConditionBanner';
import LabActivitySheet from '../../components/maps/LabActivitySheet';
import { useApp } from '../../context/AppContext';
import useDevicePermissionsAndAlerts from '../../hooks/useDevicePermissionsAndAlerts';
import { subscribeToSessions } from '../../services/firestoreService';
import { subscribeToLabs } from '../../services/labService';
import { calculateDistanceMeters } from '../../services/locationService';

// Fallback import untuk MapView native jika tersedia
let MapView = null;
let Marker = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
  } catch (_error) {
    console.log('react-native-maps not available, using custom map view');
  }
}

export default function LabMapScreen() {
  const router = useRouter();
  const { tema } = useApp();
  const [labs, setLabs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Hook izin dan kondisi perangkat dengan live location watcher (FT-14)
  const {
    locationPermission,
    notificationPermission,
    gpsEnabled,
    coordinates,
    isOnline,
    loading: isLoadingDevice,
    error: deviceError,
    notificationError,
    requestLocationPermission,
    requestNotificationPermission,
    refreshDeviceStatus,
    openSettings,
  } = useDevicePermissionsAndAlerts({ watchLocation: true });

  // Dengarkan daftar lab secara real-time
  useEffect(() => {
    const unsubscribeLabs = subscribeToLabs(
      (updatedLabs) => {
        setLabs(updatedLabs);
        setIsLoadingData(false);
      },
      (err) => {
        console.error('Error subscribeToLabs in LabMapScreen:', err);
        setIsLoadingData(false);
      },
      { activeOnly: true }
    );

    const unsubscribeSessions = subscribeToSessions(
      (updatedSessions) => {
        setSessions(updatedSessions);
      },
      (err) => {
        console.error('Error subscribeToSessions in LabMapScreen:', err);
      }
    );

    return () => {
      unsubscribeLabs();
      unsubscribeSessions();
    };
  }, []);

  const selectedLab = useMemo(
    () => labs.find((lab) => lab.id === selectedLabId) || null,
    [labs, selectedLabId]
  );

  // Filter sesi berlangsung dan sesi berikutnya untuk lab terpilih (FT-12)
  const { currentSession, nextSession } = useMemo(() => {
    if (!selectedLab) return { currentSession: null, nextSession: null };

    const labSessions = sessions.filter(
      (s) => s.labId === selectedLab.id || s.ruangLab === selectedLab.name
    );

    const active =
      labSessions.find(
        (s) => s.status === 'open' || s.statusSesi === 'DIBUKA'
      ) || null;

    const upcoming =
      labSessions.find(
        (s) =>
          s.id !== active?.id &&
          (s.statusSesi === 'DITUTUP' || s.status === 'closed' || s.status === 'upcoming')
      ) || null;

    return { currentSession: active, nextSession: upcoming };
  }, [sessions, selectedLab]);

  // Hitung jarak pengguna ke masing-masing lab
  const labsWithDistance = useMemo(() => {
    return labs.map((lab) => {
      let distance = null;
      if (
        coordinates &&
        Number.isFinite(coordinates.latitude) &&
        Number.isFinite(coordinates.longitude) &&
        Number.isFinite(Number(lab.latitude)) &&
        Number.isFinite(Number(lab.longitude))
      ) {
        try {
          distance = calculateDistanceMeters(coordinates, {
            latitude: Number(lab.latitude),
            longitude: Number(lab.longitude),
          });
        } catch (_error) {}
      }
      return { ...lab, distanceMeters: distance };
    });
  }, [labs, coordinates]);

  const defaultRegion = useMemo(() => {
    if (coordinates && Number.isFinite(coordinates.latitude)) {
      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }
    const firstLab = labs[0];
    if (firstLab && Number.isFinite(Number(firstLab.latitude))) {
      return {
        latitude: Number(firstLab.latitude),
        longitude: Number(firstLab.longitude),
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }
    return {
      latitude: -7.052,
      longitude: 110.435,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [coordinates, labs]);

  return (
    <ScreenContainer showHeader={false}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={tema.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={[styles.title, { color: tema.textPrimary }]}>Peta & Lokasi Lab</Text>
          <Text style={[styles.subtitle, { color: tema.textSecondary }]}>
            SRS-FT-12 · Monitor sebaran lab & sesi aktif
          </Text>
        </View>
        <TouchableOpacity onPress={refreshDeviceStatus} style={styles.refreshIconBtn}>
          <Ionicons name="refresh" size={20} color={tema.accent} />
        </TouchableOpacity>
      </View>

      {/* Device Condition Banner (FT-14) */}
      <DeviceConditionBanner
        locationPermission={locationPermission}
        notificationPermission={notificationPermission}
        gpsEnabled={gpsEnabled}
        coordinates={coordinates}
        isOnline={isOnline}
        loading={isLoadingDevice}
        error={deviceError}
        notificationError={notificationError}
        requestLocationPermission={requestLocationPermission}
        requestNotificationPermission={requestNotificationPermission}
        openSettings={openSettings}
      />

      {/* Map Area */}
      {MapView && Platform.OS !== 'web' ? (
        <View style={styles.mapContainer}>
          <MapView style={styles.map} initialRegion={defaultRegion} showsUserLocation showsMyLocationButton>
            {coordinates && (
              <Marker
                coordinate={{ latitude: coordinates.latitude, longitude: coordinates.longitude }}
                title="Posisi Anda"
                pinColor="#2563EB"
              />
            )}
            {labs.map((lab) => {
              if (!Number.isFinite(Number(lab.latitude)) || !Number.isFinite(Number(lab.longitude))) return null;
              return (
                <Marker
                  key={lab.id}
                  coordinate={{ latitude: Number(lab.latitude), longitude: Number(lab.longitude) }}
                  title={lab.name}
                  description={`Radius: ${lab.radiusMeters || 50} m`}
                  onPress={() => setSelectedLabId(lab.id)}
                  pinColor="#059669"
                />
              );
            })}
          </MapView>
        </View>
      ) : (
        /* Visual Interactive Map Representation for Web / Non-native environments */
        <View style={[styles.visualMapCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <View style={styles.visualMapHeader}>
            <Ionicons name="map-outline" size={20} color={tema.accent} />
            <Text style={[styles.visualMapTitle, { color: tema.textPrimary }]}>
              Radar Laboratorium Aktif
            </Text>
          </View>
          <Text style={[styles.userCoordText, { color: tema.textSecondary }]}>
            📍 Posisi Anda:{' '}
            {coordinates && Number.isFinite(coordinates.latitude)
              ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
              : 'Menunggu GPS...'}
          </Text>
        </View>
      )}

      {/* Daftar Marker Lab Terdaftar */}
      <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>Pilih Titik Laboratorium</Text>
      {isLoadingData ? (
        <ActivityIndicator color={tema.accent} style={{ marginVertical: 20 }} />
      ) : labsWithDistance.length === 0 ? (
        <Text style={[styles.emptyText, { color: tema.textSecondary }]}>Belum ada data laboratorium aktif.</Text>
      ) : (
        <ScrollView style={styles.labList} showsVerticalScrollIndicator={false}>
          {labsWithDistance.map((lab) => {
            const isSelected = lab.id === selectedLabId;
            return (
              <TouchableOpacity
                key={lab.id}
                style={[
                  styles.labItem,
                  {
                    backgroundColor: tema.surface,
                    borderColor: isSelected ? tema.accent : tema.border,
                  },
                ]}
                onPress={() => setSelectedLabId(lab.id)}
              >
                <View style={styles.markerBadge}>
                  <Ionicons name="location" size={20} color={isSelected ? tema.accent : '#059669'} />
                </View>
                <View style={styles.labItemText}>
                  <Text style={[styles.labItemName, { color: tema.textPrimary }]}>{lab.name}</Text>
                  <Text style={[styles.labItemDetail, { color: tema.textSecondary }]}>
                    {lab.code || 'LAB'} · Radius {lab.radiusMeters || 50} m
                    {Number.isFinite(lab.distanceMeters) ? ` · Jarak ~${Math.round(lab.distanceMeters)} m` : ''}
                  </Text>
                </View>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'chevron-forward'}
                  size={18}
                  color={isSelected ? tema.accent : tema.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Lab Activity Sheet (FT-12) */}
      {selectedLab ? (
        <View style={styles.sheetWrapper}>
          <LabActivitySheet
            lab={selectedLab}
            currentSession={currentSession}
            nextSession={nextSession}
            onClose={() => setSelectedLabId(null)}
          />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  backButton: { padding: 4 },
  topBarText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 2 },
  refreshIconBtn: { padding: 8 },
  mapContainer: { height: 220, borderRadius: 14, overflow: 'hidden', marginVertical: 10 },
  map: { width: '100%', height: '100%' },
  visualMapCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginVertical: 8, gap: 6 },
  visualMapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  visualMapTitle: { fontSize: 14, fontWeight: '700' },
  userCoordText: { fontSize: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginTop: 10, marginBottom: 8 },
  labList: { maxHeight: 200 },
  labItem: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  markerBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center' },
  labItemText: { flex: 1 },
  labItemName: { fontSize: 13, fontWeight: '700' },
  labItemDetail: { fontSize: 11, marginTop: 2 },
  emptyText: { textAlign: 'center', paddingVertical: 16, fontSize: 12 },
  sheetWrapper: { marginTop: 12 },
});
