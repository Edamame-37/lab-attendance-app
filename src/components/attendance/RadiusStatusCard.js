import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

const getStatusPresentation = ({ isLoading, error, location, distanceMeters, radiusMeters }) => {
  if (isLoading) {
    return { icon: 'locate-outline', label: 'Mengambil lokasi perangkat', color: '#2563EB' };
  }
  if (error) {
    return { icon: 'warning-outline', label: 'Lokasi belum tersedia', color: '#DC2626' };
  }
  const hasValidCoordinates =
    location &&
    Number.isFinite(Number(location.latitude)) &&
    Number.isFinite(Number(location.longitude));

  if (!hasValidCoordinates || !Number.isFinite(distanceMeters)) {
    return { icon: 'navigate-outline', label: 'Lokasi belum diperiksa', color: '#71717A' };
  }
  const effectiveRadius = Number(radiusMeters) || 0;
  if (distanceMeters <= effectiveRadius) {
    return { icon: 'checkmark-circle-outline', label: 'Di dalam radius lab', color: '#059669' };
  }
  return { icon: 'close-circle-outline', label: 'Di luar radius lab', color: '#DC2626' };
};

export default function RadiusStatusCard({
  location,
  distanceMeters,
  radiusMeters,
  isLoading,
  error,
  onRefresh,
}) {
  const { tema } = useApp();
  const presentation = getStatusPresentation({
    isLoading,
    error,
    location,
    distanceMeters,
    radiusMeters,
  });

  return (
    <View style={[styles.card, { backgroundColor: tema.surface, borderColor: tema.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: `${presentation.color}18` }]}>
          {isLoading ? (
            <ActivityIndicator color={presentation.color} />
          ) : (
            <Ionicons name={presentation.icon} size={24} color={presentation.color} />
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: tema.textPrimary }]}>Status Radius Presensi</Text>
          <Text style={[styles.status, { color: presentation.color }]}>{presentation.label}</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {location && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude)) ? (
        <View style={[styles.details, { backgroundColor: tema.surfaceRaised }]}>
          <Text style={[styles.detailText, { color: tema.textSecondary }]}>
            Koordinat: {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
          </Text>
          <Text style={[styles.detailText, { color: tema.textSecondary }]}>
            Akurasi: ±{Math.round(location.accuracyMeters || 0)} m
          </Text>
          <Text style={[styles.detailText, { color: tema.textSecondary }]}>
            Jarak: {Number.isFinite(distanceMeters) ? `${Math.round(distanceMeters)} m` : '-'} / radius {Number(radiusMeters) || 0} m
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.refreshButton, { borderColor: tema.accent }]}
        onPress={onRefresh}
        disabled={isLoading}
      >
        <Ionicons name="refresh-outline" size={17} color={tema.accent} />
        <Text style={[styles.refreshText, { color: tema.accent }]}>Perbarui Lokasi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800' },
  status: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  details: { borderRadius: 10, padding: 12, gap: 4 },
  detailText: { fontSize: 12, lineHeight: 17 },
  errorText: { color: '#DC2626', fontSize: 12, lineHeight: 18 },
  refreshButton: { minHeight: 44, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  refreshText: { fontSize: 13, fontWeight: '700' },
});
