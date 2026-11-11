/**
 * @file src/screens/asisten/SessionManageScreen.js
 * @author Farrel (feature/lab-attendance-firestore)
 * @description Antarmuka Asisten Laboratorium untuk mengelola sesi praktikum:
 * CRUD Sesi, Buka/Tutup Sesi, dan Pantauan Rekapitulasi Real-Time (SRS-FT-02 & SRS-FT-04).
 */

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AppContext } from '../../context/AppContext';
import { lightTheme } from '../../theme';
import useAttendance from '../../hooks/useAttendance';
import AttendanceRecapCard from '../../components/asisten/AttendanceRecapCard';

export const SessionManageScreen = () => {
  const context = useContext(AppContext);
  const tema = context?.tema || lightTheme;
  const penggunaAktif = context?.penggunaAktif;

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [modalCreateVisible, setModalCreateVisible] = useState(false);
  const [modalOpenVisible, setModalOpenVisible] = useState(false);
  const [targetSessionToOpen, setTargetSessionToOpen] = useState(null);

  // Form states untuk membuat sesi baru
  const [formNamaPraktikum, setFormNamaPraktikum] = useState('');
  const [formTopik, setFormTopik] = useState('');
  const [formKelas, setFormKelas] = useState('');
  const [formRuangLab, setFormRuangLab] = useState('Lab 1');
  const [formHari, setFormHari] = useState('Senin');
  const [formJamMulai, setFormJamMulai] = useState('08:00');
  const [formJamSelesai, setFormJamSelesai] = useState('10:00');

  // Form buka sesi
  const [openRuangLab, setOpenRuangLab] = useState('');
  const [openCatatan, setOpenCatatan] = useState('');

  // Hook real-time attendance
  const {
    sessions,
    attendances,
    loading,
    actionLoading,
    handleOpenSession,
    handleCloseSession,
    handleCreateSession,
    handleDeleteSession,
  } = useAttendance(selectedSessionId);

  // Set default selected session bila belum ada
  const activeSelectedSession =
    sessions.find((s) => s.id === selectedSessionId) ||
    sessions.find((s) => s.status === 'open' || s.statusSesi === 'DIBUKA') ||
    sessions[0];

  // Handler Submit Buat Sesi Baru
  const onSubmitCreateSession = async () => {
    if (!formNamaPraktikum.trim() || !formKelas.trim()) {
      Alert.alert('Validasi Gagal', 'Nama praktikum dan kelas wajib diisi.');
      return;
    }

    const payload = {
      namaPraktikum: formNamaPraktikum.trim(),
      topikMateri: formTopik.trim(),
      kelas: formKelas.trim(),
      ruangLab: formRuangLab.trim(),
      hari: formHari.trim(),
      jamMulai: formJamMulai.trim(),
      jamSelesai: formJamSelesai.trim(),
      namaAsisten: penggunaAktif?.nama || 'Asisten Lab',
      asistenId: penggunaAktif?.id || 'asisten-1',
    };

    const res = await handleCreateSession(payload);
    if (res.success) {
      Alert.alert('Sukses', 'Sesi praktikum baru berhasil ditambahkan.');
      setModalCreateVisible(false);
      setFormNamaPraktikum('');
      setFormTopik('');
      setFormKelas('');
    } else {
      Alert.alert('Gagal', res.message || 'Gagal menambahkan sesi');
    }
  };

  // Handler Buka Sesi
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
      Alert.alert('Sukses', 'Sesi praktikum telah dibuka. Praktikan dapat melakukan presensi.');
    } else {
      Alert.alert('Gagal', res.message || 'Gagal membuka sesi');
    }
  };

  // Handler Tutup Sesi
  const onConfirmCloseSession = (session) => {
    Alert.alert(
      'Tutup Sesi Praktikum',
      `Apakah Anda yakin ingin menutup sesi "${session.namaPraktikum}"? Presensi akan dikunci.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tutup Sekarang',
          style: 'destructive',
          onPress: async () => {
            const res = await handleCloseSession(session.id);
            if (res.success) {
              Alert.alert('Sesi Ditutup', 'Sesi telah selesai dan presensi terkunci.');
            } else {
              Alert.alert('Gagal', res.message || 'Gagal menutup sesi');
            }
          },
        },
      ]
    );
  };

  // Handler Hapus Sesi
  const onConfirmDeleteSession = (session) => {
    Alert.alert(
      'Hapus Sesi Praktikum',
      `Hapus sesi "${session.namaPraktikum}" (${session.kelas}) dari Firestore?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const res = await handleDeleteSession(session.id);
            if (res.success) {
              if (selectedSessionId === session.id) {
                setSelectedSessionId('');
              }
              Alert.alert('Berhasil', 'Sesi praktikum telah dihapus.');
            } else {
              Alert.alert('Gagal', res.message || 'Gagal menghapus sesi');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tema.canvas }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header Halaman */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: tema.textPrimary }]}>
            Kelola Sesi Praktikum
          </Text>
          <Text style={[styles.subtitle, { color: tema.textSecondary }]}>
            CRUD Sesi & Kontrol Presensi Real-time
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.btnTambah, { backgroundColor: tema.accent }]}
          onPress={() => setModalCreateVisible(true)}
        >
          <Text style={styles.btnTambahText}>+ Buat Sesi</Text>
        </TouchableOpacity>
      </View>

      {/* Komponen Rekap Live untuk Sesi Terpilih */}
      {activeSelectedSession && (
        <View style={styles.recapWrapper}>
          <AttendanceRecapCard
            session={activeSelectedSession}
            attendances={selectedSessionId === activeSelectedSession.id ? attendances : []}
            loading={loading || actionLoading}
          />
        </View>
      )}

      {/* Daftar Semua Sesi */}
      <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>
        Semua Sesi Praktikum ({sessions.length})
      </Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={tema.accent} />
          <Text style={[styles.loadingText, { color: tema.textMuted }]}>
            Memuat daftar sesi dari Firestore...
          </Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <Text style={[styles.emptyText, { color: tema.textSecondary }]}>
            Belum ada data sesi praktikum di Firestore.
          </Text>
          <TouchableOpacity
            style={[styles.btnOutline, { borderColor: tema.accent }]}
            onPress={() => setModalCreateVisible(true)}
          >
            <Text style={{ color: tema.accent, fontWeight: '700' }}>+ Buat Sesi Pertama</Text>
          </TouchableOpacity>
        </View>
      ) : (
        sessions.map((sesi) => {
          const isOpen = sesi.status === 'open' || sesi.statusSesi === 'DIBUKA';
          const isSelected = activeSelectedSession?.id === sesi.id;

          return (
            <TouchableOpacity
              key={sesi.id}
              activeOpacity={0.8}
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
              <View style={styles.sessionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionName, { color: tema.textPrimary }]}>
                    {sesi.namaPraktikum}
                  </Text>
                  <Text style={[styles.sessionClass, { color: tema.textSecondary }]}>
                    Kelas {sesi.kelas} • {sesi.ruangLab}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isOpen
                        ? tema.statusHadirBg || '#DCFCE7'
                        : tema.surfaceRaised,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: isOpen
                          ? tema.statusHadir || '#16A34A'
                          : tema.textMuted,
                      },
                    ]}
                  >
                    {isOpen ? 'DIBUKA' : 'DITUTUP'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.sessionTopic, { color: tema.textSecondary }]}>
                Materi: {sesi.topikMateri || 'Sesi Umum'}
              </Text>
              <Text style={[styles.sessionTime, { color: tema.textMuted }]}>
                {sesi.hari}, {sesi.jamMulai} - {sesi.jamSelesai} WIB
              </Text>

              {/* Tombol Kontrol Buka/Tutup & Hapus */}
              <View style={styles.actionRow}>
                {isOpen ? (
                  <TouchableOpacity
                    style={[styles.btnAction, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => onConfirmCloseSession(sesi)}
                    disabled={actionLoading}
                  >
                    <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 12 }}>
                      Tutup Sesi
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.btnAction, { backgroundColor: tema.statusHadirBg || '#DCFCE7' }]}
                    onPress={() => {
                      setTargetSessionToOpen(sesi);
                      setOpenRuangLab(sesi.ruangLab || '');
                      setModalOpenVisible(true);
                    }}
                    disabled={actionLoading}
                  >
                    <Text
                      style={{
                        color: tema.statusHadir || '#16A34A',
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      Buka Sesi
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.btnHapus, { borderColor: tema.borderSubtle }]}
                  onPress={() => onConfirmDeleteSession(sesi)}
                  disabled={actionLoading}
                >
                  <Text style={{ color: tema.textMuted, fontSize: 12 }}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* Modal Buat Sesi Baru */}
      <Modal
        visible={modalCreateVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCreateVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tema.surface }]}>
            <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>
              Tambah Sesi Praktikum
            </Text>

            <TextInput
              style={[styles.input, { borderColor: tema.border, color: tema.textPrimary }]}
              placeholder="Nama Praktikum (cth: Pemrograman Web)"
              placeholderTextColor={tema.textMuted}
              value={formNamaPraktikum}
              onChangeText={setFormNamaPraktikum}
            />

            <TextInput
              style={[styles.input, { borderColor: tema.border, color: tema.textPrimary }]}
              placeholder="Topik / Modul (cth: Modul 3: React Hooks)"
              placeholderTextColor={tema.textMuted}
              value={formTopik}
              onChangeText={setFormTopik}
            />

            <TextInput
              style={[styles.input, { borderColor: tema.border, color: tema.textPrimary }]}
              placeholder="Kelas (cth: TI-3A)"
              placeholderTextColor={tema.textMuted}
              value={formKelas}
              onChangeText={setFormKelas}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1, borderColor: tema.border, color: tema.textPrimary }]}
                placeholder="Ruang Lab"
                placeholderTextColor={tema.textMuted}
                value={formRuangLab}
                onChangeText={setFormRuangLab}
              />
              <TextInput
                style={[styles.input, { flex: 1, borderColor: tema.border, color: tema.textPrimary }]}
                placeholder="Hari"
                placeholderTextColor={tema.textMuted}
                value={formHari}
                onChangeText={setFormHari}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1, borderColor: tema.border, color: tema.textPrimary }]}
                placeholder="Jam Mulai (08:00)"
                placeholderTextColor={tema.textMuted}
                value={formJamMulai}
                onChangeText={setFormJamMulai}
              />
              <TextInput
                style={[styles.input, { flex: 1, borderColor: tema.border, color: tema.textPrimary }]}
                placeholder="Jam Selesai (10:00)"
                placeholderTextColor={tema.textMuted}
                value={formJamSelesai}
                onChangeText={setFormJamSelesai}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: tema.surfaceRaised }]}
                onPress={() => setModalCreateVisible(false)}
              >
                <Text style={{ color: tema.textPrimary }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: tema.accent }]}
                onPress={onSubmitCreateSession}
                disabled={actionLoading}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {actionLoading ? 'Menyimpan...' : 'Simpan Sesi'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Buka Sesi */}
      <Modal
        visible={modalOpenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpenVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tema.surface }]}>
            <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>
              Buka Sesi Praktikum
            </Text>
            <Text style={[styles.modalSubtitle, { color: tema.textSecondary }]}>
              {targetSessionToOpen?.namaPraktikum} ({targetSessionToOpen?.kelas})
            </Text>

            <TextInput
              style={[styles.input, { borderColor: tema.border, color: tema.textPrimary }]}
              placeholder="Ruang Laboratorium"
              placeholderTextColor={tema.textMuted}
              value={openRuangLab}
              onChangeText={setOpenRuangLab}
            />

            <TextInput
              style={[styles.input, { borderColor: tema.border, color: tema.textPrimary, height: 70 }]}
              placeholder="Catatan / Pengumuman untuk praktikan (opsional)"
              placeholderTextColor={tema.textMuted}
              multiline
              value={openCatatan}
              onChangeText={setOpenCatatan}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: tema.surfaceRaised }]}
                onPress={() => setModalOpenVisible(false)}
              >
                <Text style={{ color: tema.textPrimary }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: tema.statusHadir || '#16A34A' }]}
                onPress={onConfirmOpenSession}
                disabled={actionLoading}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Buka Sekarang</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  btnTambah: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnTambahText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  recapWrapper: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  sessionCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '700',
  },
  sessionClass: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionTopic: {
    fontSize: 13,
    marginTop: 6,
  },
  sessionTime: {
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  btnAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnHapus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 13,
    marginBottom: 12,
  },
  btnOutline: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000060',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  btnModal: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});

export default SessionManageScreen;

