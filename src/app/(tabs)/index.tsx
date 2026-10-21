/**
 * @file src/app/(tabs)/index.tsx
 * @description Layar Jadwal dan Detail Sesi Praktikum.
 * Area Kerja Utama: Pemrogram 1 (Pengelolaan Sesi & Alur Asisten).
 *
 * Tanggung Jawab Pemrogram 1:
 * - Menampilkan daftar jadwal praktikum beserta status sesi (DIBUKA, DITUTUP, SELESAI).
 * - Mengimplementasikan kontrol aksi bagi Asisten Praktikum:
 *   1. Membuka sesi yang berstatus DITUTUP melalui dialog modal.
 *   2. Menutup sesi yang berstatus DIBUKA melalui dialog konfirmasi modal.
 * - Memastikan perubahan status sesi terdistribusi secara reaktif ke seluruh aplikasi.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { JadwalSesi } from '@/types';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';
import { BadgeStatus } from '@/components/common/BadgeStatus';
import { RoleSelector } from '@/components/common/RoleSelector';
import { EmptyState } from '@/components/common/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function JadwalSesiScreen(): React.JSX.Element {
  const router = useRouter();
  const { peranAktif, penggunaAktif, daftarSesi, bukaSesi, tutupSesi } = useApp();

  // State modal aksi asisten (Buka / Tutup Sesi)
  const [selectedSesi, setSelectedSesi] = useState<JadwalSesi | null>(null);
  const [modalBukaVisible, setModalBukaVisible] = useState<boolean>(false);
  const [modalTutupVisible, setModalTutupVisible] = useState<boolean>(false);
  const [inputRuangLab, setInputRuangLab] = useState<string>('');

  /**
   * Handler untuk membuka dialog modal buka sesi
   */
  const handleBukaModalOpen = (sesi: JadwalSesi): void => {
    setSelectedSesi(sesi);
    setInputRuangLab(sesi.ruangLab);
    setModalBukaVisible(true);
  };

  /**
   * Handler konfirmasi pembukaan sesi oleh Asisten
   */
  const handleKonfirmasiBukaSesi = (): void => {
    if (selectedSesi) {
      bukaSesi(selectedSesi.id, inputRuangLab);
      setModalBukaVisible(false);
      setSelectedSesi(null);
    }
  };

  /**
   * Handler untuk membuka dialog konfirmasi tutup sesi
   */
  const handleTutupModalOpen = (sesi: JadwalSesi): void => {
    setSelectedSesi(sesi);
    setModalTutupVisible(true);
  };

  /**
   * Handler konfirmasi penutupan sesi oleh Asisten
   */
  const handleKonfirmasiTutupSesi = (): void => {
    if (selectedSesi) {
      tutupSesi(selectedSesi.id);
      setModalTutupVisible(false);
      setSelectedSesi(null);
    }
  };

  return (
    <ScreenContainer
      badge="Sprint 1"
      title="Jadwal & Sesi Praktikum"
      description="Pemantauan jadwal perkuliahan dan siklus sesi praktikum untuk Asisten dan Praktikan."
      docUrl="Sprint 1: Modul Pengelolaan Sesi"
    >
      {/* Pengalih Peran Pengguna (Untuk kemudahan pengujian sprint) */}
      <RoleSelector />

      {/* Informasi Pengguna Aktif */}
      <SectionCard
        title="Identitas Pengguna Aktif"
        subtitle="Sistem menyesuaikan aksi pada jadwal berdasarkan peran yang sedang aktif."
      >
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Ionicons
              name={peranAktif === 'asisten' ? 'briefcase' : 'school'}
              size={22}
              color="#38bdf8"
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{penggunaAktif.nama}</Text>
            <Text style={styles.profileSub}>
              {peranAktif === 'asisten'
                ? `Asisten Lab - ID: ${penggunaAktif.nomorInduk}`
                : `Mahasiswa - NIM: ${penggunaAktif.nomorInduk} (${penggunaAktif.kelas})`}
            </Text>
          </View>
        </View>
      </SectionCard>

      {/* Daftar Jadwal Praktikum */}
      <SectionCard
        title="Daftar Jadwal Praktikum"
        subtitle={
          peranAktif === 'asisten'
            ? 'Asisten dapat mengelola pembukaan dan penutupan sesi praktikum.'
            : 'Praktikan dapat melihat status sesi dan melakukan presensi saat sesi dibuka.'
        }
      >
        {daftarSesi.length === 0 ? (
          <EmptyState
            title="Tidak Ada Jadwal Sesi"
            description="Belum ada jadwal praktikum yang terdaftar dalam sistem."
          />
        ) : (
          daftarSesi.map((sesi) => (
            <View key={sesi.id} style={styles.sesiCard}>
              {/* Header Sesi */}
              <View style={styles.sesiHeader}>
                <View style={styles.sesiTitleCol}>
                  <Text style={styles.kodeMk}>{sesi.kodeMataKuliah}</Text>
                  <Text style={styles.namaMk}>{sesi.namaPraktikum}</Text>
                </View>
                <BadgeStatus status={sesi.status} />
              </View>

              {/* Rincian Sesi */}
              <View style={styles.detailBox}>
                <Text style={styles.topikText}>{sesi.topikMateri}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                    <Text style={styles.metaText}>
                      {sesi.hari}, {sesi.jamMulai} - {sesi.jamSelesai}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color="#94a3b8" />
                    <Text style={styles.metaText}>{sesi.ruangLab}</Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color="#94a3b8" />
                    <Text style={styles.metaText}>Kelas: {sesi.kelas}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color="#94a3b8" />
                    <Text style={styles.metaText}>Asisten: {sesi.namaAsisten}</Text>
                  </View>
                </View>
              </View>

              {/* Baris Tombol Aksi Sesuai Peran */}
              <View style={styles.actionContainer}>
                {peranAktif === 'asisten' ? (
                  // Sudut Pandang Asisten
                  <View style={styles.actionBtnRow}>
                    {sesi.status === 'DITUTUP' && (
                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnBuka]}
                        onPress={() => handleBukaModalOpen(sesi)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="play-outline" size={16} color="#ffffff" />
                        <Text style={styles.btnActionText}>Buka Sesi Praktikum</Text>
                      </TouchableOpacity>
                    )}

                    {sesi.status === 'DIBUKA' && (
                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnTutup]}
                        onPress={() => handleTutupModalOpen(sesi)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="stop-outline" size={16} color="#ffffff" />
                        <Text style={styles.btnActionText}>Tutup Sesi Praktikum</Text>
                      </TouchableOpacity>
                    )}

                    {sesi.status === 'SELESAI' && (
                      <View style={styles.infoCompleted}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={16}
                          color="#94a3b8"
                        />
                        <Text style={styles.infoCompletedText}>
                          Sesi praktikum telah selesai dilaksanakan.
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  // Sudut Pandang Praktikan
                  <View style={styles.actionBtnRow}>
                    {sesi.status === 'DIBUKA' ? (
                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnPresensi]}
                        onPress={() => router.push('/(tabs)/presensi')}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="checkbox-outline"
                          size={16}
                          color="#ffffff"
                        />
                        <Text style={styles.btnActionText}>
                          Lakukan Presensi Sekarang
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.infoWait}>
                        <Ionicons
                          name="information-circle-outline"
                          size={16}
                          color="#64748b"
                        />
                        <Text style={styles.infoWaitText}>
                          {sesi.status === 'DITUTUP'
                            ? 'Menunggu asisten membuka sesi praktikum.'
                            : 'Presensi untuk sesi ini telah ditutup.'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </SectionCard>

      {/* Modal Dialog: Pembukaan Sesi (Asisten) */}
      <Modal
        visible={modalBukaVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalBukaVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Konfirmasi Pembukaan Sesi</Text>
              <TouchableOpacity onPress={() => setModalBukaVisible(false)}>
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>
              Anda akan membuka sesi praktikum:
            </Text>
            <Text style={styles.modalHighlight}>
              {selectedSesi?.namaPraktikum} ({selectedSesi?.kelas})
            </Text>

            <Text style={styles.inputLabel}>Konfirmasi Ruang Laboratorium:</Text>
            <TextInput
              style={styles.modalInput}
              value={inputRuangLab}
              onChangeText={setInputRuangLab}
              placeholder="Contoh: Lab RPL 1"
              placeholderTextColor="#64748b"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalBukaVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSubmit}
                onPress={handleKonfirmasiBukaSesi}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnSubmitText}>Buka Sesi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Dialog: Penutupan Sesi (Asisten) */}
      <Modal
        visible={modalTutupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalTutupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Konfirmasi Penutupan Sesi</Text>
              <TouchableOpacity onPress={() => setModalTutupVisible(false)}>
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>
              Apakah Anda yakin ingin menutup sesi praktikum ini?
            </Text>
            <Text style={styles.modalHighlight}>
              {selectedSesi?.namaPraktikum} ({selectedSesi?.kelas})
            </Text>
            <Text style={styles.modalWarning}>
              Setelah sesi ditutup, praktikan tidak dapat lagi melakukan presensi
              kehadiran pada sesi ini.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalTutupVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnSubmit, styles.modalBtnDanger]}
                onPress={handleKonfirmasiTutupSesi}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnSubmitText}>Ya, Tutup Sesi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0a101f',
    borderWidth: 1,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  profileSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  sesiCard: {
    backgroundColor: '#0a101f',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sesiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  sesiTitleCol: {
    flex: 1,
  },
  kodeMk: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 2,
  },
  namaMk: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    lineHeight: 20,
  },
  detailBox: {
    backgroundColor: '#131b2e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  topikText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionContainer: {
    marginTop: 4,
  },
  actionBtnRow: {
    width: '100%',
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnBuka: {
    backgroundColor: '#16a34a', // Green 600
  },
  btnTutup: {
    backgroundColor: '#dc2626', // Red 600
  },
  btnPresensi: {
    backgroundColor: '#2563eb', // Blue 600
  },
  btnActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  infoCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  infoCompletedText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoWait: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  infoWaitText: {
    fontSize: 12,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  modalHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 14,
  },
  modalWarning: {
    fontSize: 12,
    color: '#f87171',
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0a101f',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
    marginBottom: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  modalBtnCancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBtnSubmit: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#16a34a',
  },
  modalBtnDanger: {
    backgroundColor: '#dc2626',
  },
  modalBtnSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
