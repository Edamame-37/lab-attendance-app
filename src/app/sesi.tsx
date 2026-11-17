/**
 * @file src/app/sesi.tsx
 * @description Layar Pengelolaan Sesi Praktikum Terintegrasi Cloud Firestore (SRS-FT-02 & SRS-FT-04).
 * Sesuai spesifikasi dokumen evaluasi resmi ppk praktikum.pdf:
 * - Mengubah sumber data sesi dari lokal/dummy menjadi Cloud Firestore.
 * - Asisten dapat melakukan operasi CRUD (tambah, ubah, hapus, lihat) serta kontrol buka/tutup sesi.
 * - Praktikan dapat melihat informasi jadwal dan status sesi praktikum yang tersedia secara real-time.
 * - Melengkapi data praktikum, kelas, dan peserta.
 *
 * @author Farrel (feature/lab-attendance-firestore)
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import useAttendance from '@/hooks/useAttendance';
import AttendanceRecapCard from '@/components/asisten/AttendanceRecapCard';

export default function SesiScreen(): React.JSX.Element {
  const router = useRouter();
  const { tema } = useApp();
  const { userProfile, role: authRole } = useAuth();

  // Mode peran tampilan: default mengikuti role auth pengguna, dengan opsi toggle simulasi untuk penguji
  const [activeRoleView, setActiveRoleView] = useState<'asisten' | 'praktikan'>(
    authRole === 'asisten' ? 'asisten' : 'praktikan'
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Modal states
  const [modalCreateVisible, setModalCreateVisible] = useState<boolean>(false);
  const [modalEditVisible, setModalEditVisible] = useState<boolean>(false);
  const [modalOpenVisible, setModalOpenVisible] = useState<boolean>(false);
  const [targetSessionToOpen, setTargetSessionToOpen] = useState<any>(null);
  const [targetSessionToEdit, setTargetSessionToEdit] = useState<any>(null);

  // Form states untuk membuat sesi baru
  const [formKode, setFormKode] = useState<string>('PPK-2026');
  const [formNamaPraktikum, setFormNamaPraktikum] = useState<string>('');
  const [formTopik, setFormTopik] = useState<string>('');
  const [formKelas, setFormKelas] = useState<string>('TI-3A');
  const [formRuangLab, setFormRuangLab] = useState<string>('Lab RPL 1');
  const [formHari, setFormHari] = useState<string>('Senin');
  const [formJamMulai, setFormJamMulai] = useState<string>('08:00');
  const [formJamSelesai, setFormJamSelesai] = useState<string>('10:30');

  // Form buka sesi
  const [openRuangLab, setOpenRuangLab] = useState<string>('');
  const [openCatatan, setOpenCatatan] = useState<string>('');

  // Hook real-time attendance Firestore
  const attendanceHook: any = useAttendance(selectedSessionId);
  const sessions: any[] = attendanceHook.sessions || [];
  const attendances: any[] = attendanceHook.attendances || [];
  const loading: boolean = attendanceHook.loading;
  const error: string | null = attendanceHook.error;
  const refresh: () => void = attendanceHook.refresh;
  const actionLoading: boolean = attendanceHook.actionLoading;
  const handleOpenSession = attendanceHook.handleOpenSession;
  const handleCloseSession = attendanceHook.handleCloseSession;
  const handleCreateSession = attendanceHook.handleCreateSession;
  const handleUpdateSession = attendanceHook.handleUpdateSession;
  const handleDeleteSession = attendanceHook.handleDeleteSession;
  const handleSeedData = attendanceHook.handleSeedData;

  // Cari sesi aktif saat ini
  const activeSelectedSession: any =
    sessions.find((s: any) => s.id === selectedSessionId) ||
    sessions.find((s: any) => s.status === 'open' || s.statusSesi === 'DIBUKA') ||
    sessions[0];

  // Handler Buat Sesi Baru (SRS-FT-02)
  const onSubmitCreateSession = async () => {
    if (!formNamaPraktikum.trim() || !formKelas.trim()) {
      Alert.alert('Validasi Gagal', 'Nama praktikum dan kelas wajib diisi.');
      return;
    }

    const payload = {
      kodeMataKuliah: formKode.trim(),
      namaPraktikum: formNamaPraktikum.trim(),
      topikMateri: formTopik.trim(),
      kelas: formKelas.trim(),
      ruangLab: formRuangLab.trim(),
      hari: formHari.trim(),
      jamMulai: formJamMulai.trim(),
      jamSelesai: formJamSelesai.trim(),
      namaAsisten: userProfile?.nama || 'Farrel Hidayat',
      asistenId: userProfile?.uid || 'asisten-farrel',
      daftarPeserta: [
        { nim: '21120122140001', nama: 'Budi Santoso' },
        { nim: '21120122140002', nama: 'Siti Rahmawati' },
        { nim: '21120122140003', nama: 'Ahmad Fauzan' },
        { nim: '21120122140004', nama: 'Farrel Hidayat' },
        { nim: '21120122140005', nama: 'Dewi Lestari' },
      ],
    };

    const res = await handleCreateSession(payload);
    if (res.success) {
      Alert.alert('Sukses', 'Sesi praktikum baru berhasil ditambahkan ke Cloud Firestore.');
      setModalCreateVisible(false);
      setFormNamaPraktikum('');
      setFormTopik('');
    } else {
      Alert.alert('Gagal', res.message || 'Gagal menambahkan sesi ke Firestore');
    }
  };

  // Handler Buka Form Edit Sesi (SRS-FT-02)
  const onOpenEditModal = (sesi: any) => {
    setTargetSessionToEdit(sesi);
    setFormKode(sesi.kodeMataKuliah || 'PPK-2026');
    setFormNamaPraktikum(sesi.namaPraktikum || '');
    setFormTopik(sesi.topikMateri || '');
    setFormKelas(sesi.kelas || '');
    setFormRuangLab(sesi.ruangLab || '');
    setFormHari(sesi.hari || 'Senin');
    setFormJamMulai(sesi.jamMulai || '08:00');
    setFormJamSelesai(sesi.jamSelesai || '10:30');
    setModalEditVisible(true);
  };

  // Handler Simpan Perubahan Sesi (SRS-FT-02)
  const onSubmitUpdateSession = async () => {
    if (!targetSessionToEdit) return;
    if (!formNamaPraktikum.trim() || !formKelas.trim()) {
      Alert.alert('Validasi Gagal', 'Nama praktikum dan kelas wajib diisi.');
      return;
    }

    const updatePayload = {
      kodeMataKuliah: formKode.trim(),
      namaPraktikum: formNamaPraktikum.trim(),
      topikMateri: formTopik.trim(),
      kelas: formKelas.trim(),
      ruangLab: formRuangLab.trim(),
      hari: formHari.trim(),
      jamMulai: formJamMulai.trim(),
      jamSelesai: formJamSelesai.trim(),
    };

    const res = await handleUpdateSession(targetSessionToEdit.id, updatePayload);
    if (res.success) {
      Alert.alert('Sukses', 'Data sesi praktikum berhasil diperbarui di Cloud Firestore.');
      setModalEditVisible(false);
      setTargetSessionToEdit(null);
    } else {
      Alert.alert('Gagal', res.message || 'Gagal memperbarui data sesi');
    }
  };

  // Handler Buka Sesi (SRS-FT-02 & SRS-FT-04)
  const onConfirmOpenSession = async () => {
    if (!targetSessionToOpen) return;
    const res = await handleOpenSession(
      targetSessionToOpen.id,
      openRuangLab || targetSessionToOpen.ruangLab,
      openCatatan
    );

    if (res.success) {
      setSelectedSessionId(targetSessionToOpen.id);
      setModalOpenVisible(false);
      setTargetSessionToOpen(null);
      Alert.alert('Sesi Dibuka', 'Sesi praktikum telah dibuka di Firestore. Praktikan dapat melakukan presensi secara live.');
    } else {
      Alert.alert('Gagal', res.message || 'Gagal membuka sesi praktikum');
    }
  };

  // Handler Tutup Sesi (SRS-FT-02 & SRS-FT-04)
  const onConfirmCloseSession = (sesi: any) => {
    Alert.alert(
      'Tutup Sesi Praktikum',
      `Tutup sesi "${sesi.namaPraktikum}" (${sesi.kelas})? Presensi praktikan akan dikunci.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tutup Sekarang',
          style: 'destructive',
          onPress: async () => {
            const res = await handleCloseSession(sesi.id);
            if (res.success) {
              Alert.alert('Sesi Ditutup', 'Sesi praktikum selesai dan presensi telah dikunci di Firestore.');
            } else {
              Alert.alert('Gagal', res.message || 'Gagal menutup sesi praktikum');
            }
          },
        },
      ]
    );
  };

  // Handler Hapus Sesi (SRS-FT-02)
  const onConfirmDeleteSession = (sesi: any) => {
    Alert.alert(
      'Hapus Sesi Praktikum',
      `Apakah Anda yakin ingin menghapus dokumen sesi "${sesi.namaPraktikum}" dari Cloud Firestore?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Permanen',
          style: 'destructive',
          onPress: async () => {
            const res = await handleDeleteSession(sesi.id);
            if (res.success) {
              if (selectedSessionId === sesi.id) {
                setSelectedSessionId('');
              }
              Alert.alert('Berhasil Dihapus', 'Dokumen sesi telah dihapus dari Cloud Firestore.');
            } else {
              Alert.alert('Gagal', res.message || 'Gagal menghapus dokumen sesi');
            }
          },
        },
      ]
    );
  };

  // Handler Seed Data
  const onTriggerSeedData = async () => {
    Alert.alert(
      'Muat Data Awal',
      'Inisialisasi data master praktikum, kelas, dan peserta ke Cloud Firestore?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Muat Sekarang',
          onPress: async () => {
            const res = await handleSeedData();
            Alert.alert(res.success ? 'Berhasil' : 'Pemberitahuan', res.message);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tema.canvas }]}>
      <View style={[styles.container, { backgroundColor: tema.canvas }]}>
        {/* HEADER NAVIGASI */}
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
              Sesi Praktikum
            </Text>
            <Text style={[styles.navSubtitle, { color: tema.textSecondary }]}>
              Cloud Firestore • SRS-FT-02
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.presensiLinkBtn, { backgroundColor: tema.accentSurface || '#ECFDF5' }]}
            onPress={() => router.push('/presensi-firestore' as any)}
          >
            <Ionicons name="checkbox-outline" size={16} color={tema.accent} />
            <Text style={[styles.presensiLinkText, { color: tema.accent }]}>Presensi</Text>
          </TouchableOpacity>
        </View>

        {/* ROLE SIMULATOR SWITCHER (Memudahkan Evaluasi Pengajar) */}
        <View style={[styles.roleBar, { backgroundColor: tema.surfaceRaised, borderColor: tema.borderSubtle }]}>
          <Text style={[styles.roleBarLabel, { color: tema.textSecondary }]}>Mode Tampilan:</Text>
          <View style={styles.roleTabs}>
            <TouchableOpacity
              style={[
                styles.roleTabItem,
                activeRoleView === 'asisten' && [styles.roleTabItemActive, { backgroundColor: tema.accent }],
              ]}
              onPress={() => setActiveRoleView('asisten')}
            >
              <Text
                style={[
                  styles.roleTabText,
                  { color: activeRoleView === 'asisten' ? '#FFFFFF' : tema.textSecondary },
                ]}
              >
                🧑‍🏫 Asisten (CRUD & Kontrol)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTabItem,
                activeRoleView === 'praktikan' && [styles.roleTabItemActive, { backgroundColor: tema.accent }],
              ]}
              onPress={() => setActiveRoleView('praktikan')}
            >
              <Text
                style={[
                  styles.roleTabText,
                  { color: activeRoleView === 'praktikan' ? '#FFFFFF' : tema.textSecondary },
                ]}
              >
                👨‍🎓 Praktikan (Lihat Sesi)
              </Text>
            </TouchableOpacity>
          </View>
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

          {/* =========================================================================
              VIEW KHUSUS ASISTEN (SRS-FT-02 & SRS-FT-04)
              ========================================================================= */}
          {activeRoleView === 'asisten' && (
            <View>
              {/* Action Bar Asisten */}
              <View style={styles.asistenActionBar}>
                <View>
                  <Text style={[styles.sectionHeading, { color: tema.textPrimary }]}>
                    Daftar Sesi Laboratorium ({sessions.length})
                  </Text>
                  <Text style={[styles.sectionSub, { color: tema.textSecondary }]}>
                    Operasi CRUD tersimpan langsung di Cloud Firestore
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {sessions.length === 0 && (
                    <TouchableOpacity
                      style={[styles.btnSeed, { borderColor: tema.accent }]}
                      onPress={onTriggerSeedData}
                      disabled={actionLoading}
                    >
                      <Text style={[styles.btnSeedText, { color: tema.accent }]}>+ Seed Data</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.btnAddSession, { backgroundColor: tema.accent }]}
                    onPress={() => {
                      setFormKode('PPK-2026');
                      setFormNamaPraktikum('');
                      setFormTopik('');
                      setFormKelas('TI-3A');
                      setFormRuangLab('Lab RPL 1');
                      setFormHari('Senin');
                      setFormJamMulai('08:00');
                      setFormJamSelesai('10:30');
                      setModalCreateVisible(true);
                    }}
                  >
                    <Text style={styles.btnAddSessionText}>+ Buat Sesi</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Komponen Rekap Live Asisten (SRS-FT-04) */}
              {activeSelectedSession && (
                <View style={styles.liveRecapContainer}>
                  <AttendanceRecapCard
                    session={activeSelectedSession}
                    attendances={(selectedSessionId === activeSelectedSession.id ? attendances : []) as any}
                    loading={loading || actionLoading}
                  />
                </View>
              )}

              {/* Daftar Dokumen Sesi Asisten */}
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={tema.accent} />
                  <Text style={[styles.loadingText, { color: tema.textMuted }]}>
                    Menghubungkan ke Cloud Firestore...
                  </Text>
                </View>
              ) : sessions.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: tema.surface, borderColor: tema.border }]}>
                  <Ionicons name="calendar-outline" size={38} color={tema.textMuted} />
                  <Text style={[styles.emptyTitle, { color: tema.textPrimary }]}>
                    Belum Ada Dokumen Sesi di Firestore
                  </Text>
                  <Text style={[styles.emptyDesc, { color: tema.textSecondary }]}>
                    Klik tombol "Seed Data" untuk mengisi master praktikum, kelas, dan peserta awal secara otomatis.
                  </Text>
                  <TouchableOpacity
                    style={[styles.btnSeedFull, { backgroundColor: tema.accent }]}
                    onPress={onTriggerSeedData}
                  >
                    <Text style={styles.btnSeedFullText}>Muat Data Awal Firestore</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                sessions.map((sesi) => {
                  const isOpen = sesi.status === 'open' || sesi.statusSesi === 'DIBUKA';
                  const isSelected = activeSelectedSession?.id === sesi.id;

                  return (
                    <TouchableOpacity
                      key={sesi.id}
                      activeOpacity={0.85}
                      onPress={() => setSelectedSessionId(sesi.id)}
                      style={[
                        styles.sessionCard,
                        {
                          backgroundColor: tema.surface,
                          borderColor: isSelected ? tema.accent : tema.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.kodeRow}>
                            <Text style={[styles.kodeBadge, { color: tema.accent, borderColor: tema.accent }]}>
                              {sesi.kodeMataKuliah || 'PRAK'}
                            </Text>
                            <Text style={[styles.kelasBadge, { backgroundColor: tema.surfaceRaised, color: tema.textSecondary }]}>
                              Kelas {sesi.kelas}
                            </Text>
                          </View>
                          <Text style={[styles.namaPraktikum, { color: tema.textPrimary }]}>
                            {sesi.namaPraktikum}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusPill,
                            { backgroundColor: isOpen ? tema.statusHadirBg || '#DCFCE7' : tema.surfaceRaised },
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: isOpen ? tema.statusHadir || '#16A34A' : tema.textMuted },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusPillText,
                              { color: isOpen ? tema.statusHadir || '#16A34A' : tema.textMuted },
                            ]}
                          >
                            {isOpen ? 'DIBUKA' : 'DITUTUP'}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.topikText, { color: tema.textSecondary }]}>
                        Materi: {sesi.topikMateri || '-'}
                      </Text>

                      <View style={styles.detailRow}>
                        <Text style={[styles.metaText, { color: tema.textMuted }]}>
                          📍 {sesi.ruangLab}
                        </Text>
                        <Text style={[styles.metaText, { color: tema.textMuted }]}>
                          🕒 {sesi.hari}, {sesi.jamMulai} - {sesi.jamSelesai} WIB
                        </Text>
                        <Text style={[styles.metaText, { color: tema.textMuted }]}>
                          👥 {sesi.daftarPeserta?.length || 0} Mahasiswa Terdaftar
                        </Text>
                      </View>

                      {sesi.catatanPembuka ? (
                        <View style={[styles.catatanBox, { backgroundColor: tema.accentSurface || '#ECFDF5' }]}>
                          <Text style={[styles.catatanText, { color: tema.accent }]}>
                            📢 Pengumuman: {sesi.catatanPembuka}
                          </Text>
                        </View>
                      ) : null}

                      {/* Baris Tombol Aksi Asisten */}
                      <View style={[styles.cardActionRow, { borderTopColor: tema.borderSubtle }]}>
                        {isOpen ? (
                          <TouchableOpacity
                            style={[styles.btnActionControl, { backgroundColor: '#FEE2E2' }]}
                            onPress={() => onConfirmCloseSession(sesi)}
                            disabled={actionLoading}
                          >
                            <Ionicons name="lock-closed-outline" size={14} color="#DC2626" />
                            <Text style={[styles.btnActionControlText, { color: '#DC2626' }]}>
                              Tutup Sesi
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.btnActionControl, { backgroundColor: tema.statusHadirBg || '#DCFCE7' }]}
                            onPress={() => {
                              setTargetSessionToOpen(sesi);
                              setOpenRuangLab(sesi.ruangLab || '');
                              setOpenCatatan('');
                              setModalOpenVisible(true);
                            }}
                            disabled={actionLoading}
                          >
                            <Ionicons name="radio-outline" size={14} color={tema.statusHadir || '#16A34A'} />
                            <Text style={[styles.btnActionControlText, { color: tema.statusHadir || '#16A34A' }]}>
                              Buka Sesi
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[styles.btnActionSecondary, { borderColor: tema.border }]}
                          onPress={() => onOpenEditModal(sesi)}
                          disabled={actionLoading}
                        >
                          <Ionicons name="create-outline" size={14} color={tema.textSecondary} />
                          <Text style={[styles.btnActionSecondaryText, { color: tema.textSecondary }]}>
                            Ubah
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnActionSecondary, { borderColor: tema.border }]}
                          onPress={() => onConfirmDeleteSession(sesi)}
                          disabled={actionLoading}
                        >
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          <Text style={[styles.btnActionSecondaryText, { color: '#EF4444' }]}>
                            Hapus
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* =========================================================================
              VIEW KHUSUS PRAKTIKAN (SRS-FT-02 & SRS-FT-04)
              ========================================================================= */}
          {activeRoleView === 'praktikan' && (
            <View>
              <View style={[styles.mhsHeaderCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
                <Text style={[styles.mhsLabel, { color: tema.textSecondary }]}>Informasi Praktikan</Text>
                <Text style={[styles.mhsName, { color: tema.textPrimary }]}>
                  {userProfile?.nama || 'Mahasiswa Praktikan'}
                </Text>
                <Text style={[styles.mhsMeta, { color: tema.textMuted }]}>
                  NIM: {userProfile?.nomorInduk || '21120122140001'} • Kelas: {userProfile?.kelas || 'TI-3A'}
                </Text>
              </View>

              <Text style={[styles.sectionHeading, { color: tema.textPrimary, marginTop: 16 }]}>
                Jadwal & Sesi Praktikum Tersedia
              </Text>
              <Text style={[styles.sectionSub, { color: tema.textSecondary, marginBottom: 12 }]}>
                Data sinkron secara real-time dari Cloud Firestore
              </Text>

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={tema.accent} />
                  <Text style={[styles.loadingText, { color: tema.textMuted }]}>
                    Memuat informasi sesi dari Firestore...
                  </Text>
                </View>
              ) : sessions.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: tema.surface, borderColor: tema.border }]}>
                  <Text style={[styles.emptyTitle, { color: tema.textPrimary }]}>
                    Belum Ada Sesi Praktikum
                  </Text>
                  <Text style={[styles.emptyDesc, { color: tema.textSecondary }]}>
                    Asisten belum menambahkan jadwal sesi praktikum.
                  </Text>
                </View>
              ) : (
                sessions.map((sesi) => {
                  const isOpen = sesi.status === 'open' || sesi.statusSesi === 'DIBUKA';

                  return (
                    <View
                      key={sesi.id}
                      style={[
                        styles.sessionCard,
                        {
                          backgroundColor: tema.surface,
                          borderColor: isOpen ? (tema.statusHadir || '#16A34A') : tema.border,
                          borderWidth: isOpen ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.namaPraktikum, { color: tema.textPrimary }]}>
                            {sesi.namaPraktikum}
                          </Text>
                          <Text style={[styles.topikText, { color: tema.textSecondary }]}>
                            Topik: {sesi.topikMateri || '-'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            { backgroundColor: isOpen ? tema.statusHadirBg || '#DCFCE7' : tema.surfaceRaised },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              { color: isOpen ? tema.statusHadir || '#16A34A' : tema.textMuted },
                            ]}
                          >
                            {isOpen ? 'DIBUKA' : 'DITUTUP'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={[styles.metaText, { color: tema.textMuted }]}>
                          Kelas {sesi.kelas} • Ruang {sesi.ruangLab}
                        </Text>
                        <Text style={[styles.metaText, { color: tema.textMuted }]}>
                          {sesi.hari}, {sesi.jamMulai} - {sesi.jamSelesai} WIB
                        </Text>
                      </View>

                      {sesi.catatanPembuka ? (
                        <View style={[styles.catatanBox, { backgroundColor: tema.accentSurface || '#ECFDF5' }]}>
                          <Text style={[styles.catatanText, { color: tema.accent }]}>
                            📢 Asisten: "{sesi.catatanPembuka}"
                          </Text>
                        </View>
                      ) : null}

                      {/* Tombol Tindakan Praktikan */}
                      {isOpen ? (
                        <TouchableOpacity
                          style={[styles.btnGoPresensi, { backgroundColor: tema.accent }]}
                          onPress={() => router.push(`/presensi-firestore?sessionId=${sesi.id}` as any)}
                        >
                          <Ionicons name="checkbox-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.btnGoPresensiText}>Isi Presensi Sesi Ini Sekarang ➔</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.closedNotice, { backgroundColor: tema.surfaceRaised }]}>
                          <Text style={[styles.closedNoticeText, { color: tema.textMuted }]}>
                            Sesi ini belum dibuka atau telah selesai.
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* MODAL BUAT SESI BARU (ASISTEN - SRS-FT-02) */}
        <Modal
          visible={modalCreateVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalCreateVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: tema.surface }]}>
              <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>
                Tambah Sesi Praktikum
              </Text>
              <Text style={[styles.modalSub, { color: tema.textSecondary }]}>
                Data akan tersimpan secara permanen di Cloud Firestore
              </Text>

              <TextInput
                style={[styles.modalInput, { borderColor: tema.border, color: tema.textPrimary }]}
                placeholder="Kode Mata Kuliah (cth: PPK-2026)"
                placeholderTextColor={tema.textMuted}
                value={formKode}
                onChangeText={setFormKode}
              />

              <TextInput
                style={[styles.modalInput, { borderColor: tema.border, color: tema.textPrimary }]}
                placeholder="Nama Praktikum (cth: Praktikum Perangkat Keras)"
                placeholderTextColor={tema.textMuted}
                value={formNamaPraktikum}
                onChangeText={setFormNamaPraktikum}
              />

              <TextInput
                style={[styles.modalInput, { borderColor: tema.border, color: tema.textPrimary }]}
                placeholder="Topik / Materi (cth: Modul 3: Cloud Firestore)"
                placeholderTextColor={tema.textMuted}
                value={formTopik}
                onChangeText={setFormTopik}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, borderColor: tema.border, color: tema.textPrimary }]}
                  placeholder="Kelas (cth: TI-3A)"
                  placeholderTextColor={tema.textMuted}
                  value={formKelas}
                  onChangeText={setFormKelas}
                />
                <TextInput
                  style={[styles.modalInput, { flex: 1, borderColor: tema.border, color: tema.textPrimary }]}
                  placeholder="Ruang Lab"
                  placeholderTextColor={tema.textMuted}
                  value={formRuangLab}
                  onChangeText={setFormRuangLab}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, borderColor: tema.border, color: tema.textPrimary }]}
                  placeholder="Hari"
                  placeholderTextColor={tema.textMuted}
                  value={formHari}
                  onChangeText={setFormHari}
                />
                <TextInput
                  style={[styles.modalInput, { flex: 1, borderColor: tema.border, color: tema.textPrimary }]}
                  placeholder="08:00 - 10:30"
                  placeholderTextColor={tema.textMuted}
                  value={`${formJamMulai} - ${formJamSelesai}`}
                  onChangeText={(val) => {
                    const parts = val.split('-');
                    if (parts[0]) setFormJamMulai(parts[0].trim());
                    if (parts[1]) setFormJamSelesai(parts[1].trim());
                  }}
                />
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.btnModalCancel, { backgroundColor: tema.surfaceRaised }]}
                  onPress={() => setModalCreateVisible(false)}
                >
                  <Text style={{ color: tema.textPrimary }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnModalSubmit, { backgroundColor: tema.accent }]}
                  onPress={onSubmitCreateSession}
                  disabled={actionLoading}
                >
                  <Text style={styles.btnModalSubmitText}>
                    {actionLoading ? 'Menyimpan...' : 'Simpan ke Firestore'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL UBAH SESI (ASISTEN - SRS-FT-02) */}
        <Modal
          visible={modalEditVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalEditVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: tema.surface }]}>
              <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>
                Ubah Sesi Praktikum
              </Text>
              <Text style={[styles.modalSub, { color: tema.textSecondary }]}>
                Memperbarui dokumen sesi di Cloud Firestore
              </Text>

              <TextInput
                style={[styles.modalInput, { borderColor: tema.border, color: tema.textPrimary }]}
                placeholder="Nama Praktikum"
                placeholderTextColor={tema.textMuted}
                value={formNamaPraktikum}
                onChangeText={setFormNamaPraktikum}
              />

              <TextInput
                style={[styles.modalInput, { borderColor: tema.border, color: tema.textPrimary }]}
                placeholder="Topik Materi"
                placeholderTextColor={tema.textMuted}
                value={formTopik}
                onChangeText={setFormTopik}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, borderColor: tema.border, color: tema.textPrimary }]}
                  placeholder="Kelas"
                  placeholderTextColor={tema.textMuted}
                  value={formKelas}
                  onChangeText={setFormKelas}
                />
                <TextInput
                  style={[styles.modalInput, { flex: 1, borderColor: tema.border, color: tema.textPrimary }]}
                  placeholder="Ruang Lab"
                  placeholderTextColor={tema.textMuted}
                  value={formRuangLab}
                  onChangeText={setFormRuangLab}
                />
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.btnModalCancel, { backgroundColor: tema.surfaceRaised }]}
                  onPress={() => setModalEditVisible(false)}
                >
                  <Text style={{ color: tema.textPrimary }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnModalSubmit, { backgroundColor: tema.accent }]}
                  onPress={onSubmitUpdateSession}
                  disabled={actionLoading}
                >
                  <Text style={styles.btnModalSubmitText}>
                    {actionLoading ? 'Menyimpan...' : 'Perbarui Sesi'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL BUKA SESI (ASISTEN - SRS-FT-02 & SRS-FT-04) */}
        <Modal
          visible={modalOpenVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalOpenVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: tema.surface }]}>
              <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>
                Buka Sesi Praktikum
              </Text>
              <Text style={[styles.modalSub, { color: tema.textSecondary }]}>
                {targetSessionToOpen?.namaPraktikum} ({targetSessionToOpen?.kelas})
              </Text>

              <TextInput
                style={[styles.modalInput, { borderColor: tema.border, color: tema.textPrimary }]}
                placeholder="Konfirmasi Ruangan Lab"
                placeholderTextColor={tema.textMuted}
                value={openRuangLab}
                onChangeText={setOpenRuangLab}
              />

              <TextInput
                style={[styles.modalInput, { borderColor: tema.border, color: tema.textPrimary, height: 75 }]}
                placeholder="Catatan / Pengumuman untuk praktikan (opsional)"
                placeholderTextColor={tema.textMuted}
                multiline
                numberOfLines={3}
                value={openCatatan}
                onChangeText={setOpenCatatan}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.btnModalCancel, { backgroundColor: tema.surfaceRaised }]}
                  onPress={() => setModalOpenVisible(false)}
                >
                  <Text style={{ color: tema.textPrimary }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnModalSubmit, { backgroundColor: tema.statusHadir || '#16A34A' }]}
                  onPress={onConfirmOpenSession}
                  disabled={actionLoading}
                >
                  <Text style={styles.btnModalSubmitText}>Buka Sekarang</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  presensiLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presensiLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  roleBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  roleTabs: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  roleTabItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  roleTabItemActive: {
    elevation: 1,
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: '700',
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
  asistenActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  btnAddSession: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnAddSessionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  btnSeed: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnSeedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  liveRecapContainer: {
    marginBottom: 14,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  btnSeedFull: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnSeedFullText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  kodeBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  kelasBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  namaPraktikum: {
    fontSize: 15,
    fontWeight: '700',
  },
  topikText: {
    fontSize: 13,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailRow: {
    marginTop: 8,
    gap: 3,
  },
  metaText: {
    fontSize: 12,
  },
  catatanBox: {
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  catatanText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  btnActionControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnActionControlText: {
    fontSize: 12,
    fontWeight: '700',
  },
  btnActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnActionSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mhsHeaderCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  mhsLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  mhsName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  mhsMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  btnGoPresensi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  btnGoPresensiText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  closedNotice: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closedNoticeText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000060',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 16,
    padding: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 14,
    marginTop: 2,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    marginBottom: 10,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  btnModalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnModalSubmit: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnModalSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
