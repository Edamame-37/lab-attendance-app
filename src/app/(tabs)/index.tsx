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
      {/* PINTASAN MODUL (TERINTEGRASI SESUAI PERAN AKTIF) */}
      <View
        style={{
          backgroundColor: tema.surface,
          borderColor: tema.border,
          borderWidth: 1,
          borderRadius: 14,
          padding: 12,
          marginBottom: 14,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: tema.textPrimary }}>
            Pintasan Menu {peranAktif === 'asisten' ? 'Asisten' : 'Praktikan'}
          </Text>
          <Text style={{ fontSize: 10, color: tema.textMuted }}>
            {peranAktif === 'asisten' ? 'Modul Kelola & Validasi' : 'Modul Kehadiran & Perizinan'}
          </Text>
        </View>

        {peranAktif === 'asisten' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/sesi' as any)}
              style={{
                flex: 1,
                minWidth: '47%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: tema.accent,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                Kelola Sesi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/lokasi-lab' as any)}
              style={{
                flex: 1,
                minWidth: '47%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: tema.surfaceRaised,
                borderColor: tema.border,
                borderWidth: 1,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Ionicons name="settings-outline" size={16} color={tema.textPrimary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: tema.textPrimary }}>
                Kelola Lab
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/peta-lab' as any)}
              style={{
                flex: 1,
                minWidth: '47%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: '#2563EB',
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Ionicons name="map-outline" size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                Peta Lab
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/review-izin' as any)}
              style={{
                flex: 1,
                minWidth: '47%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: tema.surfaceRaised,
                borderColor: tema.border,
                borderWidth: 1,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Ionicons name="document-text-outline" size={16} color={tema.textPrimary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: tema.textPrimary }}>
                Review Izin
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/presensi-lokasi' as any)}
              style={{
                flex: 1,
                minWidth: '47%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: tema.accent,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Ionicons name="locate-outline" size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                Presensi Praktikum
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/peta-lab' as any)}
              style={{
                flex: 1,
                minWidth: '47%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: '#2563EB',
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Ionicons name="map-outline" size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                Peta Lab
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/pengajuan-izin' as any)}
              style={{
                flex: 1,
                minWidth: '47%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: tema.surfaceRaised,
                borderColor: tema.border,
                borderWidth: 1,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Ionicons name="mail-outline" size={16} color={tema.textPrimary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: tema.textPrimary }}>
                Pengajuan Izin
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/status-izin' as any)}
              style={{
                flex: 1,
                minWidth: '47%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: tema.surfaceRaised,
                borderColor: tema.border,
                borderWidth: 1,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Ionicons name="time-outline" size={16} color={tema.textPrimary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: tema.textPrimary }}>
                Status Izin
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* SECTION 1: SESI SEDANG BERLANGSUNG */}
      {sesiUtama && (
        <View style={styles.sectionWrap}>
          <SectionHeader
            title={
              sesiUtama.status === 'DIBUKA'
                ? 'Sesi Sedang Berlangsung'
                : 'Sesi Praktikum Terdekat'
            }
            isFirst
            rightElement={
              <Text style={[styles.sectionDateMeta, { color: tema.textMuted }]}>
                {sesiUtama.hari}, 26 Okt
              </Text>
            }
          />

          {/* ACTIVE SESSION CARD (HERO) */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: tema.surface,
                borderColor: tema.border,
              },
              modeTema === 'dark' && sesiUtama.status === 'DIBUKA'
                ? { borderLeftWidth: 3, borderLeftColor: tema.accent }
                : null,
            ]}
          >
            {/* Blok 1: Judul Utama & Sub-line */}
            <View style={styles.cardHeadingBlock}>
              <Text
                style={[styles.cardTitle, { color: tema.textPrimary }]}
                numberOfLines={2}
              >
                {sesiUtama.namaPraktikum}
              </Text>
              <View style={styles.cardSubline}>
                <Text
                  style={[styles.sublineText, { color: tema.textSecondary }]}
                >
                  Kelas {sesiUtama.kelas}
                </Text>
                <Text style={[styles.sublineSep, { color: tema.border }]}>·</Text>
                <Text
                  style={[styles.sublineText, { color: tema.textSecondary }]}
                >
                  {sesiUtama.ruangLab}
                </Text>
              </View>
            </View>

            {/* Blok 2: Waktu & Asisten Bersih (De-boxed) */}
            <View style={styles.cardMetaRow}>
              <View style={styles.timeSlot}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={tema.textMuted}
                />
                <Text
                  style={[styles.timeText, { color: tema.textPrimary }]}
                >
                  {sesiUtama.jamMulai} – {sesiUtama.jamSelesai} WIB
                </Text>
              </View>

              <Text
                style={[styles.assistantName, { color: tema.textSecondary }]}
              >
                {sesiUtama.namaAsisten}
              </Text>
            </View>

            {/* Blok 3: Tombol Aksi / Bukti Kehadiran Langsung */}
            <View style={styles.actionCluster}>
              {peranAktif === 'asisten' ? (
                sesiUtama.status === 'DIBUKA' ? (
                  <TouchableOpacity
                    style={[styles.uiActionBtn, styles.btnDangerUi]}
                    onPress={() => handleTutupSesiTrigger(sesiUtama)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pause-circle-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.btnActionText}>Tutup Sesi Praktikum</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.uiActionBtn, styles.btnSuccessUi]}
                    onPress={() => handleBukaSesiTrigger(sesiUtama)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play-circle-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.btnActionText}>Buka Sesi Praktikum</Text>
                  </TouchableOpacity>
                )
              ) : presensiSaya ? (
                /* Bukti Presensi (Receipt Box) */
                <View
                  style={[
                    styles.uiReceiptBox,
                    {
                      backgroundColor: tema.statusHadirBg,
                      borderColor: tema.statusHadirBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={16}
                    color={tema.statusHadir}
                  />
                  <Text
                    style={[
                      styles.receiptText,
                      { color: tema.statusHadir },
                    ]}
                  >
                    Presensi kamu telah tercatat pada {presensiSaya.waktuPresensi} WIB
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.uiActionBtn,
                    { backgroundColor: tema.accent },
                  ]}
                  onPress={() => router.push('/(tabs)/presensi')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkbox-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.btnActionText}>Isi Presensi Sekarang</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* SECTION 2: JADWAL MENDATANG */}
      <View style={styles.sectionWrap}>
        <SectionHeader title="Jadwal Mendatang" />
        {sesiMendatang.length === 0 ? (
          <EmptyState
            title="Tidak Ada Jadwal Mendatang"
            description="Semua jadwal sesi praktikum telah dibuka atau diselesaikan."
          />
        ) : (
          <GroupedInsetList>
            {sesiMendatang.map((sesi, index) => (
              <GroupedInsetItem
                key={sesi.id}
                title={sesi.topikMateri}
                subtitle={`${sesi.jamMulai} – ${sesi.jamSelesai} WIB · ${sesi.ruangLab} · ${sesi.namaAsisten}`}
                isLast={index === sesiMendatang.length - 1}
                rightElement={
                  <View
                    style={[
                      styles.classTag,
                      { backgroundColor: tema.surfaceRaised },
                    ]}
                  >
                    <Text
                      style={[styles.classTagText, { color: tema.textMuted }]}
                    >
                      {sesi.kelas}
                    </Text>
                  </View>
                }
                onPress={
                  peranAktif === 'asisten'
                    ? () => handleBukaSesiTrigger(sesi)
                    : undefined
                }
              />
            ))}
          </GroupedInsetList>
        )}
      </View>

      {/* SECTION 3: SELESAI DILAKSANAKAN */}
      <View style={styles.sectionWrap}>
        <SectionHeader title="Selesai Dilaksanakan" />
        {sesiSelesai.length === 0 ? (
          <EmptyState
            title="Belum Ada Sesi Selesai"
            description="Sesi yang telah ditutup dan diverifikasi akan muncul pada riwayat ini."
          />
        ) : (
          <GroupedInsetList style={{ opacity: 0.85 }}>
            {sesiSelesai.map((sesi, index) => {
              const jmlHadir = ambilPresensiPerSesi(sesi.id).length;
              return (
                <GroupedInsetItem
                  key={sesi.id}
                  title={sesi.topikMateri}
                  subtitle={`Jumat, 18 Okt · ${sesi.ruangLab} · ${jmlHadir || 5}/5 Hadir`}
                  isLast={index === sesiSelesai.length - 1}
                  rightElement={
                    <View
                      style={[
                        styles.classTag,
                        { backgroundColor: tema.surfaceRaised },
                      ]}
                    >
                      <Text
                        style={[styles.classTagText, { color: tema.textMuted }]}
                      >
                        {sesi.kelas}
                      </Text>
                    </View>
                  }
                />
              );
            })}
          </GroupedInsetList>
        )}
      </View>

      {/* Dialog Modal: Pembukaan Sesi (Asisten) */}
      <OpenSessionModal
        visible={modalBukaVisible}
        sesi={selectedSesi}
        onClose={() => {
          setModalBukaVisible(false);
          setSelectedSesi(null);
        }}
        onConfirm={handleKonfirmasiBuka}
      />

      {/* Dialog Modal: Penutupan Sesi (Asisten) */}
      <CloseSessionModal
        visible={modalTutupVisible}
        sesi={selectedSesi}
        totalHadir={selectedSesi ? ambilPresensiPerSesi(selectedSesi.id).length : 0}
        onClose={() => {
          setModalTutupVisible(false);
          setSelectedSesi(null);
        }}
        onConfirm={handleKonfirmasiTutup}
      />
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
