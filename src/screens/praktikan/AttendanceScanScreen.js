/**
 * @file src/screens/praktikan/AttendanceScanScreen.js
 * @author Farrel (feature/lab-attendance-firestore)
 * @description Antarmuka Praktikan untuk submit presensi pada sesi yang sedang dibuka
 * dengan validasi pencegahan presensi ganda (SRS-FT-03 & SRS-FT-04).
 */

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AppContext } from '../../context/AppContext';
import { lightTheme } from '../../theme';
import useAttendance from '../../hooks/useAttendance';

export const AttendanceScanScreen = () => {
  const context = useContext(AppContext);
  const tema = context?.tema || lightTheme;
  const penggunaAktif = context?.penggunaAktif;

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [statusKehadiran, setStatusKehadiran] = useState('HADIR');
  const [catatan, setCatatan] = useState('');
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState('');

  // Hook real-time attendance
  const {
    activeSessions,
    currentSession,
    userAttendanceRecord,
    isAlreadyAttended,
    loading,
    actionLoading,
    handleRecordAttendance,
  } = useAttendance(selectedSessionId, penggunaAktif?.id);

  // Set default sesi aktif pertama jika belum dipilih
  useEffect(() => {
    if (activeSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(activeSessions[0].id);
    }
  }, [activeSessions, selectedSessionId]);

  // Handler Submit Presensi
  const onConfirmSubmit = async () => {
    if (!selectedSessionId) {
      Alert.alert('Pilih Sesi', 'Silakan pilih sesi praktikum yang sedang dibuka terlebih dahulu.');
      return;
    }

    if (isAlreadyAttended) {
      Alert.alert(
        'Presensi Ditolak',
        'Anda sudah melakukan presensi pada sesi ini. Presensi hanya diperbolehkan satu kali.'
      );
      return;
    }

    const payload = {
      targetSessionId: selectedSessionId,
      userStudentId: penggunaAktif?.id || 'mhs-1',
      studentName: penggunaAktif?.nama || 'Praktikan',
      studentNim: penggunaAktif?.nomorInduk || '21120122100000',
      studentClass: penggunaAktif?.kelas || currentSession?.kelas || 'A',
      statusKehadiran,
      catatan: catatan.trim(),
    };

    const res = await handleRecordAttendance(payload);
    if (res.success) {
      setSubmitSuccessMessage('Presensi Anda berhasil dicatat dan tersimpan di sistem Firestore!');
      Alert.alert('Berhasil', 'Presensi Anda berhasil dicatat!');
      setCatatan('');
    } else {
      Alert.alert('Gagal Presensi', res.message || 'Terjadi kesalahan saat menyimpan presensi');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tema.canvas }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header Info Praktikan */}
      <View style={[styles.userCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
        <Text style={[styles.userLabel, { color: tema.textSecondary }]}>Identitas Praktikan</Text>
        <Text style={[styles.userName, { color: tema.textPrimary }]}>
          {penggunaAktif?.nama || 'Praktikan Lab'}
        </Text>
        <Text style={[styles.userMeta, { color: tema.textMuted }]}>
          NIM: {penggunaAktif?.nomorInduk || '-'} • Kelas: {penggunaAktif?.kelas || '-'}
        </Text>
      </View>

      {/* Banner Pesan Sukses */}
      {submitSuccessMessage ? (
        <View style={[styles.successBanner, { backgroundColor: tema.statusHadirBg || '#DCFCE7' }]}>
          <Text style={[styles.successText, { color: tema.statusHadir || '#16A34A' }]}>
            ✓ {submitSuccessMessage}
          </Text>
        </View>
      ) : null}

      {/* Pemilihan Sesi Aktif */}
      <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>
        Sesi Praktikum Terbuka ({activeSessions.length})
      </Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={tema.accent} />
          <Text style={[styles.loadingText, { color: tema.textMuted }]}>
            Mengecek sesi yang sedang dibuka...
          </Text>
        </View>
      ) : activeSessions.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <Text style={[styles.emptyTitle, { color: tema.textPrimary }]}>
            Tidak Ada Sesi yang Dibuka
          </Text>
          <Text style={[styles.emptySubtitle, { color: tema.textSecondary }]}>
            Asisten belum membuka sesi praktikum. Halaman ini akan ter-update otomatis ketika sesi dibuka secara real-time.
          </Text>
        </View>
      ) : (
        <View style={styles.sessionsList}>
          {activeSessions.map((sesi) => {
            const isSelected = sesi.id === selectedSessionId;
            return (
              <TouchableOpacity
                key={sesi.id}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedSessionId(sesi.id);
                  setSubmitSuccessMessage('');
                }}
                style={[
                  styles.sessionItem,
                  {
                    backgroundColor: isSelected ? tema.accentSurface || '#ECFDF5' : tema.surface,
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
                    {sesi.topikMateri || 'Sesi Terbuka'} • Ruang {sesi.ruangLab}
                  </Text>
                  {sesi.catatanPembuka ? (
                    <Text style={[styles.catatanText, { color: tema.accentText || tema.accent }]}>
                      Catatan Asisten: "{sesi.catatanPembuka}"
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

      {/* Form Konfirmasi & Status Presensi */}
      {selectedSessionId && currentSession ? (
        <View style={[styles.formCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <Text style={[styles.formHeading, { color: tema.textPrimary }]}>
            Formulir Presensi Kehadiran
          </Text>

          {/* Validasi apakah sudah presensi */}
          {isAlreadyAttended ? (
            <View
              style={[
                styles.alreadyBox,
                { backgroundColor: tema.statusHadirBg || '#DCFCE7', borderColor: tema.statusHadir || '#16A34A' },
              ]}
            >
              <Text style={[styles.alreadyTitle, { color: tema.statusHadir || '#16A34A' }]}>
                ✓ Anda Telah Mengisi Presensi
              </Text>
              <Text style={[styles.alreadyDesc, { color: tema.textSecondary }]}>
                Status: {userAttendanceRecord?.statusKehadiran || 'HADIR'} • Dicatat pada:{' '}
                {userAttendanceRecord?.waktuPresensi || 'WIB'}
              </Text>
              <Text style={[styles.alreadyWarning, { color: tema.textMuted }]}>
                Sesuai aturan (SRS-FT-03), presensi hanya dapat dilakukan 1x per sesi dan tidak dapat diulang.
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.inputLabel, { color: tema.textSecondary }]}>
                Pilih Status Kehadiran
              </Text>
              <View style={styles.statusRow}>
                {['HADIR', 'IZIN', 'SAKIT'].map((st) => {
                  const isChosen = statusKehadiran === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      onPress={() => setStatusKehadiran(st)}
                      style={[
                        styles.statusOption,
                        {
                          backgroundColor: isChosen ? tema.accent : tema.surfaceRaised,
                          borderColor: isChosen ? tema.accent : tema.borderSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
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
                  styles.inputCatatan,
                  {
                    borderColor: tema.border,
                    color: tema.textPrimary,
                    backgroundColor: tema.surfaceRaised,
                  },
                ]}
                placeholder="Tuliskan keterangan jika izin/sakit..."
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
                  <Text style={styles.btnSubmitText}>Kirim Presensi Sekarang</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}
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
  userCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  userLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  successBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
  },
  emptyBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  sessionsList: {
    marginBottom: 16,
    gap: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  sessionItemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sessionItemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  catatanText: {
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
    marginLeft: 12,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  formCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  formHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputCatatan: {
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
  alreadyBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  alreadyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  alreadyDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  alreadyWarning: {
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default AttendanceScanScreen;

