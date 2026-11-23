import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AttendanceRecapCard } from '@/components/asisten/AttendanceRecapCard';
import { useApp } from '@/context/AppContext';
import {
  subscribeToSessionAttendances,
  subscribeToSessions,
} from '@/services/firestoreService';
import { radius, spacing } from '@/theme';

const FirestoreAttendanceRecap = AttendanceRecapCard as React.ComponentType<any>;

type FirestoreSession = {
  id: string;
  namaPraktikum?: string;
  kelas?: string;
  ruangLab?: string;
  status?: string;
  statusSesi?: string;
};

export const RekapPresensiView: React.FC = () => {
  const { tema } = useApp();
  const [sessions, setSessions] = useState<FirestoreSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingAttendances, setLoadingAttendances] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => subscribeToSessions(
    (nextSessions: FirestoreSession[]) => {
      setSessions(nextSessions);
      setSelectedSessionId((currentId) => {
        if (currentId && nextSessions.some((session) => session.id === currentId)) {
          return currentId;
        }
        const openSession = nextSessions.find(
          (session) => session.status === 'open' || session.statusSesi === 'DIBUKA',
        );
        return openSession?.id || nextSessions[0]?.id || '';
      });
      setLoadingSessions(false);
      setErrorMessage('');
    },
    () => {
      setLoadingSessions(false);
      setErrorMessage('Daftar sesi tidak dapat dimuat dari Firestore.');
    },
  ), []);

  useEffect(() => {
    if (!selectedSessionId) return undefined;

    return subscribeToSessionAttendances(
      selectedSessionId,
      (nextAttendances: any[]) => {
        setAttendances(nextAttendances);
        setLoadingAttendances(false);
        setErrorMessage('');
      },
      () => {
        setLoadingAttendances(false);
        setErrorMessage('Rekap presensi tidak dapat dimuat dari Firestore.');
      },
    );
  }, [selectedSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [selectedSessionId, sessions],
  );

  if (loadingSessions) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={tema.accent} />
        <Text style={[styles.stateText, { color: tema.textSecondary }]}>Memuat sesi Firestore...</Text>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
        <Text style={[styles.emptyTitle, { color: tema.textPrimary }]}>Belum ada sesi praktikum</Text>
        <Text style={[styles.stateText, { color: tema.textSecondary }]}>
          Buat sesi melalui Kelola Sesi. Rekap diperbarui real-time setelah praktikan melakukan presensi.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>Rekap Firestore</Text>
        <Text style={[styles.stateText, { color: tema.textSecondary }]}>
          Pilih sesi untuk melihat presensi dari sumber data yang sama.
        </Text>
      </View>

      <View style={styles.sessionList}>
        {sessions.map((session) => {
          const isSelected = session.id === selectedSessionId;
          return (
            <TouchableOpacity
              key={session.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                setLoadingAttendances(true);
                setSelectedSessionId(session.id);
              }}
              style={[
                styles.sessionButton,
                {
                  backgroundColor: isSelected ? tema.accent : tema.surface,
                  borderColor: isSelected ? tema.accent : tema.border,
                },
              ]}
            >
              <Text style={[styles.sessionName, { color: isSelected ? '#FFFFFF' : tema.textPrimary }]}>
                {session.namaPraktikum || 'Sesi Praktikum'}
              </Text>
              <Text style={[styles.sessionMeta, { color: isSelected ? '#D1FAE5' : tema.textSecondary }]}>
                {session.kelas || '-'} · {session.ruangLab || 'Lab belum dipilih'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <FirestoreAttendanceRecap
        session={selectedSession}
        attendances={attendances}
        loading={loadingAttendances}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  centerState: { alignItems: 'center', gap: spacing.sm, paddingVertical: 48 },
  stateText: { fontSize: 13, lineHeight: 19 },
  emptyCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  sessionList: { gap: spacing.sm },
  sessionButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sessionName: { fontSize: 14, fontWeight: '700' },
  sessionMeta: { fontSize: 12, marginTop: 2 },
  errorText: { color: '#DC2626', fontSize: 13 },
});
