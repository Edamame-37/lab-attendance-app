import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import RadiusStatusCard from '../../components/attendance/RadiusStatusCard';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  checkExistingAttendance,
  getSessions,
  subscribeToSessions,
  subscribeToUserAttendance,
  submitAttendance,
} from '../../services/firestoreService';
import { getLabById } from '../../services/labService';
import {
  calculateDistanceMeters,
  formatLocationError,
  getCurrentDeviceLocation,
} from '../../services/locationService';

export default function AttendanceCheckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requestedSessionId = Array.isArray(params.sessionId)
    ? params.sessionId[0]
    : params.sessionId;
  const { tema } = useApp();
  const { user, userProfile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(requestedSessionId || '');
  const [lab, setLab] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [isAlreadyAttended, setIsAlreadyAttended] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );
  const isSessionOpen =
    selectedSession?.status === 'open' || selectedSession?.statusSesi === 'DIBUKA';
  const effectiveRadius = Number(lab?.radiusMeters) || 0;
  const isInsideRadius =
    Number.isFinite(distanceMeters) &&
    effectiveRadius > 0 &&
    distanceMeters <= effectiveRadius;

  useEffect(() => {
    setIsLoadingData(true);
    setError('');

    const unsubscribe = subscribeToSessions(
      (availableSessions) => {
        setSessions(availableSessions);
        setIsLoadingData(false);
        const requestedExists = availableSessions.some(
          (session) => session.id === requestedSessionId
        );
        const firstOpenSession = availableSessions.find(
          (session) => session.status === 'open' || session.statusSesi === 'DIBUKA'
        );
        setSelectedSessionId((currentId) => {
          if (requestedExists) return requestedSessionId;
          if (availableSessions.some((session) => session.id === currentId)) return currentId;
          return firstOpenSession?.id || availableSessions[0]?.id || '';
        });
      },
      (loadError) => {
        setError(loadError.message || 'Daftar sesi tidak dapat dimuat.');
        setIsLoadingData(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [requestedSessionId]);

  useEffect(() => {
    let isMounted = true;
    setDeviceLocation(null);
    setDistanceMeters(null);
    setLocationError('');
    setLab(null);
    setIsAlreadyAttended(false);

    if (!selectedSession || !user?.uid) return;

    let unsubAttendance = () => {};

    const loadDependencies = async () => {
      try {
        if (selectedSession.labId) {
          const labData = await getLabById(selectedSession.labId);
          if (isMounted) setLab(labData);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Data laboratorium tidak dapat dimuat.');
      }
    };

    loadDependencies();

    unsubAttendance = subscribeToUserAttendance(
      selectedSession.id,
      user.uid,
      (userAttendance) => {
        if (isMounted) {
          setIsAlreadyAttended(Boolean(userAttendance));
        }
      },
      (subError) => {
        console.error('Error subscribeToUserAttendance:', subError);
      }
    );

    return () => {
      isMounted = false;
      unsubAttendance();
    };
  }, [selectedSession?.id, selectedSession?.labId, user?.uid]);

  const refreshDeviceLocation = useCallback(async () => {
    if (!lab?.location) {
      setLocationError('Sesi belum memiliki konfigurasi lokasi laboratorium.');
      return null;
    }

    setIsLoadingLocation(true);
    setLocationError('');
    try {
      const currentLocation = await getCurrentDeviceLocation();
      const currentDistance = calculateDistanceMeters(currentLocation, {
        latitude: lab.location.latitude,
        longitude: lab.location.longitude,
      });
      setDeviceLocation(currentLocation);
      setDistanceMeters(currentDistance);
      return { currentLocation, currentDistance };
    } catch (locationFailure) {
      setDeviceLocation(null);
      setDistanceMeters(null);
      setLocationError(formatLocationError(locationFailure));
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  }, [lab]);

  const handleSubmitAttendance = async () => {
    if (!selectedSession || !lab || !user?.uid || isSubmitting || isAlreadyAttended) return;
    if (!isSessionOpen) {
      setError('Presensi ditolak: Sesi praktikum saat ini belum dibuka atau sudah ditutup oleh asisten.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const freshLocationResult = await refreshDeviceLocation();
      if (!freshLocationResult) return;

      const currentRadius = Number(lab.radiusMeters) || 0;
      if (freshLocationResult.currentDistance > currentRadius) {
        setLocationError(`Presensi ditolak karena perangkat berada di luar radius laboratorium (${Math.round(freshLocationResult.currentDistance)} m / radius ${currentRadius} m).`);
        return;
      }

      const result = await submitAttendance({
        sessionId: selectedSession.id,
        studentId: user.uid,
        studentName: userProfile?.nama,
        studentNim: userProfile?.nomorInduk,
        studentClass: userProfile?.kelas || selectedSession.kelas,
        statusKehadiran: 'HADIR',
        deviceLocation: freshLocationResult.currentLocation,
      });

      if (!result.success) {
        setError(result.message);
        const msg = String(result.message || '').toLowerCase();
        if (msg.includes('sudah melakukan presensi') || msg.includes('hanya diperbolehkan satu kali')) {
          setIsAlreadyAttended(true);
        }
        return;
      }

      setIsAlreadyAttended(true);
      Alert.alert('Presensi Berhasil', result.message);
    } catch (submitError) {
      setError(submitError.message || 'Presensi tidak dapat disimpan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabledReason = useMemo(() => {
    if (!selectedSession) return 'Pilih sesi praktikum terlebih dahulu.';
    if (!isSessionOpen) return 'Sesi belum dibuka atau sudah ditutup.';
    if (!selectedSession.labId || !lab) return 'Lokasi laboratorium belum dikonfigurasi.';
    if (lab.isActive === false) return 'Laboratorium untuk sesi ini sedang nonaktif.';
    if (isAlreadyAttended) return 'Anda sudah melakukan presensi pada sesi ini.';
    if (!deviceLocation) return 'Perbarui lokasi perangkat sebelum melakukan presensi.';
    if (!isInsideRadius) return 'Perangkat berada di luar radius laboratorium.';
    return '';
  }, [selectedSession, isSessionOpen, lab, isAlreadyAttended, deviceLocation, isInsideRadius]);

  return (
    <ScreenContainer showHeader={false}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
          <Ionicons name="arrow-back" size={23} color={tema.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={[styles.pageTitle, { color: tema.textPrimary }]}>Presensi Berbasis Lokasi</Text>
          <Text style={[styles.pageSubtitle, { color: tema.textSecondary }]}>SRS-FT-09 dan SRS-FT-10</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {isLoadingData ? (
        <ActivityIndicator color={tema.accent} style={styles.loading} />
      ) : sessions.length === 0 ? (
        <Text style={[styles.emptyText, { color: tema.textSecondary }]}>Belum ada sesi praktikum.</Text>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: tema.textPrimary }]}>Pilih sesi</Text>
          <View style={styles.sessionList}>
            {sessions.map((session) => {
              const isSelected = session.id === selectedSessionId;
              return (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.sessionButton,
                    { backgroundColor: tema.surface, borderColor: isSelected ? tema.accent : tema.border },
                  ]}
                  onPress={() => setSelectedSessionId(session.id)}
                >
                  <View style={styles.sessionText}>
                    <Text style={[styles.sessionTitle, { color: tema.textPrimary }]}>{session.namaPraktikum}</Text>
                    <Text style={[styles.sessionMeta, { color: tema.textSecondary }]}>
                      {session.kelas} · {session.ruangLab || 'Lab belum dipilih'}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? tema.accent : tema.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {selectedSession ? (
        <View style={[styles.infoCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: tema.textSecondary }]}>Status sesi</Text>
            <Text style={[styles.infoValue, { color: isSessionOpen ? '#059669' : '#DC2626' }]}>
              {isSessionOpen ? 'DIBUKA' : 'DITUTUP'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: tema.textSecondary }]}>Laboratorium</Text>
            <Text style={[styles.infoValue, { color: tema.textPrimary }]}>{lab?.name || 'Belum dikaitkan'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: tema.textSecondary }]}>Status presensi</Text>
            <Text style={[styles.infoValue, { color: isAlreadyAttended ? '#059669' : tema.textPrimary }]}>
              {isAlreadyAttended ? 'SUDAH PRESENSI' : 'BELUM PRESENSI'}
            </Text>
          </View>
        </View>
      ) : null}

      <RadiusStatusCard
        location={deviceLocation}
        distanceMeters={distanceMeters}
        radiusMeters={Number(lab?.radiusMeters) || 0}
        isLoading={isLoadingLocation}
        error={locationError}
        onRefresh={refreshDeviceLocation}
      />

      {disabledReason ? (
        <Text style={[styles.disabledReason, { color: tema.textSecondary }]}>{disabledReason}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: tema.accent },
          (Boolean(disabledReason) || isSubmitting || isAlreadyAttended) && styles.disabledButton,
        ]}
        onPress={handleSubmitAttendance}
        disabled={Boolean(disabledReason) || isSubmitting || isAlreadyAttended}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Ionicons name={isAlreadyAttended ? 'checkmark-done-circle' : 'checkmark-circle-outline'} size={20} color="#FFFFFF" />
        )}
        <Text style={styles.submitText}>
          {isSubmitting ? 'Memvalidasi lokasi...' : isAlreadyAttended ? 'Presensi Telah Tercatat' : 'Konfirmasi Presensi'}
        </Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  topBarText: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '800' },
  pageSubtitle: { fontSize: 11, marginTop: 2 },
  sectionLabel: { fontSize: 14, fontWeight: '800' },
  loading: { marginVertical: 30 },
  emptyText: { textAlign: 'center', paddingVertical: 24 },
  errorBanner: { color: '#991B1B', backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, fontSize: 12 },
  sessionList: { gap: 8 },
  sessionButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 13 },
  sessionText: { flex: 1 },
  sessionTitle: { fontSize: 13, fontWeight: '700' },
  sessionMeta: { fontSize: 11, marginTop: 3 },
  infoCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  infoKey: { fontSize: 12 },
  infoValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  disabledReason: { textAlign: 'center', fontSize: 12, lineHeight: 17 },
  submitButton: { minHeight: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabledButton: { opacity: 0.45 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
