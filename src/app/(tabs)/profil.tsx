/**
 * @file src/app/(tabs)/profil.tsx
 * @description Layar Profil Pengguna dan Pengaturan Simulasi Peran Sprint 1.
 * Menyajikan identitas pengguna aktif, switcher akun, ringkasan statistik aktivitas peran,
 * modal panduan demonstrasi alur Sprint 1, serta arsitektur pembagian tugas 3 pemrogram.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';
import { RoleSelector } from '@/components/common/RoleSelector';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilScreen(): React.JSX.Element {
  const {
    peranAktif,
    penggunaAktif,
    daftarSesi,
    daftarPresensi,
    ambilRiwayatPraktikan,
    cekSudahPresensi,
  } = useApp();

  const [modalPanduanVisible, setModalPanduanVisible] =
    useState<boolean>(false);

  // Statistik ringkas aktivitas sesuai peran aktif
  const sesiDibukaCount = daftarSesi.filter(
    (s) => s.status === 'DIBUKA'
  ).length;
  const sesiSelesaiCount = daftarSesi.filter(
    (s) => s.status === 'SELESAI'
  ).length;

  const riwayatAktif = ambilRiwayatPraktikan(penggunaAktif.id);
  const sesiAktifBelumPresensiCount = daftarSesi.filter(
    (s) =>
      s.status === 'DIBUKA' && !cekSudahPresensi(s.id, penggunaAktif.id)
  ).length;

  return (
    <ScreenContainer
      badge="Sprint 1"
      title="Profil & Pengaturan Peran"
      description="Konfigurasi identitas pengguna aktif, statistik aktivitas sesi, dan panduan alur Sprint 1."
      docUrl="Sprint 1: Konfigurasi Identitas & Integrasi Sistem"
    >
      {/* Pengalih Peran dan Identitas */}
      <RoleSelector />

      {/* Rincian Identitas Pengguna Aktif */}
      <SectionCard
        title="Rincian Pengguna Aktif"
        subtitle="Data identitas yang sedang digunakan dalam sesi aplikasi saat ini:"
      >
        <View style={styles.detailContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama Lengkap:</Text>
            <Text style={styles.infoValue}>{penggunaAktif.nama}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {peranAktif === 'asisten'
                ? 'NIP / ID Asisten:'
                : 'NIM Mahasiswa:'}
            </Text>
            <Text style={styles.infoValue}>{penggunaAktif.nomorInduk}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Peran Sistem:</Text>
            <View style={styles.badgePeran}>
              <Text style={styles.badgePeranText}>
                {peranAktif === 'asisten'
                  ? 'ASISTEN PRAKTIKUM'
                  : 'PRAKTIKAN (MAHASISWA)'}
              </Text>
            </View>
          </View>
          {penggunaAktif.kelas && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kelas Terdaftar:</Text>
              <Text style={styles.infoValue}>{penggunaAktif.kelas}</Text>
            </View>
          )}
        </View>
      </SectionCard>

      {/* Ringkasan Statistik Aktivitas Peran Aktif */}
      <SectionCard
        title={
          peranAktif === 'asisten'
            ? 'Ringkasan Monitoring Asisten'
            : 'Ringkasan Aktivitas Praktikan'
        }
        subtitle={
          peranAktif === 'asisten'
            ? 'Ikhtisar status siklus sesi dan total presensi masuk:'
            : 'Ikhtisar catatan kehadiran pribadi dan sesi yang sedang berlangsung:'
        }
      >
        {peranAktif === 'asisten' ? (
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={18} color="#38bdf8" />
              <Text style={styles.statNumber}>{daftarSesi.length}</Text>
              <Text style={styles.statCaption}>Total Sesi</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="radio-button-on" size={18} color="#4ade80" />
              <Text style={[styles.statNumber, styles.textGreen]}>
                {sesiDibukaCount}
              </Text>
              <Text style={styles.statCaption}>Sesi Dibuka</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons
                name="checkmark-done-outline"
                size={18}
                color="#94a3b8"
              />
              <Text style={styles.statNumber}>{sesiSelesaiCount}</Text>
              <Text style={styles.statCaption}>Sesi Selesai</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={18} color="#fbbf24" />
              <Text style={[styles.statNumber, styles.textAmber]}>
                {daftarPresensi.length}
              </Text>
              <Text style={styles.statCaption}>Total Presensi</Text>
            </View>
          </View>
        ) : (
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#4ade80"
              />
              <Text style={[styles.statNumber, styles.textGreen]}>
                {riwayatAktif.length}
              </Text>
              <Text style={styles.statCaption}>Sudah Presensi</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={18} color="#fbbf24" />
              <Text style={[styles.statNumber, styles.textAmber]}>
                {sesiAktifBelumPresensiCount}
              </Text>
              <Text style={styles.statCaption}>Sesi Menunggu</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="book-outline" size={18} color="#38bdf8" />
              <Text style={styles.statNumber}>{daftarSesi.length}</Text>
              <Text style={styles.statCaption}>Jadwal Tersedia</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.btnGuide}
          onPress={() => setModalPanduanVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="information-circle-outline"
            size={17}
            color="#38bdf8"
          />
          <Text style={styles.btnGuideText}>
            Lihat Panduan Alur Demonstrasi Sprint 1
          </Text>
        </TouchableOpacity>
      </SectionCard>

      {/* Ringkasan Pembagian Tugas 3 Pemrogram Paralel */}
      <SectionCard
        title="Pembagian Kerja 3 Pemrogram (Paralel)"
        subtitle="Struktur arsitektur Sprint 1 yang telah disiapkan untuk kerja tim:"
      >
        <View style={styles.programmerCard}>
          <View style={styles.programmerHeader}>
            <Ionicons name="code-slash-outline" size={16} color="#38bdf8" />
            <Text style={styles.programmerTitle}>
              Pemrogram 1: Pengelolaan Sesi
            </Text>
          </View>
          <Text style={styles.programmerDesc}>
            Fokus: Siklus hidup sesi (Buka/Tutup Sesi), validasi asisten, modal
            konfirmasi, dan integrasi layar Jadwal Sesi.
          </Text>
        </View>

        <View style={styles.programmerCard}>
          <View style={styles.programmerHeader}>
            <Ionicons name="code-slash-outline" size={16} color="#4ade80" />
            <Text style={styles.programmerTitle}>
              Pemrogram 2: Presensi Praktikan
            </Text>
          </View>
          <Text style={styles.programmerDesc}>
            Fokus: Formulir presensi mahasiswa, validasi anti-duplikasi, modal
            umpan balik berhasil, dan riwayat presensi pribadi.
          </Text>
        </View>

        <View style={styles.programmerCard}>
          <View style={styles.programmerHeader}>
            <Ionicons name="code-slash-outline" size={16} color="#fbbf24" />
            <Text style={styles.programmerTitle}>
              Pemrogram 3: Rekap & Desain Bersama
            </Text>
          </View>
          <Text style={styles.programmerDesc}>
            Fokus: Modul RekapPresensiView (statistik ketercapaian, pencarian &
            filter status, modal detail), komponen bersama (BadgeStatus,
            EmptyState, RoleSelector), dan navigasi terpadu.
          </Text>
        </View>
      </SectionCard>

      {/* Modal Panduan Alur Demonstrasi Sprint 1 */}
      <Modal
        visible={modalPanduanVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalPanduanVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Alur Demonstrasi Terpadu Sprint 1
              </Text>
              <TouchableOpacity
                onPress={() => setModalPanduanVisible(false)}
              >
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.stepList}>
              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>
                    Asisten Membuka Sesi Praktikum
                  </Text>
                  <Text style={styles.stepDesc}>
                    Pilih peran Asisten Praktikum, buka tab Jadwal Sesi, lalu
                    buka sesi yang berstatus DITUTUP.
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>
                    Praktikan Melakukan Presensi
                  </Text>
                  <Text style={styles.stepDesc}>
                    Beralih ke peran Praktikan, buka tab Presensi, pilih sesi
                    yang DIBUKA, lalu kirim kehadiran.
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>
                    Asisten Memantau Rekapitulasi
                  </Text>
                  <Text style={styles.stepDesc}>
                    Buka tab Rekapitulasi untuk memeriksa daftar praktikan yang
                    hadir, rasio kelas, dan rincian waktu presensi.
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>
                    Asisten Menutup Sesi Praktikum
                  </Text>
                  <Text style={styles.stepDesc}>
                    Kembali ke tab Jadwal Sesi sebagai Asisten, lalu tutup sesi
                    hingga berstatus SELESAI.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalBtnClose}
              onPress={() => setModalPanduanVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnCloseText}>Tutup Panduan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  detailContainer: {
    backgroundColor: '#0a101f',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#131b2e',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  badgePeran: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePeranText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0a101f',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  textGreen: {
    color: '#4ade80',
  },
  textAmber: {
    color: '#fbbf24',
  },
  btnGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0a101f',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnGuideText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8',
  },
  programmerCard: {
    backgroundColor: '#0a101f',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  programmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  programmerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  programmerDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
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
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  stepList: {
    gap: 10,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0a101f',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  modalBtnClose: {
    backgroundColor: '#2563eb',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCloseText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
