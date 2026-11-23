import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { subscribeToSessions } from '@/services/firestoreService';
import { radius, spacing } from '@/theme';

type SessionDocument = {
  id: string;
  namaPraktikum?: string;
  topikMateri?: string;
  kelas?: string;
  ruangLab?: string;
  labId?: string;
  hari?: string;
  jamMulai?: string;
  jamSelesai?: string;
  status?: string;
  statusSesi?: string;
};

type ShortcutProps = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  primary?: boolean;
  theme: any;
};

function Shortcut({ label, icon, onPress, primary = false, theme }: ShortcutProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.shortcut,
        {
          backgroundColor: primary ? theme.accent : theme.surface,
          borderColor: primary ? theme.accent : theme.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={21} color={primary ? '#FFFFFF' : theme.accent} />
      <Text style={[styles.shortcutText, { color: primary ? '#FFFFFF' : theme.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const { role } = useAuth();
  const { tema } = useApp();
  const [sessions, setSessions] = useState<SessionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToSessions(
      (items: SessionDocument[]) => {
        setSessions(items);
        setLoading(false);
        setError('');
      },
      (subscriptionError: Error) => {
        setError(subscriptionError.message || 'Sesi praktikum tidak dapat dimuat.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const sortedSessions = useMemo(
    () => [...sessions].sort((first, second) => {
      const firstOpen = first.status === 'open' || first.statusSesi === 'DIBUKA';
      const secondOpen = second.status === 'open' || second.statusSesi === 'DIBUKA';
      return Number(secondOpen) - Number(firstOpen);
    }),
    [sessions]
  );

  const openAttendance = (sessionId?: string): void => {
    router.push({ pathname: '/presensi-lokasi', params: sessionId ? { sessionId } : {} });
  };

  return (
    <ScreenContainer>
      <View>
        <Text style={[styles.title, { color: tema.textPrimary }]}>Dashboard Praktikum</Text>
        <Text style={[styles.subtitle, { color: tema.textSecondary }]}>Data sesi tersinkron langsung dari Cloud Firestore.</Text>
      </View>

      <View style={styles.shortcutGrid}>
        {role === 'asisten' ? (
          <>
            <Shortcut theme={tema} label="Kelola Sesi" icon="calendar-outline" onPress={() => router.push('/sesi')} primary />
            <Shortcut theme={tema} label="Kelola Lab" icon="business-outline" onPress={() => router.push('/lokasi-lab')} />
            <Shortcut theme={tema} label="Review Izin" icon="document-text-outline" onPress={() => router.push('/review-izin')} />
            <Shortcut theme={tema} label="Peta Lab" icon="map-outline" onPress={() => router.push('/peta-lab')} />
          </>
        ) : (
          <>
            <Shortcut theme={tema} label="Presensi Lokasi" icon="locate-outline" onPress={() => openAttendance()} primary />
            <Shortcut theme={tema} label="Ajukan Izin" icon="document-text-outline" onPress={() => router.push('/pengajuan-izin')} />
            <Shortcut theme={tema} label="Status Izin" icon="time-outline" onPress={() => router.push('/status-izin')} />
            <Shortcut theme={tema} label="Peta Lab" icon="map-outline" onPress={() => router.push('/peta-lab')} />
          </>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>Sesi Praktikum</Text>
      {loading ? <ActivityIndicator color={tema.accent} style={styles.loading} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && sortedSessions.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <Ionicons name="calendar-outline" size={28} color={tema.textMuted} />
          <Text style={[styles.emptyTitle, { color: tema.textPrimary }]}>Belum ada sesi</Text>
          <Text style={[styles.emptyText, { color: tema.textSecondary }]}>
            Asisten perlu membuat laboratorium, lalu membuat sesi yang terhubung ke laboratorium tersebut.
          </Text>
        </View>
      ) : null}

      {sortedSessions.map((session) => {
        const isOpen = session.status === 'open' || session.statusSesi === 'DIBUKA';
        const hasLab = Boolean(session.labId);
        return (
          <TouchableOpacity
            key={session.id}
            style={[styles.sessionCard, { backgroundColor: tema.surface, borderColor: isOpen ? tema.accent : tema.border }]}
            onPress={() => role === 'praktikan' && openAttendance(session.id)}
            disabled={role === 'asisten'}
            accessibilityRole={role === 'praktikan' ? 'button' : 'summary'}
          >
            <View style={styles.sessionHeader}>
              <View style={styles.sessionTitleBlock}>
                <Text style={[styles.sessionName, { color: tema.textPrimary }]}>{session.namaPraktikum || 'Praktikum'}</Text>
                <Text style={[styles.sessionTopic, { color: tema.textSecondary }]}>{session.topikMateri || 'Materi belum diisi'}</Text>
              </View>
              <Text style={[styles.status, { color: isOpen ? '#059669' : tema.textMuted }]}>{isOpen ? 'DIBUKA' : 'DITUTUP'}</Text>
            </View>
            <Text style={[styles.meta, { color: tema.textSecondary }]}>
              {session.kelas || '-'} · {session.hari || '-'} · {session.jamMulai || '-'}–{session.jamSelesai || '-'}
            </Text>
            <Text style={[styles.meta, { color: hasLab ? tema.textSecondary : '#DC2626' }]}>
              {hasLab ? session.ruangLab || 'Laboratorium terhubung' : 'Laboratorium belum dikonfigurasi'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  shortcut: { width: '48%', minHeight: 86, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, justifyContent: 'space-between' },
  shortcutText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginTop: spacing.sm },
  loading: { marginVertical: spacing.xl },
  error: { color: '#991B1B', backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: spacing.md, fontSize: 12 },
  emptyCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '800', marginTop: spacing.sm },
  emptyText: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 4 },
  sessionCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: 6 },
  sessionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  sessionTitleBlock: { flex: 1 },
  sessionName: { fontSize: 14, fontWeight: '800' },
  sessionTopic: { fontSize: 12, marginTop: 2 },
  status: { fontSize: 10, fontWeight: '800' },
  meta: { fontSize: 11, lineHeight: 17 },
});
