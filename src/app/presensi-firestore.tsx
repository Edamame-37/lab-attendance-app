/**
 * @file src/app/presensi-firestore.tsx
 * @description Layar Pencatatan Presensi Praktikan Terintegrasi Cloud Firestore (SRS-FT-03 & SRS-FT-04).
 * Sesuai spesifikasi dokumen evaluasi resmi ppk praktikum.pdf:
 * - Mengubah penyimpanan presensi dari local state menjadi Cloud Firestore.
 * - Memastikan data presensi menyimpan identitas Praktikan, sesi, dan waktu kehadiran.
 * - Memastikan presensi HANYA DAPAT DILAKUKAN KETIKA SESI DIBUKA ('open') dan
 *   TIDAK DAPAT DILAKUKAN DUA KALI PADA SESI YANG SAMA (Anti-Duplikasi).
 *
 * @author Farrel (feature/lab-attendance-firestore)
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import useAttendance from '@/hooks/useAttendance';
import { getStudentAttendanceHistory } from '@/services/firestoreService';

export default function PresensiFirestoreScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const { tema } = useApp();
  const { userProfile, user } = useAuth();

  const currentUserId = userProfile?.uid || user?.uid || 'mhs-1';
  const [selectedSessionId, setSelectedSessionId] = useState<string>(params.sessionId || '');
  const [statusKehadiran, setStatusKehadiran] = useState<'HADIR' | 'IZIN' | 'SAKIT'>('HADIR');
  const [catatan, setCatatan] = useState<string>('');
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [submitSuccessNotice, setSubmitSuccessNotice] = useState<string>('');

  // Hook real-time attendance Firestore
  const attendanceHook: any = useAttendance(selectedSessionId, currentUserId);
  const activeSessions: any[] = attendanceHook.activeSessions || [];
  const currentSession: any = attendanceHook.currentSession;
  const userAttendanceRecord: any = attendanceHook.userAttendanceRecord;
  const isAlreadyAttended: boolean = attendanceHook.isAlreadyAttended;
  const loading: boolean = attendanceHook.loading;
  const error: string | null = attendanceHook.error;
  const refresh: () => void = attendanceHook.refresh;
  const actionLoading: boolean = attendanceHook.actionLoading;
  const handleRecordAttendance = attendanceHook.handleRecordAttendance;

  // Jika params.sessionId berubah, update selectedSessionId
  useEffect(() => {
    if (params.sessionId) {
      setSelectedSessionId(params.sessionId);
    }
  }, [params.sessionId]);

  // Set default sesi aktif pertama jika belum dipilih
  useEffect(() => {
    if (activeSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(activeSessions[0].id);
    }
  }, [activeSessions, selectedSessionId]);

  // Muat riwayat presensi praktikan dari Firestore
  const loadHistory = async () => {
    if (!currentUserId) return;
    setLoadingHistory(true);
    try {
      const hist = await getStudentAttendanceHistory(currentUserId);
      setHistoryList(hist);
    } catch (e) {
      console.warn('Gagal memuat riwayat presensi Firestore:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUserId, isAlreadyAttended]);

  // Handler Submit Presensi (SRS-FT-03)
  const onConfirmSubmit = async () => {
    if (!selectedSessionId) {
      Alert.alert('Pilih Sesi', 'Silakan pilih sesi praktikum yang sedang dibuka terlebih dahulu.');
      return;
    }

    if (!currentSession) {
      Alert.alert('Sesi Tidak Valid', 'Data sesi praktikum tidak ditemukan.');
      return;
    }

    // 1. Validasi status sesi aktif (SRS-FT-03: hanya ketika sesi dibuka)
    const isOpen = currentSession.status === 'open' || currentSession.statusSesi === 'DIBUKA';
    if (!isOpen) {
      Alert.alert(
        'Sesi Ditutup',
        'Presensi ditolak: Sesi praktikum saat ini belum dibuka atau telah ditutup oleh asisten.'
      );
      return;
    }

    // 2. Validasi anti-duplikasi (SRS-FT-03: tidak dapat presensi 2x pada sesi yang sama)
    if (isAlreadyAttended) {
      Alert.alert(
        'Presensi Ditolak',
        'Anda sudah melakukan presensi pada sesi ini. Sesuai aturan sistem, presensi hanya diperbolehkan satu kali.'
      );
      return;
    }

    const payload = {
      targetSessionId: selectedSessionId,
      userStudentId: currentUserId,
      studentName: userProfile?.nama || 'Praktikan Lab',
      studentNim: userProfile?.nomorInduk || '21120122140001',
      studentClass: userProfile?.kelas || currentSession.kelas || 'TI-3A',
      statusKehadiran,
      catatan: catatan.trim(),
    };

    const res = await handleRecordAttendance(payload);
    if (res.success) {
      setSubmitSuccessNotice('Presensi Anda berhasil dicatat dan tersimpan di Cloud Firestore!');
      Alert.alert('Berhasil', 'Presensi Anda berhasil dicatat!');
      setCatatan('');
      loadHistory();
    } else {
      Alert.alert('Gagal Presensi', res.message || 'Terjadi kesalahan saat menyimpan presensi ke Firestore');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tema.canvas }]}>
      <View style={[styles.container, { backgroundColor: tema.canvas }]}>
        {/* NAVIGASI HEADER */}
        <View style={[styles.navHeader, { backgroundColor: tema.surface, borderBottomColor: tema.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
          >
            <Ionicons name="arrow-back" size={22} color={tema.textPrimary} />
            <Text style={[styles.backText, { color: tema.textPrimary }]}>Kembali</Text>
          </TouchableOpacity>

          <View style={styles.navTitleWrap}>
            <Text style={[styles.navTitle, { color: tema.textPrimary }]}>
              Presensi Praktikum
            </Text>
            <Text style={[styles.navSubtitle, { color: tema.textSecondary }]}>
              Cloud Firestore • SRS-FT-03
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.linkSesiBtn, { backgroundColor: tema.surfaceRaised }]}
            onPress={() => router.push('/sesi' as any)}
          >
            <Ionicons name="calendar-outline" size={16} color={tema.textSecondary} />
            <Text style={[styles.linkSesiText, { color: tema.textSecondary }]}>Sesi</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* BANNER GANGGUAN KONEKSI FIRESTORE */}
          {error && (
            <View style={styles.errorBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.errorTitle}>Gangguan Koneksi Firestore</Text>
                <Text style={styles.errorDesc}>{error}</Text>
              </View>
              <TouchableOpacity style={styles.btnRetry} onPress={refresh}>
                <Text style={styles.btnRetryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* KARTU IDENTITAS PRAKTIKAN */}
          <View style={[styles.userCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
            <View style={styles.userCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userLabel, { color: tema.textSecondary }]}>Identitas Praktikan</Text>
                <Text style={[styles.userName, { color: tema.textPrimary }]}>
                  {userProfile?.nama || 'Praktikan Lab'}
                </Text>
                <Text style={[styles.userMeta, { color: tema.textMuted }]}>
                  NIM: {userProfile?.nomorInduk || '21120122140001'} • Kelas: {userProfile?.kelas || 'TI-3A'}
                </Text>
              </View>
              <View style={[styles.badgeRole, { backgroundColor: tema.accentSurface || '#ECFDF5' }]}>
                <Text style={[styles.badgeRoleText, { color: tema.accent }]}>Praktikan</Text>
              </View>
            </View>
          </View>

          {/* BANNER SUKSES PRESENSI */}
          {submitSuccessNotice ? (
            <View style={[styles.successBanner, { backgroundColor: tema.statusHadirBg || '#DCFCE7', borderColor: tema.statusHadir || '#16A34A' }]}>
              <Ionicons name="checkmark-circle" size={18} color={tema.statusHadir || '#16A34A'} />
              <Text style={[styles.successText, { color: tema.statusHadir || '#16A34A' }]}>
                {submitSuccessNotice}
              </Text>
            </View>
          ) : null}

          {/* DAFTAR SESI PRAKTIKUM YANG DIBUKA (REAL-TIME - SRS-FT-04) */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={[styles.sectionHeading, { color: tema.textPrimary }]}>
              Sesi Praktikum yang Sedang Dibuka ({activeSessions.length})
            </Text>
            <View style={[styles.liveDotWrap, { backgroundColor: tema.statusHadirBg || '#DCFCE7' }]}>
              <View style={[styles.liveDot, { backgroundColor: tema.statusHadir || '#16A34A' }]} />
              <Text style={[styles.liveText, { color: tema.statusHadir || '#16A34A' }]}>LIVE</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={tema.accent} />
              <Text style={[styles.loadingText, { color: tema.textMuted }]}>
                Mengecek sesi yang sedang dibuka di Firestore...
              </Text>
            </View>
          ) : activeSessions.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: tema.surface, borderColor: tema.border }]}>
              <Ionicons name="time-outline" size={32} color={tema.textMuted} />
              <Text style={[styles.emptyTitle, { color: tema.textPrimary }]}>
                Belum Ada Sesi yang Dibuka
              </Text>
              <Text style={[styles.emptyDesc, { color: tema.textSecondary }]}>
                Asisten belum membuka sesi praktikum saat ini. Halaman ini akan otomatis ter-update secara real-time begitu asisten membuka sesi di Cloud Firestore.
              </Text>
              <TouchableOpacity
                style={[styles.btnLihatSesi, { borderColor: tema.accent }]}
                onPress={() => router.push('/sesi' as any)}
              >
                <Text style={[styles.btnLihatSesiText, { color: tema.accent }]}>Lihat Seluruh Jadwal Sesi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {activeSessions.map((sesi) => {
                const isSelected = sesi.id === selectedSessionId;
                return (
                  <TouchableOpacity
                    key={sesi.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedSessionId(sesi.id);
                      setSubmitSuccessNotice('');
                    }}
                    style={[
                      styles.sessionItem,
                      {
                        backgroundColor: isSelected ? (tema.accentSurface || '#ECFDF5') : tema.surface,
                        borderColor: isSelected ? tema.accent : tema.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sessionItemTitle, { color: tema.textPrimary }]}>
                        {sesi.namaPraktikum}
                      </Text>
                      <Text style={[styles.sessionItemSub, { color: tema.textSecondary }]}>
                        Topik: {sesi.topikMateri || '-'}
                      </Text>
                      <Text style={[styles.sessionItemMeta, { color: tema.textMuted }]}>
                        Kelas {sesi.kelas} • Ruang {sesi.ruangLab} • {sesi.jamMulai} - {sesi.jamSelesai} WIB
                      </Text>
                      {sesi.catatanPembuka ? (
                        <Text style={[styles.sessionCatatan, { color: tema.accent }]}>
                          📢 Asisten: "{sesi.catatanPembuka}"
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.radioIndicator,
                        { borderColor: isSelected ? tema.accent : tema.border },
                      ]}
                    >
                      {isSelected && (
                        <View style={[styles.radioDot, { backgroundColor: tema.accent }]} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* FORMULIR PRESENSI ATAU KARTU SUDAH PRESENSI (SRS-FT-03) */}
          {selectedSessionId && currentSession && (
            <View style={[styles.formContainer, { backgroundColor: tema.surface, borderColor: tema.border }]}>
              <Text style={[styles.formTitle, { color: tema.textPrimary }]}>
                Formulir Presensi Kehadiran
              </Text>
              <Text style={[styles.formSub, { color: tema.textSecondary }]}>
                Sesi: {currentSession.namaPraktikum} ({currentSession.kelas})
              </Text>

              {/* KONDISI 1: SUDAH PERNAH PRESENSI (VALIDASI ANTI-DUPLIKASI 1x) */}
              {isAlreadyAttended ? (
                <View
                  style={[
                    styles.alreadyAttendedCard,
                    {
                      backgroundColor: tema.statusHadirBg || '#DCFCE7',
                      borderColor: tema.statusHadir || '#16A34A',
                    },
                  ]}
                >
                  <View style={styles.alreadyHeader}>
                    <Ionicons name="checkmark-done-circle" size={24} color={tema.statusHadir || '#16A34A'} />
                    <Text style={[styles.alreadyTitle, { color: tema.statusHadir || '#16A34A' }]}>
                      Presensi Anda Telah Tercatat ✓
                    </Text>
                  </View>
                  <View style={styles.alreadyDetails}>
                    <Text style={[styles.alreadyText, { color: tema.textPrimary }]}>
                      Status Kehadiran:{' '}
                      <Text style={{ fontWeight: '800' }}>
                        {userAttendanceRecord?.statusKehadiran || 'HADIR'}
                      </Text>
                    </Text>
                    <Text style={[styles.alreadyText, { color: tema.textPrimary }]}>
                      Waktu Presensi:{' '}
                      <Text style={{ fontWeight: '700' }}>
                        {userAttendanceRecord?.waktuPresensi || '-'}
                      </Text>
                    </Text>
                    {userAttendanceRecord?.catatan ? (
                      <Text style={[styles.alreadyText, { color: tema.textSecondary, fontStyle: 'italic' }]}>
                        Catatan: "{userAttendanceRecord.catatan}"
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.lockWarning, { backgroundColor: '#FFFFFF60' }]}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={tema.statusHadir || '#16A34A'} />
                    <Text style={[styles.lockWarningText, { color: tema.textSecondary }]}>
                      Sesuai aturan (SRS-FT-03), presensi hanya dapat dilakukan 1 kali per sesi dan tidak dapat diubah/diulang.
                    </Text>
                  </View>
                </View>
              ) : (
                /* KONDISI 2: BELUM PRESENSI - TAMPILKAN INPUT FORMULIR */
                <View>
                  <Text style={[styles.inputLabel, { color: tema.textSecondary }]}>
                    Pilih Status Kehadiran
                  </Text>
                  <View style={styles.statusChoiceRow}>
                    {(['HADIR', 'IZIN', 'SAKIT'] as const).map((st) => {
                      const isChosen = statusKehadiran === st;
                      return (
                        <TouchableOpacity
                          key={st}
                          onPress={() => setStatusKehadiran(st)}
                          style={[
                            styles.statusChoiceBtn,
                            {
                              backgroundColor: isChosen ? tema.accent : tema.surfaceRaised,
                              borderColor: isChosen ? tema.accent : tema.borderSubtle,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusChoiceText,
                              { color: isChosen ? '#FFFFFF' : tema.textSecondary },
                            ]}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.inputLabel, { color: tema.textSecondary }]}>
                    Catatan Tambahan (Opsional)
                  </Text>
                  <TextInput
                    style={[
                      styles.catatanInput,
                      {
                        borderColor: tema.border,
                        color: tema.textPrimary,
                        backgroundColor: tema.surfaceRaised,
                      },
                    ]}
                    placeholder="Masukkan alasan jika izin atau sakit..."
                    placeholderTextColor={tema.textMuted}
                    multiline
                    numberOfLines={3}
                    value={catatan}
                    onChangeText={setCatatan}
                  />

                  <TouchableOpacity
                    style={[
                      styles.btnSubmit,
                      { backgroundColor: tema.accent },
                      actionLoading && { opacity: 0.7 },
                    ]}
                    onPress={onConfirmSubmit}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.btnSubmitText}>Kirim Presensi Sekarang</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* RIWAYAT PRESENSI SAYA (FIRESTORE) */}
          <View style={styles.historyWrap}>
            <View style={styles.historyHeader}>
              <Text style={[styles.sectionHeading, { color: tema.textPrimary }]}>
                Riwayat Presensi Saya di Firestore
              </Text>
              <TouchableOpacity onPress={loadHistory} disabled={loadingHistory}>
                <Ionicons name="refresh-outline" size={18} color={tema.accent} />
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <ActivityIndicator size="small" color={tema.accent} style={{ marginVertical: 10 }} />
            ) : historyList.length === 0 ? (
              <View style={[styles.emptyHistoryBox, { backgroundColor: tema.surfaceRaised }]}>
                <Text style={[styles.emptyHistoryText, { color: tema.textMuted }]}>
                  Belum ada riwayat presensi yang tersimpan di Firestore.
                </Text>
              </View>
            ) : (
              historyList.map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={[styles.historyCard, { backgroundColor: tema.surface, borderColor: tema.borderSubtle }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyName, { color: tema.textPrimary }]}>
                      {item.namaPraktikum}
                    </Text>
                    <Text style={[styles.historyMeta, { color: tema.textSecondary }]}>
                      Kelas {item.studentClass || '-'} • {item.tanggal || ''} ({item.waktuPresensi || ''})
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.historyStatusPill,
                      item.statusKehadiran === 'HADIR' && { backgroundColor: tema.statusHadirBg || '#DCFCE7' },
                      item.statusKehadiran === 'IZIN' && { backgroundColor: '#FEF3C7' },
                      item.statusKehadiran === 'SAKIT' && { backgroundColor: '#FEE2E2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.historyStatusText,
                        item.statusKehadiran === 'HADIR' && { color: tema.statusHadir || '#16A34A' },
                        item.statusKehadiran === 'IZIN' && { color: '#D97706' },
                        item.statusKehadiran === 'SAKIT' && { color: '#DC2626' },
                      ]}
                    >
                      {item.statusKehadiran}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  navHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navTitleWrap: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  navSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  linkSesiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  linkSesiText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorTitle: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  errorDesc: {
    color: '#7F1D1D',
    fontSize: 11,
    marginTop: 2,
  },
  btnRetry: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnRetryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  userCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  userMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeRole: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeRoleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  liveDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    marginTop: 6,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  btnLihatSesi: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnLihatSesiText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionList: {
    marginBottom: 14,
    gap: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  sessionItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sessionItemSub: {
    fontSize: 12,
    marginTop: 1,
  },
  sessionItemMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  sessionCatatan: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  formContainer: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  formSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  alreadyAttendedCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  alreadyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  alreadyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  alreadyDetails: {
    gap: 4,
    marginBottom: 10,
  },
  alreadyText: {
    fontSize: 13,
  },
  lockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 6,
  },
  lockWarningText: {
    fontSize: 11,
    flex: 1,
    fontStyle: 'italic',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  statusChoiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statusChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusChoiceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  catatanInput: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  btnSubmit: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  historyWrap: {
    marginTop: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyHistoryBox: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 12,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  historyName: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  historyStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
