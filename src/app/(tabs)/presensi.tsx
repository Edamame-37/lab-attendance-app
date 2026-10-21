/**
 * @file src/app/(tabs)/presensi.tsx
 * @description Layar Pencatatan Presensi Praktikan dan Riwayat Kehadiran Pribadi.
 * Area Kerja Utama: Pemrogram 2 (Pencatatan Presensi Mahasiswa & Validasi).
 *
 * Tanggung Jawab Pemrogram 2:
 * - Menampilkan formulir input presensi untuk mahasiswa saat sesi praktikum dibuka.
 * - Mengimplementasikan validasi:
 *   1. Presensi hanya dapat dilakukan jika sesi berstatus 'DIBUKA'.
 *   2. Mahasiswa yang sama tidak dapat melakukan presensi dua kali pada sesi yang sama.
 * - Menampilkan modal dialog umpan balik konfirmasi keberhasilan presensi.
 * - Menampilkan daftar riwayat kehadiran mahasiswa aktif.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { StatusKehadiran, JadwalSesi } from '@/types';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';
import { BadgeStatus } from '@/components/common/BadgeStatus';
import { EmptyState } from '@/components/common/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function PresensiScreen(): React.JSX.Element {
  const {
    peranAktif,
    penggunaAktif,
    daftarSesi,
    catatPresensi,
    cekSudahPresensi,
    ambilRiwayatPraktikan,
    gantiPeran,
  } = useApp();

  // Sesi praktikum yang saat ini berstatus 'DIBUKA'
  const sesiDibukaList = daftarSesi.filter((s) => s.status === 'DIBUKA');

  // State form presensi
  const [selectedSesiId, setSelectedSesiId] = useState<string>(
    sesiDibukaList.length > 0 ? sesiDibukaList[0].id : ''
  );
  const [statusKehadiran, setStatusKehadiran] =
    useState<StatusKehadiran>('HADIR');
  const [catatan, setCatatan] = useState<string>('');

  // State modal umpan balik berhasil
  const [modalSuksesVisible, setModalSuksesVisible] = useState<boolean>(false);
  const [pesanSukses, setPesanSukses] = useState<string>('');
  const [errorPesan, setErrorPesan] = useState<string>('');

  // Ambil data sesi yang dipilih
  const sesiDipilih = daftarSesi.find((s) => s.id === selectedSesiId);

  // Periksa apakah mahasiswa aktif sudah pernah presensi di sesi yang dipilih
  const sudahPresensi = selectedSesiId
    ? cekSudahPresensi(selectedSesiId, penggunaAktif.id)
    : false;

  // Riwayat presensi khusus untuk mahasiswa aktif
  const riwayatSaya = ambilRiwayatPraktikan(penggunaAktif.id);

  /**
   * Handler pengiriman presensi
   */
  const handleKirimPresensi = (): void => {
    setErrorPesan('');
    if (!selectedSesiId) {
      setErrorPesan('Silakan pilih sesi praktikum terlebih dahulu.');
      return;
    }

    const hasil = catatPresensi(selectedSesiId, statusKehadiran, catatan);
    if (hasil.sukses) {
      setPesanSukses(hasil.pesan);
      setModalSuksesVisible(true);
      setCatatan('');
    } else {
      setErrorPesan(hasil.pesan);
    }
  };

  return (
    <ScreenContainer
      badge="Sprint 1"
      title="Pencatatan Presensi"
      description="Formulir pengisian kehadiran bagi praktikan saat sesi laboratorium sedang dibuka."
      docUrl="Sprint 1: Modul Presensi Praktikan"
    >
      {/* Jika peran aktif adalah Asisten, tampilkan notifikasi instruksi */}
      {peranAktif === 'asisten' && (
        <SectionCard
          title="Mode Asisten Praktikum"
          subtitle="Formulir presensi ini ditujukan untuk praktikan (mahasiswa). Anda dapat beralih ke peran Praktikan untuk menguji coba."
        >
          <TouchableOpacity
            style={styles.btnSwitchRole}
            onPress={() => gantiPeran('praktikan')}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-horizontal" size={16} color="#ffffff" />
            <Text style={styles.btnSwitchRoleText}>
              Beralih ke Peran Praktikan
            </Text>
          </TouchableOpacity>
        </SectionCard>
      )}

      {/* Formulir Presensi Praktikan */}
      <SectionCard
        title="Formulir Kehadiran Praktikan"
        subtitle={`Identitas Mahasiswa: ${penggunaAktif.nama} (${penggunaAktif.nomorInduk})`}
      >
        {sesiDibukaList.length === 0 ? (
          <EmptyState
            iconName="lock-closed-outline"
            title="Tidak Ada Sesi Dibuka"
            description="Saat ini belum ada sesi praktikum yang dibuka oleh asisten. Silakan tunggu hingga sesi dimulai."
          />
        ) : (
          <View style={styles.formContainer}>
            {/* Pilihan Sesi yang Sedang Dibuka */}
            <Text style={styles.formLabel}>Pilih Sesi Praktikum Aktif:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sesiPillRow}>
                {sesiDibukaList.map((sesi) => {
                  const isSelected = selectedSesiId === sesi.id;
                  const isDone = cekSudahPresensi(sesi.id, penggunaAktif.id);
                  return (
                    <TouchableOpacity
                      key={sesi.id}
                      style={[
                        styles.sesiPill,
                        isSelected && styles.sesiPillSelected,
                        isDone && styles.sesiPillDone,
                      ]}
                      onPress={() => {
                        setSelectedSesiId(sesi.id);
                        setErrorPesan('');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sesiPillHeader}>
                        <Text style={styles.sesiPillCode}>
                          {sesi.kodeMataKuliah} - {sesi.kelas}
                        </Text>
                        {isDone && (
                          <View style={styles.tagDone}>
                            <Text style={styles.tagDoneText}>Sudah Presensi</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.sesiPillTitle} numberOfLines={1}>
                        {sesi.namaPraktikum}
                      </Text>
                      <Text style={styles.sesiPillSub}>
                        {sesi.ruangLab} | {sesi.jamMulai} - {sesi.jamSelesai}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Peringatan jika sudah presensi pada sesi terpilih */}
            {sudahPresensi && (
              <View style={styles.alertWarning}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#fbbf24"
                />
                <Text style={styles.alertWarningText}>
                  Anda telah melakukan presensi pada sesi praktikum ini.
                  Presensi ganda tidak diperbolehkan.
                </Text>
              </View>
            )}

            {/* Pilihan Status Kehadiran */}
            <Text style={styles.formLabel}>Status Kehadiran:</Text>
            <View style={styles.statusOptionRow}>
              {(['HADIR', 'IZIN', 'SAKIT'] as StatusKehadiran[]).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusOptionBtn,
                    statusKehadiran === st && styles.statusOptionBtnActive,
                  ]}
                  onPress={() => setStatusKehadiran(st)}
                  disabled={sudahPresensi}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      statusKehadiran === st && styles.statusOptionTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input Keterangan / Catatan Tambahan */}
            <Text style={styles.formLabel}>Catatan Tambahan (Opsional):</Text>
            <TextInput
              style={[styles.textInput, sudahPresensi && styles.inputDisabled]}
              placeholder="Contoh: Hadir tepat waktu / Izin mengikuti lomba"
              placeholderTextColor="#64748b"
              value={catatan}
              onChangeText={setCatatan}
              editable={!sudahPresensi}
            />

            {/* Pesan Kesalahan Validasi */}
            {errorPesan.length > 0 && (
              <View style={styles.alertError}>
                <Ionicons name="close-circle-outline" size={16} color="#f87171" />
                <Text style={styles.alertErrorText}>{errorPesan}</Text>
              </View>
            )}

            {/* Tombol Simpan Presensi */}
            <TouchableOpacity
              style={[
                styles.btnSubmit,
                sudahPresensi && styles.btnSubmitDisabled,
              ]}
              onPress={handleKirimPresensi}
              disabled={sudahPresensi}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#ffffff"
              />
              <Text style={styles.btnSubmitText}>
                {sudahPresensi
                  ? 'Presensi Sudah Tercatat'
                  : 'Kirim Presensi Sekarang'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SectionCard>

      {/* Riwayat Kehadiran Pribadi */}
      <SectionCard
        title="Catatan Kehadiran Saya"
        subtitle={`Daftar riwayat presensi yang telah tercatat untuk ${penggunaAktif.nama}:`}
      >
        {riwayatSaya.length === 0 ? (
          <EmptyState
            iconName="calendar-outline"
            title="Belum Ada Riwayat Presensi"
            description="Anda belum memiliki catatan presensi pada praktikum yang sedang berjalan."
          />
        ) : (
          riwayatSaya.map((item) => {
            const sesiTerkait = daftarSesi.find((s) => s.id === item.sesiId);
            return (
              <View key={item.id} style={styles.riwayatCard}>
                <View style={styles.riwayatHeader}>
                  <View style={styles.riwayatCol}>
                    <Text style={styles.riwayatMk}>
                      {sesiTerkait?.namaPraktikum || 'Praktikum'}
                    </Text>
                    <Text style={styles.riwayatKelas}>
                      Kelas {item.kelasPraktikan} | NIM: {item.nimPraktikan}
                    </Text>
                  </View>
                  <View style={styles.badgeHadir}>
                    <Text style={styles.badgeHadirText}>
                      {item.statusKehadiran}
                    </Text>
                  </View>
                </View>

                <View style={styles.riwayatFooter}>
                  <View style={styles.riwayatMeta}>
                    <Ionicons name="time-outline" size={13} color="#94a3b8" />
                    <Text style={styles.riwayatTime}>{item.waktuPresensi}</Text>
                  </View>
                  {item.catatan && (
                    <Text style={styles.riwayatCatatan}>
                      Keterangan: {item.catatan}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </SectionCard>

      {/* Modal Dialog Umpan Balik Sukses */}
      <Modal
        visible={modalSuksesVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalSuksesVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="checkmark" size={32} color="#22c55e" />
            </View>

            <Text style={styles.modalTitle}>Presensi Berhasil Dicatat</Text>
            <Text style={styles.modalSub}>{pesanSukses}</Text>

            <View style={styles.modalSummaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nama Praktikan:</Text>
                <Text style={styles.summaryValue}>{penggunaAktif.nama}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>NIM:</Text>
                <Text style={styles.summaryValue}>
                  {penggunaAktif.nomorInduk}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Praktikum:</Text>
                <Text style={styles.summaryValue}>
                  {sesiDipilih?.namaPraktikum}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Status:</Text>
                <Text style={styles.summaryHighlight}>{statusKehadiran}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalBtnClose}
              onPress={() => setModalSuksesVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnCloseText}>Tutup Konfirmasi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  btnSwitchRole: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnSwitchRoleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 8,
    marginTop: 6,
  },
  sesiPillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  sesiPill: {
    backgroundColor: '#0a101f',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 220,
  },
  sesiPillSelected: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  sesiPillDone: {
    borderColor: '#22c55e',
  },
  sesiPillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sesiPillCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  tagDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagDoneText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ade80',
  },
  sesiPillTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  sesiPillSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  alertWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  alertWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#fbbf24',
    lineHeight: 16,
  },
  statusOptionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statusOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0a101f',
    alignItems: 'center',
  },
  statusOptionBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#38bdf8',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  statusOptionTextActive: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#0a101f',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
    marginBottom: 14,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  alertErrorText: {
    fontSize: 12,
    color: '#f87171',
  },
  btnSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnSubmitDisabled: {
    backgroundColor: '#334155',
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  riwayatCard: {
    backgroundColor: '#0a101f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  riwayatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  riwayatCol: {
    flex: 1,
  },
  riwayatMk: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  riwayatKelas: {
    fontSize: 12,
    color: '#94a3b8',
  },
  badgeHadir: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeHadirText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ade80',
  },
  riwayatFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  riwayatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riwayatTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  riwayatCatatan: {
    fontSize: 12,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#131b2e',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 2,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSummaryBox: {
    width: '100%',
    backgroundColor: '#0a101f',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },
  summaryHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4ade80',
  },
  modalBtnClose: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCloseText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
