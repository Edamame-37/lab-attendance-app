/**
 * @file src/app/(tabs)/index.tsx
 * @description Layar Jadwal dan Detail Sesi Praktikum.
 * Area Kerja Utama: Pemrogram 1 (Pengelolaan Sesi & Alur Asisten).
 *
 * Tanggung Jawab Pemrogram 1:
 * - Menampilkan daftar jadwal praktikum beserta status sesi (DIBUKA, DITUTUP, SELESAI).
 * - Mengimplementasikan kontrol aksi bagi Asisten Praktikum:
 *   1. Membuka sesi yang berstatus DITUTUP melalui dialog modal (OpenSessionModal).
 *   2. Menutup sesi yang berstatus DIBUKA melalui dialog konfirmasi modal (CloseSessionModal).
 * - Menampilkan kartu detail sesi modular (SessionControlCard) dengan metrik kehadiran real-time.
 * - Memastikan perubahan status sesi terdistribusi secara reaktif ke seluruh aplikasi.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { JadwalSesi } from '@/types';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';
import { RoleSelector } from '@/components/common/RoleSelector';
import { EmptyState } from '@/components/common/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { SessionControlCard } from '@/features/asisten/SessionControlCard';
import { OpenSessionModal } from '@/features/asisten/OpenSessionModal';
import { CloseSessionModal } from '@/features/asisten/CloseSessionModal';

export default function JadwalSesiScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    peranAktif,
    penggunaAktif,
    daftarSesi,
    bukaSesi,
    tutupSesi,
    ambilPresensiPerSesi,
  } = useApp();

  // State untuk sesi yang sedang dipilih untuk dibuka/ditutup
  const [selectedSesi, setSelectedSesi] = useState<JadwalSesi | null>(null);
  const [modalBukaVisible, setModalBukaVisible] = useState<boolean>(false);
  const [modalTutupVisible, setModalTutupVisible] = useState<boolean>(false);

  /**
   * Handler saat tombol 'Buka Sesi' pada kartu sesi ditekan oleh asisten
   */
  const handleBukaSesiTrigger = (sesi: JadwalSesi): void => {
    setSelectedSesi(sesi);
    setModalBukaVisible(true);
  };

  /**
   * Handler konfirmasi dari OpenSessionModal
   */
  const handleKonfirmasiBuka = (
    sesiId: string,
    ruangLab: string,
    _catatanPembuka?: string
  ): void => {
    bukaSesi(sesiId, ruangLab);
    setSelectedSesi(null);
  };

  /**
   * Handler saat tombol 'Tutup Sesi' pada kartu sesi ditekan oleh asisten
   */
  const handleTutupSesiTrigger = (sesi: JadwalSesi): void => {
    setSelectedSesi(sesi);
    setModalTutupVisible(true);
  };

  /**
   * Handler konfirmasi dari CloseSessionModal
   */
  const handleKonfirmasiTutup = (sesiId: string): void => {
    tutupSesi(sesiId);
    setSelectedSesi(null);
  };

  /**
   * Handler navigasi praktikan ke formulir presensi
   */
  const handleNavigasiPresensi = (_sesi: JadwalSesi): void => {
    router.push('/(tabs)/presensi');
  };

  // Menghitung jumlah praktikan yang telah presensi pada sesi terpilih
  const totalHadirSesiTerpilih = selectedSesi
    ? ambilPresensiPerSesi(selectedSesi.id).length
    : 0;

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
            <SessionControlCard
              key={sesi.id}
              sesi={sesi}
              peranAktif={peranAktif}
              onBukaSesi={handleBukaSesiTrigger}
              onTutupSesi={handleTutupSesiTrigger}
              onNavigasiPresensi={handleNavigasiPresensi}
            />
          ))
        )}
      </SectionCard>

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
        totalHadir={totalHadirSesiTerpilih}
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
});
